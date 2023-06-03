import { defineField, defineType } from 'sanity'

import { FilterHorizontalIcon } from '~/assets'

export default defineType({
  name: 'settings',
  title: 'Settings',
  type: 'document',
  icon: FilterHorizontalIcon,
  fields: [
    defineField({
      name: 'projects',
      title: 'Projects',
      type: 'array',
      of: [{ type: 'reference', to: { type: 'project' } }],
    }),
  ],
})
