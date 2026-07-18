import Link from 'next/link'

import { T } from '~/lib/i18n'

export type NextBookingViewModel = {
  id: string
  guestName: string
  startsAt: string
}

export type AdminOverviewProps = {
  /** Needs-attention Bookings plus failed durable operations. */
  attentionCount: number
  nextBooking: NextBookingViewModel | null
  newTimeRequestCount: number
  mediaActiveCount: number
  mediaArchivedCount: number
  photosPublishedCount: number
  photosDraftCount: number
}

const ownerTimeZone = 'Asia/Taipei'
const nextSessionOptions: Intl.DateTimeFormatOptions = {
  timeZone: ownerTimeZone,
  month: 'short',
  day: 'numeric',
  weekday: 'short',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
}
const nextSessionFormatters = {
  zh: new Intl.DateTimeFormat('zh-TW', nextSessionOptions),
  en: new Intl.DateTimeFormat('en-US', nextSessionOptions),
}

function OverviewRow({
  href,
  label,
  value,
  destructive = false,
}: {
  href: string
  label: React.ReactNode
  value: React.ReactNode
  destructive?: boolean
}) {
  return (
    <li>
      <Link
        href={href}
        className="group flex min-h-11 items-center gap-3 py-1.5 text-sm outline-none focus-visible:rounded-sm focus-visible:ring-1 focus-visible:ring-foreground"
      >
        <span className="shrink-0">{label}</span>
        <span aria-hidden="true" className="blog-row-leader" />
        <span
          className={`shrink-0 text-right tabular-nums ${
            destructive ? 'text-destructive' : 'text-muted-foreground'
          }`}
        >
          {value}
        </span>
      </Link>
    </li>
  )
}

// The Overview is a one-screen catalog of the admin surfaces: each row is a
// dotted-leader line (label … value) that links into its surface. Quiet type,
// no cards — red ink only when something actually needs a hand.
export function AdminOverview({
  attentionCount,
  nextBooking,
  newTimeRequestCount,
  mediaActiveCount,
  mediaArchivedCount,
  photosPublishedCount,
  photosDraftCount,
}: AdminOverviewProps) {
  return (
    <div className="pb-10">
      <h1 className="text-sm font-medium text-muted-foreground">
        <T zh="总览" en="Overview" />
      </h1>

      <ul className="mt-6 hairline-top pt-4">
        <OverviewRow
          href="/admin/ama"
          label={<T zh="需要处理" en="Needs attention" />}
          value={attentionCount}
          destructive={attentionCount > 0}
        />
        <OverviewRow
          href={
            nextBooking ? `/admin/ama/bookings/${nextBooking.id}` : '/admin/ama'
          }
          label={<T zh="下一场咨询" en="Next session" />}
          value={
            nextBooking ? (
              <>
                {nextBooking.guestName}
                <span aria-hidden="true"> · </span>
                <T
                  zh={nextSessionFormatters.zh.format(new Date(nextBooking.startsAt))}
                  en={nextSessionFormatters.en.format(new Date(nextBooking.startsAt))}
                />
              </>
            ) : (
              <T zh="暂无安排" en="Nothing scheduled" />
            )
          }
        />
        <OverviewRow
          href="/admin/ama"
          label={<T zh="时间请求" en="Time requests" />}
          value={
            <>
              {newTimeRequestCount} <T zh="条新" en="new" />
            </>
          }
        />
        <OverviewRow
          href="/admin/media"
          label={<T zh="媒体" en="Media" />}
          value={
            <>
              {mediaActiveCount} <T zh="张使用中" en="active" />
              {mediaArchivedCount > 0 && (
                <>
                  {' · '}
                  {mediaArchivedCount} <T zh="张已归档" en="archived" />
                </>
              )}
            </>
          }
        />
        <OverviewRow
          href="/admin/photos"
          label={<T zh="照片" en="Photos" />}
          value={
            <>
              {photosPublishedCount} <T zh="张已发布" en="published" />
              {' · '}
              {photosDraftCount} <T zh="张草稿" en="in draft" />
            </>
          }
        />
      </ul>
    </div>
  )
}
