'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import { SlotPicker, type PublicSlot } from '~/components/ama/slot-picker'
import { Barcode } from '~/components/barcode'
import { Button } from '~/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import { Tooltip } from '~/components/ui/tooltip'
import { T } from '~/lib/i18n'
import { localize, useLocale } from '~/lib/locale-client'

type ManagedBooking = {
  status: string
  guestName: string
  locale: 'zh' | 'en'
  guestTimeZone: string
  startsAt: string
  endsAt: string
  meetingProvider: 'google-meet' | 'tencent-meeting'
  meetingUrl: string | null
  refundStatus: 'none' | 'pending' | 'refunded' | 'failed' | null
  canReschedule: boolean
  canCancel: boolean
  refundOnCancel: boolean
}

type ViewState =
  | { kind: 'loading' }
  | { kind: 'invalid' }
  | { kind: 'unreachable' }
  | { kind: 'view'; booking: ManagedBooking }

type RescheduleNotice =
  | 'window_closed'
  | 'slot_taken'
  | 'already_cancelled'
  | 'unavailable'
  | 'network'
  | null

const PROVIDER_LABELS: Record<ManagedBooking['meetingProvider'], { zh: string; en: string }> = {
  'google-meet': { zh: 'Google Meet', en: 'Google Meet' },
  'tencent-meeting': { zh: '腾讯会议', en: 'Tencent Meeting' },
}

const RESCHEDULE_NOTICES: Record<Exclude<RescheduleNotice, null>, { zh: string; en: string }> = {
  window_closed: {
    zh: '距离开始不足 24 小时，已经不能在线改期或取消。有特殊情况请直接回复确认邮件。',
    en: 'The session starts in less than 24 hours, so online changes are closed. If something urgent came up, reply to your confirmation email.',
  },
  slot_taken: {
    zh: '这个时间刚刚被订走了，请再选一个。',
    en: 'That time was just taken. Please pick another one.',
  },
  already_cancelled: {
    zh: '这次预订已经取消了。',
    en: 'This booking has already been cancelled.',
  },
  unavailable: {
    zh: '服务暂时不可用，请稍后再试。',
    en: 'The service is temporarily unavailable. Please try again shortly.',
  },
  network: {
    zh: '网络似乎断开了，请检查连接后重试。',
    en: 'The network seems offline. Check your connection and try again.',
  },
}

/** The ornamental barcode label: the session's date in the guest's zone. */
function sessionDateCode(iso: string, timeZone: string) {
  const options: Intl.DateTimeFormatOptions = {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }
  try {
    return new Intl.DateTimeFormat('en-CA', options)
      .format(new Date(iso))
      .replaceAll('-', '')
  } catch {
    return new Intl.DateTimeFormat('en-CA', { ...options, timeZone: 'UTC' })
      .format(new Date(iso))
      .replaceAll('-', '')
  }
}

function bookingTime(booking: ManagedBooking, timeZone: string) {
  const start = new Date(booking.startsAt)
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
    hour: 'numeric',
    minute: '2-digit',
    timeZone,
  }
  try {
    return {
      zh: new Intl.DateTimeFormat('zh-CN', { ...options, hour12: false, hour: '2-digit' }).format(start),
      en: new Intl.DateTimeFormat('en-US', { ...options, hour12: true }).format(start),
    }
  } catch {
    return { zh: start.toISOString(), en: start.toISOString() }
  }
}

async function postJson(url: string, body: unknown) {
  return fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

/**
 * The Manage Link surface: one private token, one Booking. An invalid token
 * discloses nothing beyond "not valid".
 */
export function ManageBooking({ token }: { token: string }) {
  const locale = useLocale()
  const [state, setState] = useState<ViewState>({ kind: 'loading' })

  const [rescheduleOpen, setRescheduleOpen] = useState(false)
  const [slots, setSlots] = useState<PublicSlot[] | null>(null)
  const [slotsUnavailable, setSlotsUnavailable] = useState(false)
  const [timeZone, setTimeZone] = useState('UTC')
  const [selected, setSelected] = useState<string | null>(null)
  const [pending, setPending] = useState<'reschedule' | 'cancel' | null>(null)
  const [notice, setNotice] = useState<RescheduleNotice>(null)
  const [confirmingCancel, setConfirmingCancel] = useState(false)
  const [justRescheduled, setJustRescheduled] = useState(false)
  const [justCancelled, setJustCancelled] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const response = await fetch(`/api/ama/manage/${token}`)
        if (cancelled) return
        if (response.status === 404) return setState({ kind: 'invalid' })
        if (!response.ok) return setState({ kind: 'unreachable' })
        const body = (await response.json()) as { booking: ManagedBooking }
        setState({ kind: 'view', booking: body.booking })
        setTimeZone(body.booking.guestTimeZone || 'UTC')
      } catch {
        if (!cancelled) setState({ kind: 'unreachable' })
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [token])

  const fetchSlots = useCallback(async () => {
    setSlots(null)
    setSlotsUnavailable(false)
    try {
      const response = await fetch('/api/ama/slots')
      if (!response.ok) return setSlotsUnavailable(true)
      const body = (await response.json()) as {
        status: 'available' | 'unavailable'
        slots: PublicSlot[]
      }
      if (body.status !== 'available') return setSlotsUnavailable(true)
      setSlots(body.slots)
    } catch {
      setSlotsUnavailable(true)
    }
  }, [])

  function openReschedule() {
    setRescheduleOpen(true)
    setNotice(null)
    setSelected(null)
    void fetchSlots()
  }

  async function confirmReschedule() {
    if (state.kind !== 'view' || !selected) return
    setPending('reschedule')
    setNotice(null)
    try {
      const response = await postJson(`/api/ama/manage/${token}/reschedule`, {
        startsAt: selected,
      })
      if (response.ok) {
        const body = (await response.json()) as { booking: ManagedBooking }
        setState({ kind: 'view', booking: body.booking })
        setRescheduleOpen(false)
        setSelected(null)
        setJustRescheduled(true)
        return
      }
      if (response.status === 409) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null
        if (body?.error === 'window_closed') return setNotice('window_closed')
        if (body?.error === 'already_cancelled') return setNotice('already_cancelled')
        // stale_slot and slot_taken share the recovery: refresh and repick.
        setNotice('slot_taken')
        setSelected(null)
        void fetchSlots()
        return
      }
      if (response.status === 404) return setState({ kind: 'invalid' })
      setNotice('unavailable')
    } catch {
      setNotice('network')
    } finally {
      setPending(null)
    }
  }

  async function confirmCancel() {
    if (state.kind !== 'view') return
    setPending('cancel')
    setNotice(null)
    try {
      const response = await postJson(`/api/ama/manage/${token}/cancel`, {})
      if (response.ok) {
        const body = (await response.json()) as { booking: ManagedBooking }
        setState({ kind: 'view', booking: body.booking })
        setConfirmingCancel(false)
        setJustCancelled(true)
        return
      }
      if (response.status === 409) return setNotice('already_cancelled')
      if (response.status === 404) return setState({ kind: 'invalid' })
      setNotice('unavailable')
    } catch {
      setNotice('network')
    } finally {
      setPending(null)
    }
  }

  const time = useMemo(
    () => (state.kind === 'view' ? bookingTime(state.booking, state.booking.guestTimeZone) : null),
    [state],
  )

  if (state.kind === 'loading') {
    return (
      <div role="status" aria-live="polite" className="flex flex-col gap-4">
        <p className="sr-only">{localize(locale, '正在加载…', 'Loading…')}</p>
        <div aria-hidden className="flex flex-col gap-4 motion-safe:animate-pulse motion-reduce:animate-none">
          <div className="h-32 rounded-md bg-muted" />
          <div className="h-11 w-48 rounded-md bg-muted" />
        </div>
      </div>
    )
  }

  if (state.kind === 'invalid') {
    return (
      <div role="status">
        <p className="text-sm font-medium">
          <T zh="这个链接无效。" en="This link is not valid." />
        </p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          <T
            zh="请检查邮件里的原始链接。如果还是打不开，直接回复那封邮件即可。"
            en="Please check the original link in your email. If it still does not open, just reply to that email."
          />
        </p>
      </div>
    )
  }

  if (state.kind === 'unreachable') {
    return (
      <div role="status">
        <p className="text-sm font-medium">
          <T zh="暂时加载不了这个预订。" en="This booking cannot be loaded right now." />
        </p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          <T zh="请稍后刷新再试。" en="Please refresh and try again in a moment." />
        </p>
      </div>
    )
  }

  const { booking } = state
  const providerLabel = PROVIDER_LABELS[booking.meetingProvider] ?? {
    zh: booking.meetingProvider,
    en: booking.meetingProvider,
  }
  const isCancelled = booking.status === 'cancelled'
  const isFinalizing = booking.status === 'finalizing'

  return (
    <div className="flex flex-col gap-8">
      {justRescheduled && (
        <p role="status" className="text-sm font-medium">
          <T zh="改期成功，确认邮件稍后送达。" en="Rescheduled. An updated confirmation email is on its way." />
        </p>
      )}
      {justCancelled && (
        <p role="status" className="text-sm font-medium">
          <T zh="已取消。" en="Cancelled." />
        </p>
      )}

      {/* The booking as a nameplate: the data is the session's own
          specification, so it takes the boxed plate register the AMA page
          established. Secondary notes ride inside the value cell; the
          meeting link lives in the plate once it exists — the guest's copy
          of the session's spec sheet. */}
      <section aria-label={localize(locale, '预订详情', 'Booking details')}>
        <dl className="spec-nameplate">
          {/* The zone label is supplementary: hovering the time reveals it
              as a tooltip. The printed time is already in the guest's zone. */}
          <div>
            <dt>
              <T zh="时间" en="Time" />
            </dt>
            <dd className="min-w-0 break-words">
              <Tooltip content={booking.guestTimeZone}>
                <span>{time && <T zh={time.zh} en={time.en} />}</span>
              </Tooltip>
            </dd>
          </div>

          <div>
            <dt>
              <T zh="会议方式" en="Meeting" />
            </dt>
            <dd className="min-w-0 break-words">
              <T zh={providerLabel.zh} en={providerLabel.en} />
            </dd>
          </div>

          <div>
            <dt>
              <T zh="状态" en="Status" />
            </dt>
            <dd className="min-w-0 break-words">
              {isCancelled ? (
                <T zh="已取消" en="Cancelled" />
              ) : isFinalizing ? (
                <T zh="已付款，会议细节生成中" en="Paid, meeting details being finalized" />
              ) : (
                <T zh="已确认" en="Confirmed" />
              )}
              {isFinalizing && (
                <span className="block leading-5 text-muted-foreground">
                  {booking.meetingUrl ? (
                    <T
                      zh="会议资料正在更新。请勿使用之前的链接；新链接准备好后会通过邮件送达。"
                      en="Meeting details are being updated. Do not use a previous link. The new link will arrive by email once ready."
                    />
                  ) : (
                    <T
                      zh="会议链接正在创建，准备好后会通过邮件送达。"
                      en="The meeting link is being created and will arrive by email once ready."
                    />
                  )}
                </span>
              )}
              {booking.refundStatus && booking.refundStatus !== 'none' && (
                <span className="block leading-5 text-muted-foreground">
                  {booking.refundStatus === 'refunded' ? (
                    <T zh="退款已完成。" en="Refund completed." />
                  ) : (
                    // 'pending' and 'failed' both read as in-progress: a failed
                    // automatic refund is retried or handled by hand, and the
                    // guest never owes the difference.
                    <T
                      zh="退款处理中，通常几个工作日内原路退回。"
                      en="Refund in progress; it usually returns to your card within a few business days."
                    />
                  )}
                </span>
              )}
            </dd>
          </div>

          {booking.meetingUrl && !isCancelled && !isFinalizing && (
            <div>
              <dt>
                <T zh="会议链接" en="Link" />
              </dt>
              <dd className="min-w-0 break-all">
                <a
                  href={booking.meetingUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="underline decoration-current/35 underline-offset-2 outline-none transition-colors duration-150 hover:decoration-current focus-visible:rounded-sm focus-visible:ring-1 focus-visible:ring-current motion-reduce:transition-none"
                >
                  {booking.meetingUrl.replace(/^https?:\/\//, '')}
                </a>
              </dd>
            </div>
          )}
        </dl>
      </section>

      {!isCancelled && (booking.canReschedule || booking.canCancel) && (
        <section
          aria-label={localize(locale, '管理这次预订', 'Manage this booking')}
          className="flex flex-col gap-6"
        >
          {notice && (
            <p role="alert" className="text-sm text-foreground">
              <T zh={RESCHEDULE_NOTICES[notice].zh} en={RESCHEDULE_NOTICES[notice].en} />
            </p>
          )}

          {booking.canReschedule && (
            <div className="flex flex-col gap-4">
              {!rescheduleOpen ? (
                <div className="flex justify-center">
                  <Button
                    variant="tertiary"
                    size="lg"
                    aria-expanded={rescheduleOpen}
                    onClick={openReschedule}
                    expandHitArea
                  >
                    <T zh="改期" en="Reschedule" />
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-4 hairline-top pt-5">
                  {/* The flow heading in the heading-ornament register:
                      standalone hatch chip + tracked mono label. */}
                  <h2 className="section-tag">
                    <span className="section-tag-hatch" aria-hidden />
                    <span className="section-tag-label">
                      <T zh="选择新时间" en="Pick a new time" />
                    </span>
                  </h2>
                  {slots === null && !slotsUnavailable && (
                    <div role="status" aria-live="polite">
                      <p className="sr-only">
                        {localize(locale, '正在加载可选时间…', 'Loading available times…')}
                      </p>
                      <div aria-hidden className="grid grid-cols-3 gap-2 sm:grid-cols-4 motion-safe:animate-pulse motion-reduce:animate-none">
                        {Array.from({ length: 8 }, (_, index) => (
                          <div key={index} className="h-11 rounded-md bg-muted" />
                        ))}
                      </div>
                    </div>
                  )}
                  {slotsUnavailable && (
                    <p role="status" className="text-sm leading-6 text-muted-foreground">
                      <T
                        zh="现在拿不到可选时间，请稍后再试。"
                        en="Times cannot be loaded right now. Please try again shortly."
                      />
                    </p>
                  )}
                  {slots !== null && slots.length === 0 && (
                    <p role="status" className="text-sm leading-6 text-muted-foreground">
                      <T
                        zh="接下来 30 天暂时没有开放的时间。如果需要帮忙，请回复确认邮件。"
                        en="No open times in the next 30 days. If you need a hand, reply to your confirmation email."
                      />
                    </p>
                  )}
                  {slots !== null && slots.length > 0 && (
                    <SlotPicker
                      slots={slots}
                      timeZone={timeZone}
                      onTimeZoneChange={setTimeZone}
                      selected={selected}
                      onSelect={setSelected}
                      onDateChange={() => setSelected(null)}
                      disabled={pending !== null}
                    />
                  )}
                  <div className="flex flex-wrap items-center gap-3">
                    <Button
                      variant="primary"
                      size="lg"
                      disabled={pending !== null || !selected}
                      loading={pending === 'reschedule'}
                      onClick={() => void confirmReschedule()}
                    >
                      <T zh="确认改期" en="Confirm new time" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="lg"
                      disabled={pending !== null}
                      onClick={() => {
                        setRescheduleOpen(false)
                        setSelected(null)
                        setNotice(null)
                      }}
                    >
                      <T zh="保持原时间" en="Keep the current time" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {booking.canCancel && (
            <>
              {/* Hazard tape flanks the destructive doorway, centered like a
                  document-foot action; the confirmation is a hazard-marked
                  dialog on the surface ladder. */}
              <div className="flex items-center justify-center gap-3">
                <span className="ama-hazard-strip" aria-hidden />
                <Button
                  variant="ghost"
                  size="lg"
                  destructive
                  disabled={pending !== null}
                  onClick={() => setConfirmingCancel(true)}
                  aria-haspopup="dialog"
                  expandHitArea
                >
                  <T zh="取消预订" en="Cancel booking" />
                </Button>
                <span className="ama-hazard-strip" aria-hidden />
              </div>

              <Dialog open={confirmingCancel} onOpenChange={setConfirmingCancel}>
                <DialogContent size="sm" className="ama-cancel-dialog">
                  <DialogHeader className="pt-5">
                    <DialogTitle>
                      <T zh="取消预订" en="Cancel this booking" />
                    </DialogTitle>
                  </DialogHeader>
                  <DialogDescription>
                    {booking.refundOnCancel ? (
                      <T
                        zh="确定取消吗？付款会自动全额退款，原路退回。"
                        en="Cancel this booking? Your payment is refunded in full, automatically, back to your card."
                      />
                    ) : (
                      <T
                        zh="确定取消吗？距离开始已不足 24 小时，不会自动退款。"
                        en="Cancel this booking? The session starts in less than 24 hours, so there is no automatic refund."
                      />
                    )}
                  </DialogDescription>
                  {notice && (
                    <p role="alert" className="mt-3 px-5 text-sm leading-6">
                      <T
                        zh={RESCHEDULE_NOTICES[notice].zh}
                        en={RESCHEDULE_NOTICES[notice].en}
                      />
                    </p>
                  )}
                  <DialogFooter className="mt-4">
                    <DialogClose size="lg" disabled={pending !== null}>
                      <T zh="保留预订" en="Keep the booking" />
                    </DialogClose>
                    <Button
                      variant="primary"
                      size="lg"
                      destructive
                      disabled={pending !== null}
                      loading={pending === 'cancel'}
                      onClick={() => void confirmCancel()}
                    >
                      {booking.refundOnCancel ? (
                        <T zh="取消并退款" en="Cancel and refund" />
                      ) : (
                        <T zh="仍然取消" en="Cancel anyway" />
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </>
          )}
        </section>
      )}

      {isCancelled && (
        <p className="text-sm leading-6 text-muted-foreground">
          {booking.refundStatus ? (
            <T
              zh="这次预订已取消。退款状态见上方。"
              en="This booking is cancelled. The refund status is shown above."
            />
          ) : (
            <T zh="这次预订已取消。" en="This booking is cancelled." />
          )}
        </p>
      )}

      {/* Ornamental proof-sheet foot — the session date as its label. */}
      <Barcode
        code={`AMA-${sessionDateCode(booking.startsAt, booking.guestTimeZone)}`}
        className="ama-success-barcode"
      />
    </div>
  )
}
