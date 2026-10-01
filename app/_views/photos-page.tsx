import { Suspense } from 'react'
import { notFound } from 'next/navigation'

import { PixelCluster } from '~/components/pixel-cluster'
import {
  PublishedPhotoWall,
  PublishedPhotoWallLoading,
} from '~/components/published-photo-wall'
import { T } from '~/lib/i18n'
import { getPublishedPhotoSelection } from '~/lib/media/photo-selection/server'

export function PhotosPageView() {
  if (process.env.PUBLIC_CONTENT_ONLY === 'true') notFound()
  return (
    <div className="mx-auto w-full max-w-[37.5rem] px-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="page-eyebrow enter">
          <T zh="照片" en="Photos" />
        </h1>
        <PixelCluster variant={4} className="enter shrink-0" />
      </div>
      <Suspense fallback={<PublishedPhotoWallLoading />}>
        <PublishedPhotoMasonry />
      </Suspense>
    </div>
  )
}

async function PublishedPhotoMasonry() {
  const selection = await getPublishedPhotoSelection()
  return <PublishedPhotoWall selection={selection} />
}
