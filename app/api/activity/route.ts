import { NextResponse } from 'next/server'

import { redis } from '~/lib/redis'

export const runtime = 'edge'

export async function GET() {
  const app = await redis.get('activity:app')

  return NextResponse.json({
    app,
  })
}
