import kv from '@vercel/kv'
import { type NextRequest, NextResponse } from 'next/server'

import { kvKeys } from '~/config/kv'
import { env } from '~/env.mjs'
import countries from '~/lib/countries.json'

export const config = {
  matcher: '/',
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
    await kv.set(kvKeys.currentVisitor, { country, city, flag })
  }

  return NextResponse.next()
}
