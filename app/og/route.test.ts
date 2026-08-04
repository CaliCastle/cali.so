import { describe, expect, it, vi } from 'vitest'

const { createCaliBabyOgImage } = vi.hoisted(() => ({
  createCaliBabyOgImage: vi.fn(async () => new Response('image')),
}))

vi.mock('~/lib/content', () => ({
  getPost: vi.fn(),
  isPostSlug: vi.fn(() => false),
}))

vi.mock('~/lib/newsletters', () => ({
  getArchivedNewsletter: vi.fn(),
  isArchivedNewsletterId: vi.fn(() => false),
}))

vi.mock('~/lib/og-image', () => ({
  createCaliBabyOgImage,
  createHomeOgImage: vi.fn(),
  createNewsletterOgImage: vi.fn(),
  createPostOgImage: vi.fn(),
  createSectionOgImage: vi.fn(),
}))

import { GET } from './route'

describe('Cali Baby OG image route', () => {
  it.each(['zh', 'en'] as const)(
    'uses the %s App Store badge for Cali Baby pages',
    async (locale) => {
      await GET(
        new Request(
          `https://cali.so/og?locale=${locale}&path=%2Fcalibaby`,
        ),
      )

      expect(createCaliBabyOgImage).toHaveBeenLastCalledWith(locale)
    },
  )
})
