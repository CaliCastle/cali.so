import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import {
  caliBabyPageMetadata,
  getCaliBabyPublicContent,
  type CaliBabyPageKind,
} from './calibaby-public-content'
import { seo } from './seo'

const expected = [
  ['zh', 'support', '/calibaby', 'Cali 宝宝助手'],
  ['en', 'support', '/en/calibaby', 'Cali Baby'],
  ['zh', 'privacy', '/calibaby/privacy', 'Cali 宝宝助手隐私政策'],
  ['en', 'privacy', '/en/calibaby/privacy', 'Cali Baby Privacy Policy'],
  ['zh', 'terms', '/calibaby/terms', 'Cali 宝宝助手使用条款'],
  ['en', 'terms', '/en/calibaby/terms', 'Cali Baby Terms of Use'],
] as const satisfies ReadonlyArray<
  readonly ['zh' | 'en', CaliBabyPageKind, string, string]
>

describe('Cali Baby public content', () => {
  it.each(expected)(
    'extracts the approved %s %s page',
    (locale, kind, route, title) => {
      const content = getCaliBabyPublicContent(locale, kind)

      expect(content.route).toBe(route)
      expect(content.title).toBe(title)
      expect(content.metadataTitle).toContain(locale === 'en' ? 'Cali Baby' : 'Cali 宝宝助手')
      expect(content.metadataDescription.length).toBeGreaterThan(20)
      expect(content.body).not.toContain('Metadata title:')
      expect(content.body).not.toContain('\n---')
    },
  )

  it.each(expected)(
    'publishes paired metadata for %s %s while publication gates remain closed',
    (locale, kind, route) => {
      const metadata = caliBabyPageMetadata(locale, kind)
      const canonical = metadata.alternates?.canonical
      const languages = metadata.alternates?.languages

      expect(canonical?.toString()).toBe(new URL(route, seo.url).href)
      expect(languages).toEqual({
        'zh-CN': new URL(
          kind === 'support' ? '/calibaby' : `/calibaby/${kind}`,
          seo.url,
        ).href,
        en: new URL(
          kind === 'support' ? '/en/calibaby' : `/en/calibaby/${kind}`,
          seo.url,
        ).href,
        'x-default': new URL(
          kind === 'support' ? '/calibaby' : `/calibaby/${kind}`,
          seo.url,
        ).href,
      })
      expect(metadata.robots).toEqual({ index: false, follow: true })
      expect(metadata.openGraph?.siteName).toBe('Cali Baby')
      expect(metadata.openGraph?.images).toEqual([
        expect.objectContaining({
          url: new URL(
            `/og?locale=${locale}&path=${encodeURIComponent(
              kind === 'support' ? '/calibaby' : `/calibaby/${kind}`,
            )}`,
            seo.url,
          ),
          width: 1200,
          height: 630,
          type: 'image/png',
        }),
      ])
      expect(metadata.twitter).toEqual(
        expect.objectContaining({
          card: 'summary_large_image',
          title: metadata.title,
          description: metadata.description,
        }),
      )
    },
  )
})
