import { defineField, defineType } from 'sanity'

import { ScriptIcon } from '~/assets'

export default defineType({
  name: 'category',
  title: '分类',
  type: 'document',
  icon: ScriptIcon,
  fields: [
    defineField({
      name: 'title',
      title: '名称',
      type: 'string',
    }),
    defineField({
      name: 'slug',
      title: '链接标识符',
      type: 'slug',
      options: {
        source: 'title',
      },
    }),
    defineField({
      name: 'description',
      title: '简单介绍',
      type: 'text',
    }),
  ],
})
