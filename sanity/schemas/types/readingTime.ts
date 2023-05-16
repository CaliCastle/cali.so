import { defineType } from 'sanity'

import ReadingTimeInput from '~/sanity/components/ReadingTimeInput'

export const readingTimeType = defineType({
  name: 'readingTime',
  title: 'Reading Time',
  description: 'The estimated reading time (in minutes) for the given content.',
  type: 'number',
  components: {
    input: ReadingTimeInput,
  },
})
