import { type SchemaTypeDefinition } from 'sanity'

import { readingTimeType } from '~/sanity/schemas/types/readingTime'

import blockContent from './schemas/blockContent'
import category from './schemas/category'
import post from './schemas/post'

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [readingTimeType, post, category, blockContent],
}
