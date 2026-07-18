import type { Metadata } from 'next'

import { requireOwnerPage } from '~/lib/admin/server'
import { getAmaAdminServices } from '~/lib/ama/admin/server'
import { getMediaAdminPageServices } from '~/lib/media/admin/server'
import { getPublishedPhotoSelection } from '~/lib/media/photo-selection/server'
import { nonPublicRobots } from '~/lib/non-public-metadata'

import { AdminOverview } from './AdminOverview'

export const metadata: Metadata = {
  title: 'Admin',
  robots: nonPublicRobots,
}

// Admin account data intentionally renders per request.
export const instant = false

export default async function AdminPage() {
  const owner = await requireOwnerPage('/admin')
  const { bookingAdmin } = getAmaAdminServices()
  const { getDraft, listAssets } = getMediaAdminPageServices()
  const [
    attention,
    operations,
    upcoming,
    timeRequests,
    activeAssets,
    archivedAssets,
    draft,
    published,
  ] = await Promise.all([
    bookingAdmin.listBookings('attention'),
    bookingAdmin.listUnresolvedOperations(),
    bookingAdmin.listBookings('upcoming'),
    bookingAdmin.listAlternateTimeRequests('new'),
    listAssets({ ownerUserId: owner.id, view: 'active' }),
    listAssets({ ownerUserId: owner.id, view: 'archived' }),
    getDraft(owner.id),
    getPublishedPhotoSelection(),
  ])

  const failedOperationCount = operations.filter(
    (operation) => operation.status === 'failed',
  ).length
  const next = upcoming.find((booking) => booking.status !== 'cancelled')

  return (
    <AdminOverview
      attentionCount={attention.length + failedOperationCount}
      nextBooking={
        next
          ? {
              id: next.id,
              guestName: next.guestName,
              startsAt: next.startsAt.toISOString(),
            }
          : null
      }
      newTimeRequestCount={timeRequests.length}
      mediaActiveCount={activeAssets.length}
      mediaArchivedCount={archivedAssets.length}
      photosPublishedCount={published?.items.length ?? 0}
      photosDraftCount={draft.mediaAssetIds.length}
    />
  )
}
