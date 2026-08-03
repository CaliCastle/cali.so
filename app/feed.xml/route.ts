import { cacheLife } from 'next/cache'

import { buildChineseFeedXml } from '~/lib/feeds'

async function getChineseFeedXml() {
  'use cache'
  cacheLife('max')

  return buildChineseFeedXml()
}

// Content is filesystem-based, so the cached feed only changes with a
// deployment. /feed, /rss and /rss.xml rewrite here.
export async function GET() {
  return new Response(await getChineseFeedXml(), {
    headers: { 'content-type': 'application/xml' },
  })
}
