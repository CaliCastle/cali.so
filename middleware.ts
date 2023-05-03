import { type NextRequest, NextResponse } from 'next/server'

import { kvKeys } from '~/config/kv'
import { env } from '~/env.mjs'
import countries from '~/lib/countries.json'
import { redis } from '~/lib/redis'

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)'],
}

export async function middleware(req: NextRequest) {
  const { geo } = req
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
