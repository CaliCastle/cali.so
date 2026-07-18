import type { Metadata } from 'next'
import { Suspense } from 'react'

import { requireOwnerPage } from '~/lib/admin/server'
import { T } from '~/lib/i18n'
import { getMediaAdminPageServices } from '~/lib/media/admin/server'
import { nonPublicRobots } from '~/lib/non-public-metadata'

import { MediaLibrary } from './MediaLibrary'

export const metadata: Metadata = {
  title: 'Media',
  robots: nonPublicRobots,
}

export const instant = true

function MediaFallback() {
  return (
    <div className="pb-10" aria-busy="true">
      <h1 className="text-sm font-medium text-muted-foreground">
        <T zh="媒体" en="Media" />
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">…</p>
      <div className="mt-6 rounded-lg border border-dashed border-border px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
          <div>
            <p className="text-sm font-medium">
              <T zh="拖入或选择照片" en="Drop or choose photos" />
            </p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              JPEG · PNG · HEIC · ≤ 50 MiB
            </p>
          </div>
          <span className="inline-flex min-h-11 items-center rounded-full bg-surface-1 px-4 text-sm text-muted-foreground">
            <T zh="选择文件" en="Choose files" />
          </span>
        </div>
      </div>
      <div className="mt-6 flex min-h-11 items-center" />
      <ul className="mt-4 grid grid-cols-3 gap-2">
        {Array.from({ length: 6 }, (_, index) => (
          <li
            key={index}
            aria-hidden
            className="aspect-square rounded-md bg-surface-1"
          />
        ))}
      </ul>
    </div>
  )
}

async function MediaLoader() {
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

export default function AdminMediaPage() {
  return (
    <Suspense fallback={<MediaFallback />}>
      <MediaLoader />
    </Suspense>
  )
}
