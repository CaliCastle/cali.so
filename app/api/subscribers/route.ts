import { sql } from 'drizzle-orm'
import { NextResponse } from 'next/server'

import { db } from '~/db'

export async function GET() {
  const {
    rows: [count],
  } = await db.execute(
    sql`SELECT 
    (SELECT COUNT(*) FROM subscribers WHERE subscribed_at IS NOT NULL) as subscribers`
  )

  if (typeof count !== 'undefined' && 'subscribers' in count) {
    return NextResponse.json({
      count: count.subscribers,
    })
  }

  return NextResponse.error()
}

export const runtime = 'edge'
export const revalidate = 60
