import { Ratelimit } from '@upstash/ratelimit'
import { revalidateTag } from 'next/cache'
import { type NextRequest, NextResponse } from 'next/server'

import { redis } from '~/lib/redis'

export const runtime = 'edge'

function getKey(id: string) {
  return `reactions:${id}`
}

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, '10 s'),
  analytics: true,
})

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return new Response('Missing id', { status: 400 })

  const value = await redis.get<number[]>(`reactions:${id}`)
  if (!value) {
    await redis.set(getKey(id), [0, 0, 0, 0])
  }

  const { success } = await ratelimit.limit(getKey(id) + `_${req.ip ?? ''}`)
  if (!success) {
    return new Response('Too Many Requests', {
      status: 429,
    })
  }

  return NextResponse.json(value ?? [0, 0, 0, 0])
}

export async function PATCH(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  const index = searchParams.get('index')
  if (!id || !index || !(parseInt(index) >= 0 && parseInt(index) < 4)) {
    return new Response('Missing id or index', { status: 400 })
  }

  const key = getKey(id)

  const { success } = await ratelimit.limit(key + `_${req.ip ?? ''}`)
  if (!success) {
    return new Response('Too Many Requests', {
      status: 429,
    })
  }

  let current = await redis.get<number[]>(key)
  if (!current) {
    current = [0, 0, 0, 0]
  }
  // increment the array value at the index
  current[parseInt(index)] += 1

  await redis.set(key, current)

  revalidateTag(key)

  return NextResponse.json({
    data: current,
  })
}
