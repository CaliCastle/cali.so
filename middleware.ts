import { get } from '@vercel/edge-config'
import { type NextRequest, NextResponse } from 'next/server'

import { kvKeys } from '~/config/kv'
import { env } from '~/env.mjs'
import countries from '~/lib/countries.json'
import { getIP } from '~/lib/ip'
import { redis } from '~/lib/redis'

export const config = {
  matcher: ['/((?!api|_next|studio|.*\\..*).*)'],
}

export async function middleware(req: NextRequest) {
  const { geo, nextUrl } = req

  const blockedIPs = await get<string[]>('blocked_ips')
  const ip = getIP(req)

  if (blockedIPs?.includes(ip)) {
    nextUrl.pathname = '/blocked'
    return NextResponse.rewrite(nextUrl)
  }

  if (nextUrl.pathname === '/blocked') {
    nextUrl.pathname = '/'
    return NextResponse.redirect(nextUrl)
  }

  if (geo && env.VERCEL_ENV === 'production') {
    const country = geo.country
    const city = geo.city

    const countryInfo = countries.find((x) => x.cca2 === country)
    if (!countryInfo) {
      return NextResponse.next()
    }

    const flag = countryInfo.flag
    await redis.set(kvKeys.currentVisitor, { country, city, flag })
  }

  return NextResponse.next()
}
