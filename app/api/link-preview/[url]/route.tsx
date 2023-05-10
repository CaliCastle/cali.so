import { ImageResponse, type NextRequest, NextResponse } from 'next/server'

import { env } from '~/env.mjs'

const width = 1200
const height = 630

export const runtime = 'edge'
export const revalidate = 60 * 60 // 1 hour

export function GET(
  req: NextRequest,
  {
    params: { url },
  }: {
    params: { url: string }
  }
) {
  console.log('url', url)
  if (!url) {
    return NextResponse.error()
  }

  const imageUrl = new URL(`${env.LINK_PREVIEW_API_BASE_URL}/jpeg`)
  imageUrl.searchParams.set('url', url)
  imageUrl.searchParams.set('width', width.toString())
  imageUrl.searchParams.set('height', height.toString())
  imageUrl.searchParams.set('ttl', '86400')

  return new ImageResponse(
    (
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
