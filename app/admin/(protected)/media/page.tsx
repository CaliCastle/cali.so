import type { Metadata } from 'next'

import { requireOwnerPage } from '~/lib/admin/server'
import { getMediaAdminPageServices } from '~/lib/media/admin/server'
import { nonPublicRobots } from '~/lib/non-public-metadata'

import { MediaLibrary } from './MediaLibrary'

export const metadata: Metadata = {
  title: 'Media',
  robots: nonPublicRobots,
}

export default async function AdminMediaPage() {
  const owner = await requireOwnerPage('/admin/media')
  const { getDraft, listAssets } = getMediaAdminPageServices()
  const [active, archived, draft] = await Promise.all([
    listAssets({ ownerUserId: owner.id, view: 'active' }),
    listAssets({ ownerUserId: owner.id, view: 'archived' }),
    getDraft(owner.id),
  ])
  return (
    <MediaLibrary
      initialActive={active}
      initialArchived={archived}
      selectionIds={draft.mediaAssetIds}
    />
  )
}
