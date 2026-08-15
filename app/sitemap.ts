import type { MetadataRoute } from 'next'

import { getAllPosts } from '~/lib/content'
import { localeRoutePair } from '~/lib/locale-metadata'
import { archivedNewsletterIds } from '~/lib/newsletters'

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getAllPosts()
  // newest first per getAllPosts — the site "changed" when the latest post landed
  const latest = posts[0]?.publishedAt

  const pairedEntry = (path: string, lastModified?: Date): MetadataRoute.Sitemap => {
    const pair = localeRoutePair(path)
    const alternates = { languages: pair.languages }

    return [
      { url: pair.zh.href, lastModified, alternates },
      { url: pair.en.href, lastModified, alternates },
    ]
  }

  return [
    ...pairedEntry('/', latest),
    ...pairedEntry('/blog', latest),
    ...pairedEntry('/photos', latest),
    ...pairedEntry('/projects', latest),
    ...pairedEntry('/ama'),
    ...pairedEntry('/calibaby'),
    ...pairedEntry('/calibaby/help'),
    ...pairedEntry('/calibaby/privacy'),
    ...pairedEntry('/calibaby/terms'),
    ...archivedNewsletterIds.flatMap((id) => pairedEntry(`/newsletters/${id}`)),
    ...posts.flatMap((post) => pairedEntry(`/blog/${post.slug}`, post.publishedAt)),
  ]
}
