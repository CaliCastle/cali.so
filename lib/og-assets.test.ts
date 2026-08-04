import { describe, expect, it, vi } from 'vitest'

vi.mock('next/cache', () => ({ cacheLife: vi.fn() }))

import { publicImageDataUri } from './og'

describe('OG image assets', () => {
  it('embeds the official App Store badge as SVG', async () => {
    const badge = await publicImageDataUri(
      '/images/calibaby/app-store-badge-en-us.svg',
    )

    expect(badge).toMatch(/^data:image\/svg\+xml;base64,/)
  })
})
