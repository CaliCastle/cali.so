import type { Metadata } from 'next'
import { Suspense } from 'react'

import { requireOwnerPage } from '~/lib/admin/server'
import { getAmaAdminServices } from '~/lib/ama/admin/server'
import { T } from '~/lib/i18n'
import { getMediaAdminPageServices } from '~/lib/media/admin/server'
import { getPublishedPhotoSelection } from '~/lib/media/photo-selection/server'
import { nonPublicRobots } from '~/lib/non-public-metadata'

import { AdminOverview } from './AdminOverview'

export const metadata: Metadata = {
  title: 'Admin',
  robots: nonPublicRobots,
}

export const instant = true

const FALLBACK_ROWS = [
  { zh: '需要处理', en: 'Needs attention' },
  { zh: '下一场咨询', en: 'Next session' },
  { zh: '时间请求', en: 'Time requests' },
  { zh: '媒体', en: 'Media' },
  { zh: '照片', en: 'Photos' },
]

function OverviewFallback() {
  return (
    <div className="pb-10">
      <h1 className="text-sm font-medium text-muted-foreground">
        <T zh="总览" en="Overview" />
      </h1>
      <ul className="mt-6 hairline-top pt-4" aria-busy="true">
        {FALLBACK_ROWS.map((row) => (
          <li
            key={row.en}
            className="flex min-h-11 items-center gap-3 py-1.5 text-sm"
          >
            <span className="shrink-0">
              <T zh={row.zh} en={row.en} />
            </span>
            <span aria-hidden="true" className="blog-row-leader" />
            <span className="shrink-0 text-muted-foreground">…</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

async function OverviewLoader() {
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

export default function AdminPage() {
  return (
    <Suspense fallback={<OverviewFallback />}>
      <OverviewLoader />
    </Suspense>
  )
}
