import { cacheLife } from 'next/cache'

import { buildEnglishFeedXml } from '~/lib/feeds'

async function getEnglishFeedXml() {
  'use cache'
  cacheLife('max')

  return buildEnglishFeedXml()
}

export async function GET() {
  return new Response(await getEnglishFeedXml(), {
    headers: { 'content-type': 'application/xml' },
  })
}
