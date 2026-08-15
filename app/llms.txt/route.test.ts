import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import { CALI_BABY_APP_STORE_URL } from '~/lib/calibaby-public-content'
import { getAllPosts } from '~/lib/content'
import { archivedNewsletterIds } from '~/lib/newsletters'
import { projects } from '~/lib/projects'
import { seo } from '~/lib/seo'

import { buildLlmsText } from './route'

describe('llms.txt', () => {
  it('publishes a concise Markdown map of every public content family', () => {
    const text = buildLlmsText()

    expect(text).toMatch(/^# Cali Castle and Cali Baby\n\n>/)
    expect(text.length).toBeGreaterThan(50)
    expect(text).toContain(CALI_BABY_APP_STORE_URL)

    for (const path of [
      '/',
      '/en',
      '/calibaby',
      '/en/calibaby',
      '/calibaby/help',
      '/en/calibaby/help',
      '/calibaby/privacy',
      '/en/calibaby/privacy',
      '/calibaby/terms',
      '/en/calibaby/terms',
    ]) {
      expect(text).toContain(`](${new URL(path, seo.url).href})`)
    }

    for (const post of getAllPosts()) {
      expect(text).toContain(new URL(`/blog/${post.slug}`, seo.url).href)
      expect(text).toContain(new URL(`/en/blog/${post.slug}`, seo.url).href)
    }

    for (const id of archivedNewsletterIds) {
      expect(text).toContain(new URL(`/newsletters/${id}`, seo.url).href)
      expect(text).toContain(new URL(`/en/newsletters/${id}`, seo.url).href)
    }

    for (const project of projects) {
      expect(text).toContain(new URL(project.url, seo.url).href)
    }
  })
})
