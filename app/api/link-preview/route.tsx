import { ImageResponse, type NextRequest, NextResponse } from 'next/server'

import { env } from '~/env.mjs'
import { ratelimit } from '~/lib/redis'

const width = 1200
const height = 750

export const runtime = 'edge'
export const revalidate = 3600 // 1 hour

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const url = searchParams.get('url')

  if (!url || !env.LINK_PREVIEW_API_BASE_URL) {
    return NextResponse.error()
  }

  const { success } = await ratelimit.limit('link-preview_', req)
  if (!success) {
    return NextResponse.error()
  }

  const imageUrl = new URL(`${env.LINK_PREVIEW_API_BASE_URL}/jpeg`)
  imageUrl.searchParams.set('url', url)
  imageUrl.searchParams.set('width', width.toString())
  imageUrl.searchParams.set('height', height.toString())
  imageUrl.searchParams.set('ttl', '86400')

  return new ImageResponse(
    (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageUrl.toString()}
        alt={`Preview of ${url}`}
        width={width}
        height={height}
      />
    ),
    {
      width,
      height,
    }
  )
}
