import { describe, expect, it } from 'vitest'

import { buildEnglishFeedXml } from '~/lib/feeds'
import { getAllPosts } from '~/lib/content'
import { archivedNewsletterIds } from '~/lib/newsletters'
import { seo } from '~/lib/seo'

import robots from './robots'
import sitemap from './sitemap'

describe('localized discovery routes', () => {
  it('publishes an explicit crawler policy for public and private surfaces', () => {
    expect(robots()).toEqual({
      rules: {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/api/admin',
          '/confirm/',
          '/en/confirm/',
          '/ama/manage/',
          '/en/ama/manage/',
        ],
      },
      sitemap: new URL('/sitemap.xml', seo.url).href,
      host: seo.url.origin,
    })
  })

  it('publishes English feed item URLs under /en while keeping the feed endpoint', async () => {
    const xml = buildEnglishFeedXml()

    expect(xml).toContain(
      `<atom:link href="${new URL('/feed.en.xml', seo.url).href}" rel="self"`,
    )
    expect(xml).toContain(`<link>${new URL('/en', seo.url).href}</link>`)
    for (const post of getAllPosts()) {
      const url = new URL(`/en/blog/${post.slug}`, seo.url).href
      expect(xml).toContain(`<guid isPermaLink="false">${url}</guid>`)
      expect(xml).toContain(`<link>${url}</link>`)
    }
  })

  it('publishes every public Chinese and English route with language alternates', () => {
    const entries = sitemap()
    const expectedPaths = [
      '/',
      '/blog',
      '/photos',
      '/projects',
      '/ama',
      '/calibaby',
      '/calibaby/help',
      '/calibaby/privacy',
      '/calibaby/terms',
      ...archivedNewsletterIds.map((id) => `/newsletters/${id}`),
      ...getAllPosts().map((post) => `/blog/${post.slug}`),
    ]

    for (const path of expectedPaths) {
      const zh = new URL(path, seo.url).href
      const en = new URL(path === '/' ? '/en' : `/en${path}`, seo.url).href

      for (const url of [zh, en]) {
        expect(entries).toContainEqual(
          expect.objectContaining({
            url,
            alternates: {
              languages: {
                'zh-CN': zh,
                en,
                'x-default': zh,
              },
            },
          }),
        )
      }
    }
  })
})
