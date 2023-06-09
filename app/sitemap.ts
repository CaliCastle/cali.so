import { type MetadataRoute } from 'next'

import { url } from '~/lib'
import { getAllLatestBlogPostSlugs } from '~/sanity/queries'

export default async function sitemap() {
  const staticMap = [
    {
      url: url('/').href,
      lastModified: new Date(),
    },
    {
      url: url('/blog').href,
      lastModified: new Date(),
    },
    {
      url: url('/projects').href,
      lastModified: new Date(),
    },
    {
      url: url('/guestbook').href,
      lastModified: new Date(),
    },
  ] satisfies MetadataRoute.Sitemap

  const slugs = await getAllLatestBlogPostSlugs()

  const dynamicMap = slugs.map((slug) => ({
    url: url(`/blog/${slug}`).href,
    lastModified: new Date(),
  })) satisfies MetadataRoute.Sitemap

  return [...staticMap, ...dynamicMap]
}

export const runtime = 'edge'
export const revalidate = 60
