import * as cheerio from 'cheerio'
import { type NextRequest, NextResponse } from 'next/server'

import { redis } from '~/lib/redis'

export const runtime = 'edge'
export const revalidate = 60 * 60 * 24 // 1 day

function getKey(url: string) {
  return `favicon:${url}`
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const url = searchParams.get('url')

  if (!url) {
    return NextResponse.error()
  }

  try {
    const cachedFavicon = await redis.get<string>(getKey(url))
    if (cachedFavicon) {
      return NextResponse.json({ iconUrl: cachedFavicon })
    }

    const res = await fetch(url, {
      headers: {
        'Content-Type': 'text/html',
      },
      cache: 'force-cache',
    })

    let iconUrl = ''
    if (res.ok) {
      const html = await res.text()
      const $ = cheerio.load(html)
      const appleTouchIcon = $('link[rel="apple-touch-icon"]').attr('href')
      const favicon = $('link[rel="icon"]').attr('href')
      const finalFavicon = appleTouchIcon ?? favicon
      if (finalFavicon) {
        // absolute url
        if (finalFavicon.startsWith('http') || finalFavicon.startsWith('//')) {
          iconUrl = finalFavicon
        }

        iconUrl = new URL(finalFavicon, url).href
      }
    }

    await redis.set(getKey(url), iconUrl, { ex: revalidate })

    return NextResponse.json({ iconUrl })
  } catch (e) {
    console.error(e)
  }

  return NextResponse.error()
}
