import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { get } from '@vercel/edge-config'
import { type NextRequest, NextResponse } from 'next/server'

import { kvKeys } from '~/config/kv'
import { env } from '~/env.mjs'
import countries from '~/lib/countries.json'
import { type Database } from '~/lib/database.types'
import { getIP } from '~/lib/ip'
import { redis } from '~/lib/redis'

export const config = {
  matcher: ['/((?!_next|studio|.*\\..*).*)'],
}

export async function middleware(req: NextRequest) {
  const { geo, nextUrl } = req

  const blockedIPs = await get<string[]>('blocked_ips')
  const ip = getIP(req)
  const isApi = nextUrl.pathname.startsWith('/api/')

  if (blockedIPs?.includes(ip)) {
    if (isApi) {
      return NextResponse.json(
        { error: 'You have been blocked.' },
        { status: 403 }
      )
    }

    nextUrl.pathname = '/blocked'
    return NextResponse.rewrite(nextUrl)
  }

  if (nextUrl.pathname === '/blocked') {
    nextUrl.pathname = '/'
    return NextResponse.redirect(nextUrl)
  }

  if (nextUrl.pathname === '/feed' || nextUrl.pathname === '/rss') {
    nextUrl.pathname = '/feed.xml'
    return NextResponse.rewrite(nextUrl)
  }

  if (geo && !isApi && env.VERCEL_ENV === 'production') {
    const country = geo.country
    const city = geo.city

    const countryInfo = countries.find((x) => x.cca2 === country)
    if (!countryInfo) {
      return NextResponse.next()
    }

    const flag = countryInfo.flag
    await redis.set(kvKeys.currentVisitor, { country, city, flag })
  }

  const res = NextResponse.next()
  const supabase = createMiddlewareClient<Database>({ req, res })
  await supabase.auth.getSession()

  return res
}
