import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('next/cache', () => ({
  cacheLife: () => undefined,
}))

import { GET } from './route'

const request = () =>
  new Request(
    'https://cali.so/link-media/favicon?url=https%3A%2F%2Fastro.build',
  )

const context = () => ({
  params: Promise.resolve({ kind: 'favicon' }),
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('link media proxy', () => {
  it('serves valid upstream images with the long-lived media cache contract', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(new Uint8Array([137, 80, 78, 71]), {
          headers: {
            'content-type': 'image/png',
            'content-length': '4',
          },
        }),
      ),
    )

    const response = await GET(request(), context())

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe('image/png')
    expect(response.headers.get('cache-control')).toBe(
      'public, max-age=86400, s-maxage=604800, stale-while-revalidate=604800',
    )
    await expect(response.arrayBuffer()).resolves.toEqual(
      new Uint8Array([137, 80, 78, 71]).buffer,
    )
  })

  it.each([404, 500])(
    'degrades an upstream %s to a short-lived missing asset',
    async (status) => {
      vi.stubGlobal(
        'fetch',
        vi.fn(async () => new Response('upstream failure', { status })),
      )

      const response = await GET(request(), context())

      expect(response.status).toBe(404)
      expect(response.headers.get('cache-control')).toBe(
        'public, max-age=60',
      )
    },
  )

  it('degrades an upstream timeout to a short-lived missing asset', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new DOMException('The operation timed out', 'TimeoutError')
      }),
    )

    const response = await GET(request(), context())

    expect(response.status).toBe(404)
    expect(response.headers.get('cache-control')).toBe('public, max-age=60')
  })

  it('degrades an unexpected upstream content type to a short-lived missing asset', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response('<html>not an image</html>', {
          headers: { 'content-type': 'text/html' },
        }),
      ),
    )

    const response = await GET(request(), context())

    expect(response.status).toBe(404)
    expect(response.headers.get('cache-control')).toBe('public, max-age=60')
  })
})
