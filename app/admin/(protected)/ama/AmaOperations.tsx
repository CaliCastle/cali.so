'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

import { T } from '~/lib/i18n'
import { localize, useLocale } from '~/lib/locale-client'

import { AmaSettings, type AmaSettingsProps } from './AmaSettings'
import {
  BookingStatusBadge,
  OperationsList,
  OWNER_TIME_ZONE,
  providerLabels,
  refundStatusLabels,
  responseJson,
  zonedDateTime,
  type AlternateTimeRequestViewModel,
  type BookingRowViewModel,
  type OperationViewModel,
} from './shared'

export type AmaOperationsProps = {
  upcoming: BookingRowViewModel[]
  past: BookingRowViewModel[]
  attention: BookingRowViewModel[]
  timeRequests: AlternateTimeRequestViewModel[]
  failedOperations: OperationViewModel[]
  settings: AmaSettingsProps
}

function BookingRow({
  booking,
  showPrep = false,
}: {
  booking: BookingRowViewModel
  showPrep?: boolean
}) {
  const provider = providerLabels[booking.meetingProvider]
  return (
    <li>
      <Link
        href={`/admin/ama/bookings/${booking.id}`}
        className="flex min-h-11 flex-wrap items-center justify-between gap-x-6 gap-y-1 rounded-md px-2 py-3 text-sm outline-none hover:bg-hover focus-visible:ring-1 focus-visible:ring-foreground"
      >
        <span className="min-w-0">
          <span className="block truncate font-medium">{booking.guestName}</span>
          <span className="mt-0.5 block text-sm text-muted-foreground">
            <span className="tabular-nums">
              <T
                zh={zonedDateTime(booking.startsAt, OWNER_TIME_ZONE, 'zh')}
                en={zonedDateTime(booking.startsAt, OWNER_TIME_ZONE, 'en')}
              />
              {' '}(Asia/Taipei)
            </span>
            <span aria-hidden="true"> · </span>
            <span className="tabular-nums">
              <T
                zh={zonedDateTime(booking.startsAt, booking.guestTimeZone, 'zh')}
                en={zonedDateTime(booking.startsAt, booking.guestTimeZone, 'en')}
              />
              {' '}({booking.guestTimeZone})
            </span>
          </span>
          {showPrep && (
            <span className="mt-0.5 block text-sm text-muted-foreground">
              <T zh={provider.zh} en={provider.en} />
              <span aria-hidden="true"> · </span>
              {booking.hasMeetingLink ? (
                <T zh="会议链接就绪" en="Meeting link ready" />
              ) : (
                <T zh="尚无会议链接" en="No meeting link yet" />
              )}
              <span aria-hidden="true"> · </span>
              {booking.hasBrief ? (
                <T zh="已有预约简述" en="Booking Brief received" />
              ) : (
                <T zh="没有预约简述" en="No Booking Brief" />
              )}
            </span>
          )}
        </span>
        <span className="flex flex-wrap items-center gap-x-4 gap-y-1">
          {!showPrep && (
            <span className="text-muted-foreground">
              <T zh={provider.zh} en={provider.en} />
            </span>
          )}
          <BookingStatusBadge status={booking.status} />
          {booking.refundStatus === 'failed' && (
            <span className="text-destructive">
              <T
                zh={refundStatusLabels.failed.zh}
                en={refundStatusLabels.failed.en}
              />
            </span>
          )}
        </span>
      </Link>
    </li>
  )
}

function AlternateTimeRequests({
  requests: initialRequests,
  onHandled,
}: {
  requests: AlternateTimeRequestViewModel[]
  onHandled?: () => void
}) {
  const locale = useLocale()
  const [requests, setRequests] = useState(initialRequests)
  const [pending, setPending] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const noticeRef = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    if (notice) noticeRef.current?.focus()
  }, [notice])

  async function act(
    request: AlternateTimeRequestViewModel,
    action: 'resolve' | 'dismiss',
  ) {
    setPending(`${request.id}:${action}`)
    setNotice(null)
    try {
      const response = await fetch(`/api/admin/ama/time-requests/${request.id}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      await responseJson(response)
      setRequests((current) => current.filter((item) => item.id !== request.id))
      onHandled?.()
      setNotice(
        action === 'resolve'
          ? localize(locale, '已标记为已处理。', 'Marked as resolved.')
          : localize(locale, '已忽略这条请求。', 'The request was dismissed.'),
      )
    } catch (error) {
      const code = error instanceof Error ? error.message : 'request_failed'
      setNotice(
        code === 'not_applicable'
          ? localize(
              locale,
              '这条请求已经处理过了。请刷新页面查看最新状态。',
              'This request was already handled. Refresh the page for the latest status.',
            )
          : localize(
              locale,
              '暂时无法更新这条请求，请再试一次。',
              'The request could not be updated. Try again.',
            ),
      )
    } finally {
      setPending(null)
    }
  }

  if (requests.length === 0 && !notice) return null

  return (
    <div>
      {requests.length > 0 && (
        <>
          <h3 className="mt-5 text-sm font-medium">
            <T zh="其他时间请求" en="Alternate Time Requests" />
          </h3>
          <ul className="mt-1 divide-y divide-border/70">
            {requests.map((request) => (
              <li
                key={request.id}
                className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2 py-4 text-sm"
              >
                <div className="min-w-0 max-w-xl">
                  <p className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                    <span className="font-medium">{request.guestName}</span>
                    <span className="break-all text-muted-foreground">
                      {request.guestEmail}
                    </span>
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    <span>{request.guestTimeZone}</span>
                    <span aria-hidden="true"> · </span>
                    <span className="tabular-nums">
                      <T
                        zh={`${zonedDateTime(request.createdAt, OWNER_TIME_ZONE, 'zh')} 提交`}
                        en={`Sent ${zonedDateTime(request.createdAt, OWNER_TIME_ZONE, 'en')}`}
                      />
                      {' '}(Asia/Taipei)
                    </span>
                  </p>
                  <p className="mt-2 whitespace-pre-wrap leading-6">
                    {request.preferredWindows}
                  </p>
                  {request.note && (
                    <p className="mt-1 whitespace-pre-wrap leading-6 text-muted-foreground">
                      {request.note}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={pending !== null}
                    onClick={() => void act(request, 'resolve')}
                    className="min-h-11 rounded-full bg-foreground px-4 text-sm font-medium text-background outline-none transition-transform duration-100 active:scale-[0.97] disabled:opacity-50 focus-visible:ring-1 focus-visible:ring-foreground focus-visible:ring-offset-2 motion-reduce:transform-none"
                  >
                    {pending === `${request.id}:resolve` ? (
                      <T zh="正在标记…" en="Resolving…" />
                    ) : (
                      <T zh="标记已处理" en="Resolve" />
                    )}
                  </button>
                  <button
                    type="button"
                    disabled={pending !== null}
                    onClick={() => void act(request, 'dismiss')}
                    className="min-h-11 px-3 text-sm text-muted-foreground outline-none disabled:opacity-50 focus-visible:rounded-sm focus-visible:ring-1 focus-visible:ring-foreground"
                  >
                    {pending === `${request.id}:dismiss` ? (
                      <T zh="正在忽略…" en="Dismissing…" />
                    ) : (
                      <T zh="忽略" en="Dismiss" />
                    )}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
      {notice && (
        <p
          ref={noticeRef}
          role="status"
          tabIndex={-1}
          className="mt-2 text-sm leading-5 text-muted-foreground outline-none"
        >
          {notice}
        </p>
      )}
    </div>
  )
}

// The AMA product in one place: what needs a hand first, what is coming up,
// the archive of past sessions, and the scheduling settings at the bottom.
export function AmaOperations({
  upcoming,
  past,
  attention,
  timeRequests,
  failedOperations,
  settings,
}: AmaOperationsProps) {
  const locale = useLocale()
  const [handledCount, setHandledCount] = useState(0)
  const attentionTotal = Math.max(
    0,
    attention.length + failedOperations.length + timeRequests.length - handledCount,
  )
  const allClear =
    attention.length === 0 &&
    failedOperations.length === 0 &&
    timeRequests.length === 0

  return (
    <div className="pb-10">
      <h1 className="text-sm font-medium text-muted-foreground">
        <T zh="咨询" en="AMA" />
      </h1>
      <p className="mt-1 text-sm tabular-nums text-muted-foreground">
        {upcoming.length} <T zh="场即将进行" en="upcoming" />
        {' · '}
        {attentionTotal} <T zh="项待处理" en="to handle" />
      </p>

      <section aria-labelledby="attention-heading" className="mt-6 hairline-top pt-6">
        <h2 id="attention-heading" className="text-sm font-medium">
          <T zh="需要处理" en="Needs attention" />
        </h2>
        {allClear ? (
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            <T zh="一切正常。" en="All clear." />
          </p>
        ) : (
          <>
            {attention.length > 0 && (
              <ul className="mt-3 divide-y divide-border/70">
                {attention.map((booking) => (
                  <BookingRow key={booking.id} booking={booking} />
                ))}
              </ul>
            )}
            {failedOperations.length > 0 && (
              <div className="mt-3">
                <h3 className="sr-only">
                  <T zh="失败的后台操作" en="Failed operations" />
                </h3>
                <OperationsList
                  operations={failedOperations}
                  removeOnResolve
                  onStatusChange={(from) => {
                    if (from === 'failed') setHandledCount((count) => count + 1)
                  }}
                />
              </div>
            )}
            <AlternateTimeRequests
              requests={timeRequests}
              onHandled={() => setHandledCount((count) => count + 1)}
            />
          </>
        )}
      </section>

      <section aria-labelledby="upcoming-heading" className="mt-8 hairline-top pt-6">
        <h2 id="upcoming-heading" className="text-sm font-medium">
          <T zh="即将进行" en="Upcoming" />
        </h2>
        {upcoming.length === 0 ? (
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            <T zh="没有即将进行的预约。" en="There are no upcoming Bookings." />
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-border/70">
            {upcoming.map((booking) => (
              <BookingRow key={booking.id} booking={booking} showPrep />
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="past-heading" className="mt-8 hairline-top pt-6">
        {past.length === 0 ? (
          <>
            <h2 id="past-heading" className="text-sm font-medium">
              <T zh="已结束" en="Past" />
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              <T zh="还没有已结束的预约。" en="There are no past Bookings yet." />
            </p>
          </>
        ) : (
          <details className="group">
            <summary
              aria-label={localize(locale, '已结束的预约', 'Past Bookings')}
              className="flex min-h-11 list-none items-center justify-between gap-4 outline-none focus-visible:rounded-sm focus-visible:ring-1 focus-visible:ring-foreground [&::-webkit-details-marker]:hidden"
            >
              <h2 id="past-heading" className="text-sm font-medium">
                <T zh="已结束" en="Past" />
              </h2>
              <span className="text-sm tabular-nums text-muted-foreground">
                {past.length}
                <span aria-hidden="true"> · </span>
                <span className="group-open:hidden">
                  <T zh="展开" en="Show" />
                </span>
                <span className="hidden group-open:inline">
                  <T zh="收起" en="Hide" />
                </span>
              </span>
            </summary>
            <ul className="mt-3 divide-y divide-border/70">
              {past.map((booking) => (
                <BookingRow key={booking.id} booking={booking} />
              ))}
            </ul>
          </details>
        )}
      </section>

      <AmaSettings {...settings} />
    </div>
  )
}
