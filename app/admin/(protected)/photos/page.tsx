import type { Metadata } from 'next'

import { requireOwnerPage } from '~/lib/admin/server'
import { getMediaAdminPageServices } from '~/lib/media/admin/server'
import { getPublishedPhotoSelection } from '~/lib/media/photo-selection/server'
import { nonPublicRobots } from '~/lib/non-public-metadata'

import { PhotoCuration } from './PhotoCuration'

export const metadata: Metadata = {
  title: 'Photos',
  robots: nonPublicRobots,
}

export default async function AdminPhotosPage() {
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
