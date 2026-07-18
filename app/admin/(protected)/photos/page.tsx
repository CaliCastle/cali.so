import type { Metadata } from 'next'
import { Suspense } from 'react'

import { requireOwnerPage } from '~/lib/admin/server'
import { T } from '~/lib/i18n'
import { getMediaAdminPageServices } from '~/lib/media/admin/server'
import { getPublishedPhotoSelection } from '~/lib/media/photo-selection/server'
import { nonPublicRobots } from '~/lib/non-public-metadata'

import { PhotoCuration } from './PhotoCuration'

export const metadata: Metadata = {
  title: 'Photos',
  robots: nonPublicRobots,
}

export const instant = true

function PhotosFallback() {
  return (
    <div className="pb-10" aria-busy="true">
      <h1 className="text-sm font-medium text-muted-foreground">
        <T zh="照片选集" en="Photo Selection" />
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">…</p>
      <ul className="mt-6 grid grid-cols-3 gap-x-4 gap-y-6">
        {Array.from({ length: 6 }, (_, index) => (
          <li
            key={index}
            aria-hidden
            className="aspect-[0.86] rounded-[3px] bg-surface-1"
          />
        ))}
      </ul>
    </div>
  )
}

async function PhotosLoader() {
  const owner = await requireOwnerPage('/admin/photos')
  const { getDraft, listAssets } = getMediaAdminPageServices()
  const [draft, assets, published] = await Promise.all([
    getDraft(owner.id),
    listAssets({ ownerUserId: owner.id, view: 'active' }),
    getPublishedPhotoSelection(),
  ])
  return (
    // Keyed by revision so conflict recovery (router.refresh) remounts the
    // curation state from the fresh Draft instead of merging in place.
    <PhotoCuration
      key={draft.revision}
      initialDraft={draft}
      assets={assets}
      publishedIds={published?.items.map((item) => item.id) ?? []}
    />
  )
}

export default function AdminPhotosPage() {
  return (
    <Suspense fallback={<PhotosFallback />}>
      <PhotosLoader />
    </Suspense>
  )
}
