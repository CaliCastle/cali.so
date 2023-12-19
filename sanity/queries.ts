import { groq } from 'next-sanity'

import { getDate } from '~/lib/date'
import { clientFetch } from '~/sanity/lib/client'
import { type Post, type PostDetail } from '~/sanity/schemas/post'
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

type GetBlogPostsOptions = {
  limit?: number
  offset?: number
  forDisplay?: boolean
}
export const getLatestBlogPostsQuery = ({
  limit = 5,
  forDisplay = true,
}: GetBlogPostsOptions) =>
  groq`
  *[_type == "post" && !(_id in path("drafts.**")) && publishedAt <= "${getDate().toISOString()}"
  && defined(slug.current)] | order(publishedAt desc)[0...${limit}] {
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
        ${
          forDisplay
            ? '"lqip": metadata.lqip, "dominant": metadata.palette.dominant,'
            : ''
        }
      }
    }
  }`
export const getLatestBlogPosts = (options: GetBlogPostsOptions) =>
  clientFetch<Post[] | null>(getLatestBlogPostsQuery(options))

export const getBlogPostQuery = groq`
  *[_type == "post" && slug.current == $slug && !(_id in path("drafts.**"))][0] {
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
        "dimensions": asset->metadata.dimensions,
        ...
      }
    },
    "headings": body[length(style) == 2 && string::startsWith(style, "h")],
    mainImage {
      _ref,
      asset->{
        url,
        "lqip": metadata.lqip
      }
    },
    "related": *[_type == "post" && slug.current != $slug && count(categories[@._ref in ^.^.categories[]._ref]) > 0] | order(publishedAt desc, _createdAt desc) [0..2] {
      _id,
      title,
      "slug": slug.current,
      "categories": categories[]->title,
      publishedAt,
      readingTime,
      mainImage {
        _ref,
        asset->{
          url,
          "lqip": metadata.lqip,
          "dominant": metadata.palette.dominant
        }
      },
    }
  }`
export const getBlogPost = (slug: string) =>
  clientFetch<PostDetail | undefined>(getBlogPostQuery, { slug })

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
  clientFetch<{ projects: Project[] | null }>(getSettingsQuery())
