import { defineField, defineType } from 'sanity'

import { ScriptIcon } from '~/assets'

export default defineType({
  name: 'category',
  title: 'Category',
  type: 'document',
  icon: ScriptIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
      },
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
    }),
  ],
})
