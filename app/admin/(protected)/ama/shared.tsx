'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

import type {
  BookingStatus,
  MeetingProviderName,
  RefundStatus,
} from '~/lib/ama/booking/repository'
import type {
  DurableOperationKind,
  DurableOperationStatus,
} from '~/lib/ama/operations/repository'
import { T } from '~/lib/i18n'
import { localize, useLocale, type Locale } from '~/lib/locale-client'

export const OWNER_TIME_ZONE = 'Asia/Taipei'

export type BookingRowViewModel = {
  id: string
  status: BookingStatus
  guestName: string
  guestEmail: string
  guestTimeZone: string
  meetingProvider: MeetingProviderName
  startsAt: string
  endsAt: string
  refundStatus: RefundStatus
  /** Prep-at-a-glance: the meeting link already exists. */
  hasMeetingLink: boolean
  /** Prep-at-a-glance: the Guest submitted a Booking Brief (not yet purged). */
  hasBrief: boolean
}

export type OperationViewModel = {
  id: string
  kind: DurableOperationKind
  bookingId: string | null
  status: DurableOperationStatus
  attemptCount: number
  maxAttempts: number
  nextAttemptAt: string
  lastErrorCode: string | null
}

export type AlternateTimeRequestViewModel = {
  id: string
  guestName: string
  guestEmail: string
  guestTimeZone: string
  preferredWindows: string
  note: string | null
  createdAt: string
}

export async function responseJson(response: Response) {
  const body = (await response.json()) as Record<string, unknown>
  if (!response.ok) {
    throw new Error(typeof body.error === 'string' ? body.error : 'request_failed')
  }
  return body
}

const dateTimeFormatters = new Map<string, Intl.DateTimeFormat>()

function zonedFormatter(zone: string, locale: Locale) {
  const key = `${zone}:${locale}`
  let formatter = dateTimeFormatters.get(key)
  if (!formatter) {
    const options: Intl.DateTimeFormatOptions = {
      timeZone: zone,
      month: 'short',
      day: 'numeric',
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }
    try {
      formatter = new Intl.DateTimeFormat(locale === 'zh' ? 'zh-TW' : 'en-US', options)
    } catch {
      // An unknown stored time zone must not break the page; fall back to UTC.
      formatter = new Intl.DateTimeFormat(locale === 'zh' ? 'zh-TW' : 'en-US', {
        ...options,
        timeZone: 'UTC',
      })
    }
    dateTimeFormatters.set(key, formatter)
  }
  return formatter
}

export function zonedDateTime(iso: string, zone: string, locale: Locale) {
  return zonedFormatter(zone, locale).format(new Date(iso))
}

export const bookingStatusLabels: Record<BookingStatus, { zh: string; en: string }> = {
  finalizing: { zh: '正在敲定', en: 'Finalizing' },
  confirmed: { zh: '已确认', en: 'Confirmed' },
  needs_reschedule: { zh: '需要改期', en: 'Needs reschedule' },
  cancelled: { zh: '已取消', en: 'Cancelled' },
}

const bookingStatusColors: Record<BookingStatus, string> = {
  finalizing: 'text-muted-foreground',
  confirmed: 'text-foreground',
  needs_reschedule: 'text-destructive',
  cancelled: 'text-muted-foreground',
}

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  const label = bookingStatusLabels[status]
  return (
    <span className={`inline-flex items-center gap-1.5 text-sm ${bookingStatusColors[status]}`}>
      <span aria-hidden="true" className="inline-block h-1.5 w-1.5 rounded-full bg-current" />
      <T zh={label.zh} en={label.en} />
    </span>
  )
}

export const refundStatusLabels: Record<RefundStatus, { zh: string; en: string }> = {
  none: { zh: '无退款', en: 'No refund' },
  pending: { zh: '退款处理中', en: 'Refund pending' },
  refunded: { zh: '已退款', en: 'Refunded' },
  failed: { zh: '退款失败', en: 'Refund failed' },
}

export const providerLabels: Record<MeetingProviderName, { zh: string; en: string }> = {
  'google-meet': { zh: 'Google Meet', en: 'Google Meet' },
  'tencent-meeting': { zh: '腾讯会议', en: 'Tencent Meeting' },
}

export const operationKindLabels: Record<
  DurableOperationKind,
  { zh: string; en: string }
> = {
  finalize_booking: { zh: '敲定预约', en: 'Finalize Booking' },
  send_booking_email: { zh: '发送预约邮件', en: 'Send Booking email' },
  send_reminder: { zh: '发送提醒', en: 'Send reminder' },
  issue_refund: { zh: '执行退款', en: 'Issue refund' },
  update_booking_artifacts: { zh: '更新会议资料', en: 'Update meeting artifacts' },
  remove_booking_artifacts: { zh: '移除会议资料', en: 'Remove meeting artifacts' },
  purge_booking_brief: { zh: '清除预约简述', en: 'Purge Booking Brief' },
}

export const operationStatusLabels: Record<
  DurableOperationStatus,
  { zh: string; en: string }
> = {
  pending: { zh: '等待中', en: 'Pending' },
  running: { zh: '运行中', en: 'Running' },
  succeeded: { zh: '已成功', en: 'Succeeded' },
  failed: { zh: '已失败', en: 'Failed' },
  cancelled: { zh: '已取消', en: 'Cancelled' },
  resolved: { zh: '已手动解决', en: 'Manually resolved' },
}

const operationStatusColors: Record<DurableOperationStatus, string> = {
  pending: 'text-muted-foreground',
  running: 'text-muted-foreground',
  succeeded: 'text-foreground',
  failed: 'text-destructive',
  cancelled: 'text-muted-foreground',
  resolved: 'text-foreground',
}

export function OperationStatusBadge({ status }: { status: DurableOperationStatus }) {
  const label = operationStatusLabels[status]
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-sm ${operationStatusColors[status]}`}
    >
      <span aria-hidden="true" className="inline-block h-1.5 w-1.5 rounded-full bg-current" />
      <T zh={label.zh} en={label.en} />
    </span>
  )
}

const actionButtonClass =
  'min-h-11 rounded-md border border-border px-3 text-sm font-medium outline-none disabled:opacity-50 focus-visible:border-foreground'
const quietButtonClass =
  'min-h-11 px-3 text-sm text-muted-foreground outline-none disabled:opacity-50 focus-visible:rounded-sm focus-visible:ring-1 focus-visible:ring-foreground'

/**
 * Durable operation rows with Retry and Mark resolved recovery actions.
 * Marking an operation resolved asserts the work was completed manually, so
 * it takes an inline confirm step before the request is sent.
 */
export function OperationsList({
  operations: initialOperations,
  showBookingLink = true,
  removeOnResolve = false,
  onStatusChange,
}: {
  operations: OperationViewModel[]
  showBookingLink?: boolean
  removeOnResolve?: boolean
  onStatusChange?: (
    from: DurableOperationStatus,
    to: DurableOperationStatus,
  ) => void
}) {
  const locale = useLocale()
  const [operations, setOperations] = useState(initialOperations)
  const [pending, setPending] = useState<string | null>(null)
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const noticeRef = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    if (notice) noticeRef.current?.focus()
  }, [notice])

  async function act(operation: OperationViewModel, action: 'retry' | 'resolve') {
    setPending(`${operation.id}:${action}`)
    setNotice(null)
    try {
      const response = await fetch(`/api/admin/ama/operations/${operation.id}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      await responseJson(response)
      if (action === 'retry') {
        setOperations((current) =>
          current.map((item) =>
            item.id === operation.id
              ? {
                  ...item,
                  status: 'pending',
                  attemptCount: 0,
                  lastErrorCode: null,
                  nextAttemptAt: new Date().toISOString(),
                }
              : item,
          ),
        )
        onStatusChange?.(operation.status, 'pending')
        setNotice(
          localize(locale, '已重新排队，稍后会自动执行。', 'Requeued. It will run again shortly.'),
        )
      } else {
        setOperations((current) =>
          removeOnResolve
            ? current.filter((item) => item.id !== operation.id)
            : current.map((item) =>
                item.id === operation.id ? { ...item, status: 'resolved' } : item,
              ),
        )
        onStatusChange?.(operation.status, 'resolved')
        setNotice(localize(locale, '已标记为手动解决。', 'Marked as manually resolved.'))
      }
      setConfirmingId(null)
    } catch (error) {
      const code = error instanceof Error ? error.message : 'request_failed'
      if (code === 'not_applicable') {
        setNotice(
          localize(
            locale,
            '这个操作的状态已经变化。请刷新页面查看最新状态。',
            'This operation changed state. Refresh the page for the latest status.',
          ),
        )
      } else if (action === 'retry') {
        setNotice(
          localize(
            locale,
            '重试请求失败：服务暂时不可用，请再试一次。',
            'Retry failed: the service is unavailable. Try again.',
          ),
        )
      } else {
        setNotice(
          localize(
            locale,
            '标记解决失败：服务暂时不可用，请再试一次。',
            'Resolve failed: the service is unavailable. Try again.',
          ),
        )
      }
    } finally {
      setPending(null)
    }
  }

  return (
    <div>
      {operations.length === 0 ? (
        <p className="py-6 text-sm leading-6 text-muted-foreground">
          <T zh="没有需要处理的后台操作。" en="There are no operations needing recovery." />
        </p>
      ) : (
        <ul className="divide-y divide-border/70">
          {operations.map((operation) => {
            const kind = operationKindLabels[operation.kind]
            const confirming = confirmingId === operation.id
            const actionable = ['pending', 'running', 'failed'].includes(operation.status)
            return (
              <li
                key={operation.id}
                className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 py-3 text-sm"
              >
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="font-medium">
                      <T zh={kind.zh} en={kind.en} />
                    </span>
                    <OperationStatusBadge status={operation.status} />
                  </p>
                  <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-muted-foreground">
                    <span className="tabular-nums">
                      <T
                        zh={`第 ${operation.attemptCount}/${operation.maxAttempts} 次`}
                        en={`Attempt ${operation.attemptCount}/${operation.maxAttempts}`}
                      />
                    </span>
                    <span className="tabular-nums">
                      <T
                        zh={`下次尝试 ${zonedDateTime(operation.nextAttemptAt, OWNER_TIME_ZONE, 'zh')}`}
                        en={`Next attempt ${zonedDateTime(operation.nextAttemptAt, OWNER_TIME_ZONE, 'en')}`}
                      />
                      {' '}(Asia/Taipei)
                    </span>
                    {operation.lastErrorCode && (
                      <code className="font-mono text-destructive">
                        {operation.lastErrorCode}
                      </code>
                    )}
                    {showBookingLink && operation.bookingId && (
                      <Link
                        href={`/admin/ama/bookings/${operation.bookingId}`}
                        className="underline decoration-border underline-offset-2 outline-none hover:decoration-foreground focus-visible:rounded-sm focus-visible:ring-1 focus-visible:ring-foreground"
                      >
                        <T zh="查看预约" en="View Booking" />
                      </Link>
                    )}
                  </p>
                </div>
                {actionable && (
                  <div className="flex flex-wrap items-center gap-2">
                    {operation.status === 'failed' && (
                      <button
                        type="button"
                        disabled={pending !== null}
                        onClick={() => void act(operation, 'retry')}
                        className={actionButtonClass}
                      >
                        {pending === `${operation.id}:retry` ? (
                          <T zh="正在重试…" en="Retrying…" />
                        ) : (
                          <T zh="重试" en="Retry" />
                        )}
                      </button>
                    )}
                    {confirming ? (
                      <>
                        <button
                          type="button"
                          disabled={pending !== null}
                          onClick={() => void act(operation, 'resolve')}
                          className={`${actionButtonClass} text-destructive focus-visible:border-destructive`}
                        >
                          {pending === `${operation.id}:resolve` ? (
                            <T zh="正在标记…" en="Resolving…" />
                          ) : (
                            <T zh="确认已在系统外完成" en="Confirm done outside the system" />
                          )}
                        </button>
                        <button
                          type="button"
                          disabled={pending !== null}
                          onClick={() => setConfirmingId(null)}
                          className={quietButtonClass}
                        >
                          <T zh="返回" en="Keep it" />
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        disabled={pending !== null}
                        onClick={() => setConfirmingId(operation.id)}
                        className={quietButtonClass}
                      >
                        <T zh="标记为已解决" en="Mark resolved" />
                      </button>
                    )}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
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
