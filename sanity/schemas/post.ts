import { defineField, defineType } from 'sanity'
import { z } from 'zod'

import { readingTimeType } from '~/sanity/schemas/types/readingTime'

export const Post = z.object({
  _id: z.string(),
  title: z.string(),
  slug: z.string(),
  mainImage: z.object({
    _ref: z.string(),
    asset: z.object({
      url: z.string(),
      lqip: z.string(),
    }),
  }),
  publishedAt: z.string(),
  description: z.string(),
  categories: z.array(z.string()),
  body: z.any(),
  readingTime: z.number(),
})
export type Post = z.infer<typeof Post>

export default defineType({
  name: 'post',
  title: 'Post',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'categories',
      title: 'Categories',
      type: 'array',
      of: [{ type: 'reference', to: { type: 'category' } }],
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published at',
      type: 'datetime',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'mainImage',
      title: 'Main image',
      type: 'image',
      description: 'This image will be used for the preview (1200 x 675px)',
      options: {
        hotspot: true,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 3,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'blockContent',
    }),
    defineField({
      name: 'readingTime',
      type: readingTimeType.name,
      options: {
        source: 'body',
      },
    }),
  ],

  initialValue: () => ({
    publishedAt: new Date().toISOString(),
  }),

  preview: {
    select: {
      title: 'title',
      author: 'slug',
      media: 'mainImage',
    },
  },
})
