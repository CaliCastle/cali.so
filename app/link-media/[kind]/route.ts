import { cacheLife } from 'next/cache'

import { upstreamLinkMediaUrl } from '~/lib/link-media'

// Link media are small; the cap defends the data cache against a
// pathological upstream response.
const MAX_MEDIA_BYTES = 4 * 1024 * 1024

// Server-side cache for proxied link favicons and Open Graph images:
// entries live in the data cache and refresh in the background, so the
// browser talks only to this origin and repeat views never re-fetch
// upstream. Expected upstream failures are values, not exceptions, and
// are cached only briefly so they neither flood production errors nor
// pin a missing asset after the service recovers.
async function fetchLinkMedia(upstream: string) {
  'use cache'
  let media: { body: Uint8Array<ArrayBuffer>; contentType: string } | null = null

  try {
    const res = await fetch(upstream, { signal: AbortSignal.timeout(10_000) })
    const contentType = res.headers.get('content-type')?.trim() ?? ''

    // Reject an oversized *declared* length before buffering the body at
    // all; an absent or non-numeric header falls through to the
    // post-buffer check below.
    const declaredLength = Number(res.headers.get('content-length'))
    const declaredLengthIsSafe =
      !Number.isFinite(declaredLength) || declaredLength <= MAX_MEDIA_BYTES

    if (
      res.ok &&
      contentType.toLowerCase().startsWith('image/') &&
      declaredLengthIsSafe
    ) {
      const body = new Uint8Array(await res.arrayBuffer())
      if (body.byteLength && body.byteLength <= MAX_MEDIA_BYTES) {
        media = { body, contentType }
      }
    }
  } catch {
    // Network failures, timeouts, and interrupted bodies are expected for
    // optional third-party media. The missing-media response below is the
    // observable contract.
  }

  if (!media) {
    cacheLife({ stale: 30, revalidate: 1, expire: 60 })
    return null
  }

  cacheLife({ stale: 86_400, revalidate: 604_800, expire: 2_592_000 })
  return media
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ kind: string }> },
) {
  const { kind } = await params
  const target = new URL(request.url).searchParams.get('url')
  const upstream = target ? upstreamLinkMediaUrl(kind, target) : null
  if (!upstream) {
    // cacheable briefly so probe traffic doesn't re-hit the server
    return new Response('Not found', {
      status: 404,
      headers: { 'Cache-Control': 'public, max-age=300' },
    })
  }

  const media = await fetchLinkMedia(upstream)
  if (!media) {
    // A missing asset keeps the existing non-blocking <img> error path
    // without turning an optional upstream failure into a production 5xx.
    return new Response('Not found', {
      status: 404,
      headers: { 'Cache-Control': 'public, max-age=60' },
    })
  }

  return new Response(media.body, {
    headers: {
      'Content-Type': media.contentType,
      // browsers keep a copy for a day, the CDN for a week (serving
      // stale while it refreshes against the data cache). The strict
      // media CSP (sandbox) comes from next.config.ts, which already
      // sends the global security headers — setting it here as well
      // would emit a duplicate Content-Security-Policy header.
      'Cache-Control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=604800',
    },
  })
}
