import { groq } from 'next-sanity'

import { getDate } from '~/lib/date'
import { clientFetch } from '~/sanity/lib/client'
import { type Post } from '~/sanity/schemas/post'
import { type Project } from '~/sanity/schemas/project'

export const getAllLatestBlogPostSlugsQuery = () =>
  groq`
  *[_type == "post" && !(_id in path("drafts.**"))
  && publishedAt <="${getDate().toISOString()}"
  && defined(slug.current)] | order(publishedAt desc).slug.current
  `

export const getAllLatestBlogPostSlugs = () => {
  return clientFetch<string[]>(getAllLatestBlogPostSlugsQuery())
}

export const getLatestBlogPostsQuery = (limit = 5) =>
  groq`
  *[_type == "post" && !(_id in path("drafts.**")) && publishedAt <= "${getDate().toISOString()}"
  && defined(slug.current)][0...${limit}] | order(publishedAt desc) {
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
export const getLatestBlogPosts = (limit = 5) => {
  return clientFetch<Post[]>(getLatestBlogPostsQuery(limit))
}

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
    mood,
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

export const getSettingsQuery = () =>
  groq`
  *[_type == "settings"][0] {
    "projects": projects[]->{
      _id,
      name,
      url,
      description,
      icon
    }
}`
export const getSettings = () =>
  clientFetch<{ projects: Project[] }>(getSettingsQuery())
