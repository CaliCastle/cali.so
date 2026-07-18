'use client'

import { useRouter } from 'next/navigation'
import { Fragment, useEffect, useMemo, useRef, useState } from 'react'

import { InputCopy } from '~/components/ui/input-copy'
import { AMA_TOPIC_LABELS, type AmaTopic } from '~/lib/ama/booking/topics'
import type {
  BookingLocale,
  BookingStatus,
  MeetingProviderName,
  RefundStatus,
} from '~/lib/ama/booking/repository'
import { T } from '~/lib/i18n'
import { localize, useLocale, type Locale } from '~/lib/locale-client'

import {
  BookingStatusBadge,
  bookingStatusLabels,
  OperationsList,
  OWNER_TIME_ZONE,
  providerLabels,
  refundStatusLabels,
  responseJson,
  zonedDateTime,
  type OperationViewModel,
} from '../../shared'

export type BookingViewModel = {
  id: string
  status: BookingStatus
  guestName: string
  guestEmail: string
  locale: BookingLocale
  guestTimeZone: string
  topics: string[]
  briefText: string | null
  briefUrls: string[] | null
  briefPurgedAt: string | null
  meetingProvider: MeetingProviderName
  startsAt: string
  endsAt: string
  stripeCheckoutSessionId: string
  stripePaymentIntentId: string | null
  amountTotal: number
  currency: string
  refundStatus: RefundStatus
  stripeRefundId: string | null
  refundedAt: string | null
  refundReason: string | null
  cancelledAt: string | null
  cancelledBy: 'guest' | 'owner' | null
  meetingUrl: string | null
  googleCalendarEventId: string | null
  tencentMeetingId: string | null
  createdAt: string
}

export type BookingEventViewModel = {
  id: string
  event: string
  actor: 'guest' | 'owner' | 'system' | 'provider'
  occurredAt: string
  detail: Record<string, unknown>
}

type SlotViewModel = { startsAt: string; endsAt: string }

const MANAGE_CUTOFF_MS = 24 * 60 * 60 * 1000

function formatAmount(amountTotal: number, currency: string, locale: Locale) {
  try {
    return new Intl.NumberFormat(locale === 'zh' ? 'zh-CN' : 'en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amountTotal / 100)
  } catch {
    return `${currency.toUpperCase()} ${(amountTotal / 100).toFixed(2)}`
  }
}

function topicLabel(topic: string) {
  return (
    AMA_TOPIC_LABELS[topic as AmaTopic] ?? ({ zh: topic, en: topic } as const)
  )
}

const dayKeyFormatters = new Map<string, Intl.DateTimeFormat>()

function dayKey(iso: string, zone: string) {
  let formatter = dayKeyFormatters.get(zone)
  if (!formatter) {
    try {
      formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: zone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      })
    } catch {
      formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'UTC',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      })
    }
    dayKeyFormatters.set(zone, formatter)
  }
  return formatter.format(new Date(iso))
}

const dayLabelFormatters = new Map<string, Intl.DateTimeFormat>()

function dayLabel(iso: string, zone: string, locale: Locale) {
  const key = `${zone}:${locale}`
  let formatter = dayLabelFormatters.get(key)
  if (!formatter) {
    const options: Intl.DateTimeFormatOptions = {
      timeZone: zone,
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }
    try {
      formatter = new Intl.DateTimeFormat(locale === 'zh' ? 'zh-TW' : 'en-US', options)
    } catch {
      formatter = new Intl.DateTimeFormat(locale === 'zh' ? 'zh-TW' : 'en-US', {
        ...options,
        timeZone: 'UTC',
      })
    }
    dayLabelFormatters.set(key, formatter)
  }
  return formatter.format(new Date(iso))
}

const timeLabelFormatters = new Map<string, Intl.DateTimeFormat>()

function timeLabel(iso: string, zone: string) {
  let formatter = timeLabelFormatters.get(zone)
  if (!formatter) {
    const options: Intl.DateTimeFormatOptions = {
      timeZone: zone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }
    try {
      formatter = new Intl.DateTimeFormat('en-US', options)
    } catch {
      formatter = new Intl.DateTimeFormat('en-US', { ...options, timeZone: 'UTC' })
    }
    timeLabelFormatters.set(zone, formatter)
  }
  return formatter.format(new Date(iso))
}

/** A flat detail object (primitives only) can render as definition rows. */
function isFlatDetail(detail: Record<string, unknown>) {
  return Object.values(detail).every(
    (value) =>
      value === null ||
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean',
  )
}

function DefinitionRow({
  term,
  children,
}: {
  term: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <>
      <dt className="text-muted-foreground">{term}</dt>
      <dd className="min-w-0 break-words">{children}</dd>
    </>
  )
}

function ZonedTimes({ iso, guestTimeZone }: { iso: string; guestTimeZone: string }) {
  return (
    <span className="tabular-nums">
      <T
        zh={zonedDateTime(iso, OWNER_TIME_ZONE, 'zh')}
        en={zonedDateTime(iso, OWNER_TIME_ZONE, 'en')}
      />
      {' '}(Asia/Taipei)
      <span aria-hidden="true"> · </span>
      <T
        zh={zonedDateTime(iso, guestTimeZone, 'zh')}
        en={zonedDateTime(iso, guestTimeZone, 'en')}
      />
      {' '}({guestTimeZone})
    </span>
  )
}

export function BookingDetail({
  booking,
  events,
  operations,
}: {
  booking: BookingViewModel
  events: BookingEventViewModel[]
  operations: OperationViewModel[]
}) {
  const locale = useLocale()
  const router = useRouter()
  const [status, setStatus] = useState(booking.status)
  const [refundStatus, setRefundStatus] = useState(booking.refundStatus)
  const [startsAt, setStartsAt] = useState(booking.startsAt)
  const [endsAt, setEndsAt] = useState(booking.endsAt)
  const [panel, setPanel] = useState<'none' | 'reschedule' | 'cancel' | 'refund'>('none')
  const [pending, setPending] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const noticeRef = useRef<HTMLParagraphElement>(null)

  const [slots, setSlots] = useState<SlotViewModel[] | null>(null)
  const [slotsState, setSlotsState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [zoneView, setZoneView] = useState<'owner' | 'guest'>('owner')
  const [refundChecked, setRefundChecked] = useState(
    () => Date.parse(booking.startsAt) - Date.now() > MANAGE_CUTOFF_MS,
  )

  useEffect(() => {
    if (notice) noticeRef.current?.focus()
  }, [notice])

  async function performBookingAction(body: Record<string, unknown>) {
    const response = await fetch(`/api/admin/ama/bookings/${booking.id}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    })
    return responseJson(response)
  }

  async function loadSlots() {
    setSlotsState('loading')
    try {
      const body = await responseJson(await fetch('/api/ama/slots', { cache: 'no-store' }))
      setSlots((body.slots as SlotViewModel[]) ?? [])
      setSlotsState('ready')
    } catch {
      setSlots(null)
      setSlotsState('error')
    }
  }

  function openPanel(next: 'reschedule' | 'cancel' | 'refund') {
    setNotice(null)
    setPanel((current) => (current === next ? 'none' : next))
    if (next === 'reschedule') {
      setSelectedSlot(null)
      void loadSlots()
    }
  }

  async function cancelBooking() {
    setPending('cancel')
    setNotice(null)
    try {
      await performBookingAction({ action: 'cancel', refund: refundChecked })
      setStatus('cancelled')
      if (refundChecked) setRefundStatus('pending')
      setPanel('none')
      setNotice(
        refundChecked
          ? localize(locale, '预约已取消，退款正在处理。', 'The Booking was cancelled and the refund is in progress.')
          : localize(locale, '预约已取消。', 'The Booking was cancelled.'),
      )
      router.refresh()
    } catch (error) {
      if (error instanceof Error && error.message === 'already_cancelled') {
        setStatus('cancelled')
        setPanel('none')
        setNotice(
          localize(locale, '这个预约已经取消过了。', 'This Booking was already cancelled.'),
        )
        router.refresh()
      } else {
        setNotice(
          localize(
            locale,
            '取消未完成，预约保持原状。请再试一次。',
            'The cancellation did not complete and the Booking is unchanged. Try again.',
          ),
        )
      }
    } finally {
      setPending(null)
    }
  }

  async function reschedule() {
    if (!selectedSlot || !slots) return
    const slot = slots.find((item) => item.startsAt === selectedSlot)
    if (!slot) return
    setPending('reschedule')
    setNotice(null)
    try {
      await performBookingAction({ action: 'reschedule', startsAt: slot.startsAt })
      setStartsAt(slot.startsAt)
      setEndsAt(slot.endsAt)
      setStatus('finalizing')
      setPanel('none')
      setNotice(
        localize(
          locale,
          '已改期。会议资料和邮件会自动更新。',
          'Rescheduled. Meeting artifacts and email update automatically.',
        ),
      )
      router.refresh()
    } catch (error) {
      if (
        error instanceof Error &&
        (error.message === 'stale_slot' || error.message === 'slot_taken')
      ) {
        setSelectedSlot(null)
        setNotice(
          localize(
            locale,
            '这个时间已不可用，已为你刷新可选时间。',
            'That time is no longer available. The open times were refreshed.',
          ),
        )
        void loadSlots()
      } else if (error instanceof Error && error.message === 'already_cancelled') {
        setStatus('cancelled')
        setNotice(
          localize(locale, '这个预约已经取消，无法改期。', 'This Booking is cancelled and cannot be rescheduled.'),
        )
        router.refresh()
      } else {
        setNotice(
          localize(
            locale,
            '改期未完成，预约保持原状。请再试一次。',
            'The reschedule did not complete and the Booking is unchanged. Try again.',
          ),
        )
      }
    } finally {
      setPending(null)
    }
  }

  async function grantRefundException() {
    setPending('refund')
    setNotice(null)
    try {
      await performBookingAction({ action: 'refund-exception' })
      setRefundStatus('pending')
      setPanel('none')
      setNotice(
        localize(locale, '退款例外已批准，退款正在处理。', 'The refund exception was granted and the refund is in progress.'),
      )
      router.refresh()
    } catch (error) {
      if (error instanceof Error && error.message === 'not_applicable') {
        setNotice(
          localize(
            locale,
            '这笔款项已经退款或正在退款，未做任何更改。',
            'This payment is already refunded or refunding. Nothing was changed.',
          ),
        )
        router.refresh()
      } else {
        setNotice(
          localize(
            locale,
            '退款例外未生效，请再试一次。',
            'The refund exception did not take effect. Try again.',
          ),
        )
      }
    } finally {
      setPending(null)
    }
  }

  const slotGroups = useMemo(() => {
    if (!slots) return []
    const zone = zoneView === 'owner' ? OWNER_TIME_ZONE : booking.guestTimeZone
    const groups = new Map<string, SlotViewModel[]>()
    for (const slot of slots) {
      const key = dayKey(slot.startsAt, zone)
      const bucket = groups.get(key)
      if (bucket) bucket.push(slot)
      else groups.set(key, [slot])
    }
    return [...groups.values()]
  }, [slots, zoneView, booking.guestTimeZone])

  const pickerZone = zoneView === 'owner' ? OWNER_TIME_ZONE : booking.guestTimeZone
  const sessionIsPast = Date.parse(endsAt) < Date.now()
  const canCancel = status !== 'cancelled'
  const canReschedule = status !== 'cancelled'
  const canGrantRefundException =
    (refundStatus === 'none' || refundStatus === 'failed') &&
    (status === 'cancelled' || sessionIsPast)

  const localeLabel =
    booking.locale === 'zh'
      ? { zh: '中文', en: 'Chinese' }
      : { zh: '英文', en: 'English' }
  const provider = providerLabels[booking.meetingProvider]

  return (
    <div className="pb-10">
      <p className="text-sm font-medium text-muted-foreground">
        <T zh="咨询预约" en="AMA Booking" />
      </p>
      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
        <h1 className="text-sm font-medium">{booking.guestName}</h1>
        <BookingStatusBadge status={status} />
        {refundStatus !== 'none' && (
          <span
            className={`text-sm ${refundStatus === 'failed' ? 'text-destructive' : 'text-muted-foreground'}`}
          >
            <T
              zh={refundStatusLabels[refundStatus].zh}
              en={refundStatusLabels[refundStatus].en}
            />
          </span>
        )}
      </div>

      {/* Actions */}
      <section aria-labelledby="actions-heading" className="mt-6">
        <h2 id="actions-heading" className="sr-only">
          <T zh="操作" en="Actions" />
        </h2>
        <div className="flex flex-wrap gap-2">
          {canReschedule && (
            <button
              type="button"
              disabled={pending !== null}
              onClick={() => openPanel('reschedule')}
              aria-expanded={panel === 'reschedule'}
              className="min-h-11 rounded-md border border-border px-4 text-sm font-medium outline-none disabled:opacity-50 focus-visible:border-foreground"
            >
              <T zh="改期" en="Reschedule" />
            </button>
          )}
          {canCancel && (
            <button
              type="button"
              disabled={pending !== null}
              onClick={() => openPanel('cancel')}
              aria-expanded={panel === 'cancel'}
              className="min-h-11 rounded-md px-4 text-sm text-destructive outline-none disabled:opacity-50 focus-visible:ring-1 focus-visible:ring-destructive"
            >
              <T zh="取消预约" en="Cancel Booking" />
            </button>
          )}
          {canGrantRefundException && (
            <button
              type="button"
              disabled={pending !== null}
              onClick={() => openPanel('refund')}
              aria-expanded={panel === 'refund'}
              className="min-h-11 rounded-md border border-border px-4 text-sm font-medium outline-none disabled:opacity-50 focus-visible:border-foreground"
            >
              <T zh="批准退款例外" en="Grant refund exception" />
            </button>
          )}
        </div>

        {panel === 'reschedule' && (
          <div className="mt-4 rounded-md bg-surface-1 px-4 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-sm font-medium">
                <T zh="选择新的时间" en="Pick a new time" />
              </h3>
              <div
                className="flex items-center gap-1"
                role="tablist"
                aria-label="Time zone view"
              >
                {(['owner', 'guest'] as const).map((zone) => (
                  <button
                    key={zone}
                    type="button"
                    role="tab"
                    aria-selected={zoneView === zone}
                    onClick={() => setZoneView(zone)}
                    className={`min-h-11 rounded-full px-3 text-sm outline-none focus-visible:ring-1 focus-visible:ring-foreground ${
                      zoneView === zone
                        ? 'bg-foreground text-background'
                        : 'text-muted-foreground hover:bg-hover hover:text-foreground'
                    }`}
                  >
                    {zone === 'owner' ? (
                      <T zh="我的时区" en="Owner time" />
                    ) : (
                      <T zh="访客时区" en="Guest time" />
                    )}
                  </button>
                ))}
              </div>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{pickerZone}</p>

            {slotsState === 'loading' && (
              <p className="mt-4 text-sm leading-6 text-muted-foreground" role="status">
                <T zh="正在加载开放时间…" en="Loading open times…" />
              </p>
            )}
            {slotsState === 'error' && (
              <p className="mt-4 text-sm leading-6 text-muted-foreground" role="status">
                <T
                  zh="暂时无法加载开放时间，请重新打开改期面板。"
                  en="Open times could not load. Close and reopen the reschedule panel."
                />
              </p>
            )}
            {slotsState === 'ready' && slots && slots.length === 0 && (
              <p className="mt-4 text-sm leading-6 text-muted-foreground">
                <T
                  zh="未来 30 天没有开放时间。"
                  en="There are no open times in the next 30 days."
                />
              </p>
            )}
            {slotsState === 'ready' && slots && slots.length > 0 && (
              <div className="mt-4 grid gap-4">
                {slotGroups.map((group) => (
                  <div key={dayKey(group[0]!.startsAt, pickerZone)}>
                    <p className="text-sm text-muted-foreground">
                      <T
                        zh={dayLabel(group[0]!.startsAt, pickerZone, 'zh')}
                        en={dayLabel(group[0]!.startsAt, pickerZone, 'en')}
                      />
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {group.map((slot) => (
                        <button
                          key={slot.startsAt}
                          type="button"
                          aria-pressed={selectedSlot === slot.startsAt}
                          onClick={() =>
                            setSelectedSlot((current) =>
                              current === slot.startsAt ? null : slot.startsAt,
                            )
                          }
                          className={`min-h-11 rounded-md border px-3 text-sm tabular-nums outline-none focus-visible:ring-1 focus-visible:ring-foreground ${
                            selectedSlot === slot.startsAt
                              ? 'border-foreground bg-foreground text-background'
                              : 'border-border text-foreground hover:bg-hover'
                          }`}
                        >
                          {timeLabel(slot.startsAt, pickerZone)}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                <div className="flex flex-wrap items-center gap-2 hairline-top pt-4">
                  <button
                    type="button"
                    disabled={pending !== null || !selectedSlot}
                    onClick={() => void reschedule()}
                    className="min-h-11 rounded-full bg-foreground px-4 text-sm font-medium text-background outline-none transition-transform duration-100 active:scale-[0.97] disabled:opacity-50 focus-visible:ring-1 focus-visible:ring-foreground focus-visible:ring-offset-2 motion-reduce:transform-none"
                  >
                    {pending === 'reschedule' ? (
                      <T zh="正在改期…" en="Rescheduling…" />
                    ) : (
                      <T zh="确认改期" en="Confirm reschedule" />
                    )}
                  </button>
                  <button
                    type="button"
                    disabled={pending !== null}
                    onClick={() => setPanel('none')}
                    className="min-h-11 px-3 text-sm text-muted-foreground outline-none disabled:opacity-50 focus-visible:rounded-sm focus-visible:ring-1 focus-visible:ring-foreground"
                  >
                    <T zh="关闭" en="Close" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {panel === 'cancel' && (
          <div className="mt-4 rounded-md bg-surface-1 px-4 py-3">
            <h3 className="text-sm font-medium">
              <T zh="取消这个预约？" en="Cancel this Booking?" />
            </h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              <T
                zh="访客会收到取消邮件，会议和日历事件会被移除。"
                en="The Guest is emailed, and the meeting and calendar event are removed."
              />
            </p>
            <label className="mt-4 flex min-h-11 items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={refundChecked}
                onChange={(event) => setRefundChecked(event.target.checked)}
                className="h-4 w-4 accent-foreground"
              />
              <T zh="同时全额退款" en="Issue full refund" />
            </label>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={pending !== null}
                onClick={() => void cancelBooking()}
                className="min-h-11 rounded-full bg-destructive px-4 text-sm font-medium text-white outline-none disabled:opacity-50 focus-visible:ring-1 focus-visible:ring-destructive focus-visible:ring-offset-2"
              >
                {pending === 'cancel' ? (
                  <T zh="正在取消…" en="Cancelling…" />
                ) : (
                  <T zh="确认取消预约" en="Confirm cancellation" />
                )}
              </button>
              <button
                type="button"
                disabled={pending !== null}
                onClick={() => setPanel('none')}
                className="min-h-11 px-3 text-sm text-muted-foreground outline-none disabled:opacity-50 focus-visible:rounded-sm focus-visible:ring-1 focus-visible:ring-foreground"
              >
                <T zh="保留预约" en="Keep the Booking" />
              </button>
            </div>
          </div>
        )}

        {panel === 'refund' && (
          <div className="mt-4 rounded-md bg-surface-1 px-4 py-3">
            <h3 className="text-sm font-medium">
              <T zh="批准退款例外？" en="Grant a refund exception?" />
            </h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              <T
                zh="为不再自动符合退款条件的预约手动全额退款。"
                en="Manually refund a Booking that no longer qualifies automatically."
              />
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={pending !== null}
                onClick={() => void grantRefundException()}
                className="min-h-11 rounded-full bg-foreground px-4 text-sm font-medium text-background outline-none disabled:opacity-50 focus-visible:ring-1 focus-visible:ring-foreground focus-visible:ring-offset-2"
              >
                {pending === 'refund' ? (
                  <T zh="正在退款…" en="Refunding…" />
                ) : (
                  <T zh="确认退款例外" en="Confirm refund exception" />
                )}
              </button>
              <button
                type="button"
                disabled={pending !== null}
                onClick={() => setPanel('none')}
                className="min-h-11 px-3 text-sm text-muted-foreground outline-none disabled:opacity-50 focus-visible:rounded-sm focus-visible:ring-1 focus-visible:ring-foreground"
              >
                <T zh="返回" en="Go back" />
              </button>
            </div>
          </div>
        )}

        {notice && (
          <p
            ref={noticeRef}
            role="status"
            tabIndex={-1}
            className="mt-4 rounded-md bg-surface-1 px-4 py-3 text-sm leading-6 outline-none"
          >
            {notice}
          </p>
        )}
      </section>

      {/* Schedule */}
      <section
        aria-labelledby="schedule-heading"
        className="mt-8 hairline-top pt-6"
      >
        <h2 id="schedule-heading" className="text-sm font-medium">
          <T zh="日程" en="Schedule" />
        </h2>
        <dl className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[9rem_minmax(0,1fr)]">
          <DefinitionRow term={<T zh="开始" en="Starts" />}>
            <ZonedTimes iso={startsAt} guestTimeZone={booking.guestTimeZone} />
          </DefinitionRow>
          <DefinitionRow term={<T zh="结束" en="Ends" />}>
            <ZonedTimes iso={endsAt} guestTimeZone={booking.guestTimeZone} />
          </DefinitionRow>
          <DefinitionRow term={<T zh="状态" en="Status" />}>
            <T
              zh={bookingStatusLabels[status].zh}
              en={bookingStatusLabels[status].en}
            />
          </DefinitionRow>
          <DefinitionRow term={<T zh="创建于" en="Created" />}>
            <span className="tabular-nums">
              <T
                zh={zonedDateTime(booking.createdAt, OWNER_TIME_ZONE, 'zh')}
                en={zonedDateTime(booking.createdAt, OWNER_TIME_ZONE, 'en')}
              />
              {' '}(Asia/Taipei)
            </span>
          </DefinitionRow>
        </dl>
      </section>

      {/* Identity */}
      <section
        aria-labelledby="guest-heading"
        className="mt-8 hairline-top pt-6"
      >
        <h2 id="guest-heading" className="text-sm font-medium">
          <T zh="访客" en="Guest" />
        </h2>
        <dl className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[9rem_minmax(0,1fr)]">
          <DefinitionRow term={<T zh="姓名" en="Name" />}>{booking.guestName}</DefinitionRow>
          <DefinitionRow term={<T zh="邮箱" en="Email" />}>
            <span className="break-all">{booking.guestEmail}</span>
          </DefinitionRow>
          <DefinitionRow term={<T zh="语言" en="Locale" />}>
            <T zh={localeLabel.zh} en={localeLabel.en} />
          </DefinitionRow>
          <DefinitionRow term={<T zh="时区" en="Time zone" />}>
            {booking.guestTimeZone}
          </DefinitionRow>
          <DefinitionRow term={<T zh="话题" en="Topics" />}>
            <T
              zh={booking.topics.map((topic) => topicLabel(topic).zh).join('、')}
              en={booking.topics.map((topic) => topicLabel(topic).en).join(', ')}
            />
          </DefinitionRow>
          <DefinitionRow term={<T zh="会议服务" en="Provider" />}>
            <T zh={provider.zh} en={provider.en} />
          </DefinitionRow>
        </dl>

        <h3 className="mt-5 text-sm font-medium">
          <T zh="预约简述" en="Booking Brief" />
        </h3>
        {booking.briefPurgedAt ? (
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            <T
              zh={`已清除（${zonedDateTime(booking.briefPurgedAt, OWNER_TIME_ZONE, 'zh')}）。简述在会话结束后按期删除。`}
              en={`Purged (${zonedDateTime(booking.briefPurgedAt, OWNER_TIME_ZONE, 'en')}). Briefs are deleted on schedule after the session.`}
            />
          </p>
        ) : (
          <>
            {booking.briefText ? (
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6">
                {booking.briefText}
              </p>
            ) : (
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                <T zh="没有简述内容。" en="There is no Brief text." />
              </p>
            )}
            {booking.briefUrls && booking.briefUrls.length > 0 && (
              <ul className="mt-2 grid gap-1 text-sm">
                {booking.briefUrls.map((url) => (
                  <li key={url}>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="break-all underline decoration-border underline-offset-2 outline-none hover:decoration-foreground focus-visible:rounded-sm focus-visible:ring-1 focus-visible:ring-foreground"
                    >
                      {url}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </section>

      {/* Payment */}
      <section
        aria-labelledby="payment-heading"
        className="mt-8 hairline-top pt-6"
      >
        <h2 id="payment-heading" className="text-sm font-medium">
          <T zh="付款" en="Payment" />
        </h2>
        <dl className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[9rem_minmax(0,1fr)]">
          <DefinitionRow term={<T zh="金额" en="Amount" />}>
            <span className="tabular-nums">
              <T
                zh={formatAmount(booking.amountTotal, booking.currency, 'zh')}
                en={formatAmount(booking.amountTotal, booking.currency, 'en')}
              />
            </span>
          </DefinitionRow>
          <DefinitionRow term={<T zh="退款状态" en="Refund" />}>
            <T
              zh={refundStatusLabels[refundStatus].zh}
              en={refundStatusLabels[refundStatus].en}
            />
            {booking.refundReason && (
              <span className="text-muted-foreground"> · {booking.refundReason}</span>
            )}
          </DefinitionRow>
          {booking.stripeRefundId && (
            <DefinitionRow term={<T zh="退款编号" en="Refund id" />}>
              <code className="break-all font-mono">{booking.stripeRefundId}</code>
            </DefinitionRow>
          )}
        </dl>
        <div className="mt-4 grid max-w-md gap-3">
          <InputCopy
            value={booking.stripeCheckoutSessionId}
            label="Checkout Session"
          />
          {booking.stripePaymentIntentId && (
            <InputCopy
              value={booking.stripePaymentIntentId}
              label="Payment Intent"
            />
          )}
        </div>
      </section>

      {/* Meeting */}
      <section
        aria-labelledby="meeting-heading"
        className="mt-8 hairline-top pt-6"
      >
        <h2 id="meeting-heading" className="text-sm font-medium">
          <T zh="会议" en="Meeting" />
        </h2>
        {booking.meetingUrl || booking.googleCalendarEventId || booking.tencentMeetingId ? (
          <dl className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[9rem_minmax(0,1fr)]">
            {booking.meetingUrl && (
              <DefinitionRow term={<T zh="会议链接" en="Meeting link" />}>
                <a
                  href={booking.meetingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="break-all underline decoration-border underline-offset-2 outline-none hover:decoration-foreground focus-visible:rounded-sm focus-visible:ring-1 focus-visible:ring-foreground"
                >
                  {booking.meetingUrl}
                </a>
              </DefinitionRow>
            )}
            {booking.googleCalendarEventId && (
              <DefinitionRow term={<T zh="日历事件" en="Calendar event" />}>
                <code className="break-all font-mono">
                  {booking.googleCalendarEventId}
                </code>
              </DefinitionRow>
            )}
            {booking.tencentMeetingId && (
              <DefinitionRow term={<T zh="腾讯会议编号" en="Tencent Meeting id" />}>
                <code className="break-all font-mono">{booking.tencentMeetingId}</code>
              </DefinitionRow>
            )}
          </dl>
        ) : (
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            <T
              zh="会议尚未创建。敲定完成后会自动创建。"
              en="The meeting has not been created yet. Finalizing creates it automatically."
            />
          </p>
        )}
      </section>

      {/* Operations */}
      <section
        aria-labelledby="booking-operations-heading"
        className="mt-8 hairline-top pt-6"
      >
        <h2 id="booking-operations-heading" className="text-sm font-medium">
          <T zh="后台操作" en="Operations" />
        </h2>
        <div className="mt-3">
          <OperationsList operations={operations} showBookingLink={false} />
        </div>
      </section>

      {/* Lifecycle */}
      <section
        aria-labelledby="history-heading"
        className="mt-8 hairline-top pt-6"
      >
        <h2 id="history-heading" className="text-sm font-medium">
          <T zh="生命周期" en="Lifecycle" />
        </h2>
        {events.length === 0 ? (
          <p className="py-6 text-sm leading-6 text-muted-foreground">
            <T zh="还没有记录任何事件。" en="No events have been recorded yet." />
          </p>
        ) : (
          <ol className="mt-3 divide-y divide-border/70">
            {events.map((event) => (
              <li key={event.id} className="py-2.5 text-sm">
                <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                  <span className="min-w-0">
                    <span className="font-medium">{event.event}</span>
                    <span className="ml-3 text-muted-foreground">{event.actor}</span>
                  </span>
                  <time
                    dateTime={event.occurredAt}
                    className="tabular-nums text-muted-foreground"
                  >
                    <T
                      zh={zonedDateTime(event.occurredAt, OWNER_TIME_ZONE, 'zh')}
                      en={zonedDateTime(event.occurredAt, OWNER_TIME_ZONE, 'en')}
                    />
                  </time>
                </div>
                {Object.keys(event.detail).length > 0 &&
                  (isFlatDetail(event.detail) ? (
                    <dl className="mt-1 grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-0.5 text-sm">
                      {Object.entries(event.detail).map(([key, value]) => (
                        <Fragment key={key}>
                          <dt className="text-muted-foreground">{key}</dt>
                          <dd className="min-w-0 break-words">{String(value)}</dd>
                        </Fragment>
                      ))}
                    </dl>
                  ) : (
                    <code className="mt-1 block break-all font-mono text-sm text-muted-foreground">
                      {JSON.stringify(event.detail)}
                    </code>
                  ))}
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  )
}
