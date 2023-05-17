import { groq } from 'next-sanity'

import { clientFetch } from '~/sanity/lib/client'
import { type Post } from '~/sanity/schemas/post'

export const getLatestBlogPostsQuery = (limit = 5) =>
  groq`
  *[_type == "post" && !(_id in path("drafts.**")) && publishedAt <= "${
    new Date().toISOString().split('T')[0]
  }" && defined(slug.current)][0...${limit}] | order(publishedAt desc) {
    _id,
    title,
    "slug": slug.current,
    "categories": categories[]->title,
    description,
    publishedAt,
    readingTime,
    mainImage {
      _ref,
      asset->{
        url,
        "lqip": metadata.lqip
      }
    }
  }`
export const getLatestBlogPosts = (limit = 5) =>
  clientFetch<Post[]>(getLatestBlogPostsQuery(limit))

export const getBlogPostQuery = (slug: string) =>
  groq`
  *[_type == "post" && slug.current == "${slug}" && !(_id in path("drafts.**"))][0] {
    _id,
    title,
    "slug": slug.current,
    "categories": categories[]->title,
    description,
    publishedAt,
    readingTime,
    body[] {
      ...,
      _type == "image" => {
        "url": asset->url,
        "lqip": asset->metadata.lqip,
        "dimensions": asset->metadata.dimensions
      }
    },
    mainImage {
      _ref,
      asset->{
        url,
        "lqip": metadata.lqip
      }
    }
  }`
export const getBlogPost = (slug: string) =>
  clientFetch<Post | undefined>(getBlogPostQuery(slug))
