import { defineField, defineType } from 'sanity'
import { z } from 'zod'

import { Layers3Icon } from '~/assets'

export const Project = z.object({
  _id: z.string(),
  name: z.string(),
  url: z.string().url(),
  description: z.string(),
  icon: z.object({
    _ref: z.string(),
    asset: z.any(),
  }),
})
export type Project = z.infer<typeof Project>

export default defineType({
  name: 'project',
  title: 'Project',
  type: 'document',
  icon: Layers3Icon,
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'url',
      title: 'URL',
      type: 'url',
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
    }),
    defineField({
      name: 'icon',
      title: 'Icon',
      type: 'image',
      options: {
        hotspot: true,
      },
    }),
  ],
})
