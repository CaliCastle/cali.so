import RSS from 'rss'

import { getAllPosts } from '~/lib/content'
import { seo, seoEn } from '~/lib/seo'

export function buildChineseFeedXml() {
  const feed = new RSS({
    title: seo.title,
    description: seo.description,
    site_url: seo.url.href,
    feed_url: `${seo.url.href}feed.xml`,
    language: 'zh-CN',
    // RSS <image> wants a small square channel logo, not the 1200×630 OG
    image_url: `${seo.url.href}images/avatar.png`,
    generator: 'PHP 9.0',
  })

  for (const post of getAllPosts()) {
    const url = `${seo.url.href}blog/${post.slug}`
    feed.item({
      title: post.title,
      guid: url,
      url,
      description: post.description ?? '',
      date: post.publishedAt,
      ...(post.cover && {
        enclosure: { url: new URL(post.cover.src, seo.url).href },
      }),
    })
  }

  return feed.xml()
}

export function buildEnglishFeedXml() {
  const siteUrl = new URL('/en', seoEn.url).href

  const feed = new RSS({
    title: seoEn.title,
    description: seoEn.description,
    site_url: siteUrl,
    feed_url: `${seoEn.url.href}feed.en.xml`,
    language: 'en-US',
    image_url: `${seoEn.url.href}images/avatar.png`,
    generator: 'PHP 9.0',
  })

  for (const post of getAllPosts()) {
    const url = new URL(`/en/blog/${post.slug}`, seoEn.url).href
    feed.item({
      title: post.titleEn,
      guid: url,
      url,
      description: post.descriptionEn,
      date: post.publishedAt,
      ...(post.cover && {
        enclosure: { url: new URL(post.cover.src, seoEn.url).href },
      }),
    })
  }

  return feed.xml()
}
