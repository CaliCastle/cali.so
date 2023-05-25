import { Feed } from 'feed'

import { seo } from '~/lib/seo'
import { getLatestBlogPosts } from '~/sanity/queries'

export const revalidate = 60 * 60 * 12 // 12 hours

export async function GET() {
  const feed = new Feed({
    title: seo.title,
    description: seo.description,
    id: seo.url.href,
    link: seo.url.href,
    language: 'zh-CN',
    image: `${seo.url.href}opengraph-image.png`,
    favicon: `${seo.url.href}icon.png`,
    copyright: '版权所有 2023, Cali Castle',
    generator: 'PHP 9.0',
    author: {
      name: 'Cali Castle',
      email: 'hi@cali.so',
      link: seo.url.href,
    },
  })

  const data = await getLatestBlogPosts(999)
  if (!data) {
    return new Response('Not found', { status: 404 })
  }

  data.forEach((post) => {
    feed.addItem({
      title: post.title,
      id: post._id,
      link: `${seo.url.href}blog/${post.slug}`,
      description: post.description,
      date: new Date(post.publishedAt),
      image: post.mainImage.asset.url,
    })
  })

  return new Response(feed.rss2(), {
    headers: {
      'content-type': 'application/xml; charset=utf-8',
    },
  })
}
