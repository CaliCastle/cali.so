'use client'

import { useEffect, useRef, useState, type FormEvent } from 'react'

import { T } from '~/lib/i18n'

import {
  AvailabilityWindowForm,
  type AvailabilityWindowViewModel,
} from './AvailabilityWindowForm'

export type { AvailabilityWindowViewModel } from './AvailabilityWindowForm'

export type GoogleCalendarIdentityViewModel = {
  calendarId: string
  summary: string | null
  email: string | null
}

export type GoogleConnectionStatus =
  | 'disconnected'
  | 'connected'
  | 'expired'
  | 'revoked'
  | 'denied-scope'
  | 'unavailable'

export type GoogleConnectionViewModel = {
  status: GoogleConnectionStatus
  identity: GoogleCalendarIdentityViewModel | null
}

export type PreviewSlotViewModel = {
  startsAt: string
  endsAt: string
}

export type AmaSettingsNotices = {
  availability?: 'saved' | 'invalid' | 'failed'
  calendar?: GoogleConnectionStatus
}

export type AmaSettingsProps = {
  windows: readonly AvailabilityWindowViewModel[]
  googleConnection: GoogleConnectionViewModel
  previewSlots: readonly PreviewSlotViewModel[]
  notices?: AmaSettingsNotices
}

const ownerTimeZone = 'Asia/Taipei'
const previewLimit = 12
const previewDateOptions: Intl.DateTimeFormatOptions = {
  timeZone: ownerTimeZone,
  weekday: 'short',
  month: 'short',
  day: 'numeric',
}
const previewTimeOptions: Intl.DateTimeFormatOptions = {
  timeZone: ownerTimeZone,
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
}
const previewDateFormatters = {
  zh: new Intl.DateTimeFormat('zh-TW', previewDateOptions),
  en: new Intl.DateTimeFormat('en-US', previewDateOptions),
}
const previewTimeFormatters = {
  zh: new Intl.DateTimeFormat('zh-TW', previewTimeOptions),
  en: new Intl.DateTimeFormat('en-US', previewTimeOptions),
}

function QueryNotices({
  notices,
  restoreFocus = false,
}: {
  notices: AmaSettingsNotices | undefined
  restoreFocus?: boolean
}) {
  const noticeRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (restoreFocus) noticeRef.current?.focus()
  }, [restoreFocus])

  if (!notices?.availability && !notices?.calendar) return null

  const availabilityCopy = {
    saved: { zh: '可预约时段已保存。', en: 'Availability Windows saved.' },
    invalid: {
      zh: '这个时段无效。请确认星期和起止时间。',
      en: 'That window is invalid. Check its day and start and end times.',
    },
    failed: {
      zh: '暂时无法保存时段，请重试。',
      en: 'The Availability Window could not be saved. Try again.',
    },
  } as const
  const calendarCopy = {
    disconnected: { zh: 'Google 日历已断开。', en: 'Google Calendar disconnected.' },
    connected: { zh: 'Google 日历已连接。', en: 'Google Calendar connected.' },
    expired: {
      zh: 'Google 连接流程已过期，请重新连接。',
      en: 'The Google connection attempt expired. Connect again.',
    },
    revoked: {
      zh: 'Google 授权已撤销，请重新连接。',
      en: 'Google access was revoked. Connect again.',
    },
    'denied-scope': {
      zh: '没有授予所需的日历权限，请重新连接并允许两项权限。',
      en: 'The required Calendar permissions were not granted. Connect again and allow both.',
    },
    unavailable: {
      zh: '暂时无法联系 Google，请稍后重试。',
      en: 'Google is unavailable right now. Try again shortly.',
    },
  } as const

  const availability = notices.availability
    ? availabilityCopy[notices.availability]
    : null
  const calendar = notices.calendar ? calendarCopy[notices.calendar] : null
  const isAlert =
    notices.availability === 'invalid' ||
    notices.availability === 'failed' ||
    (notices.calendar !== undefined &&
      notices.calendar !== 'connected' &&
      notices.calendar !== 'disconnected')

  return (
    <div
      ref={noticeRef}
      id={availability ? 'availability-notice' : 'calendar-notice'}
      role={isAlert ? 'alert' : 'status'}
      tabIndex={restoreFocus ? -1 : undefined}
      className="mt-4 rounded-md bg-surface-1 px-4 py-3 text-sm leading-6 outline-none"
    >
      {availability && <T zh={availability.zh} en={availability.en} />}
      {availability && calendar && ' '}
      {calendar && <T zh={calendar.zh} en={calendar.en} />}
    </div>
  )
}

function GoogleCalendarSection({
  connection,
  notice,
  restoreNoticeFocus,
}: {
  connection: GoogleConnectionViewModel
  notice?: GoogleConnectionStatus
  restoreNoticeFocus: boolean
}) {
  const [pending, setPending] = useState<'connect' | 'disconnect' | null>(null)
  const [disconnectArmed, setDisconnectArmed] = useState(false)
  const disconnectTimerRef = useRef<number | null>(null)

  useEffect(
    () => () => {
      if (disconnectTimerRef.current !== null) {
        window.clearTimeout(disconnectTimerRef.current)
      }
    },
    [],
  )

  function connect(event: FormEvent<HTMLFormElement>) {
    if (pending !== null) {
      event.preventDefault()
      return
    }
    setPending('connect')
  }

  // Disconnecting is a two-step armed action: the first press asks for
  // confirmation on the button itself and disarms after 4 seconds.
  function disconnect(event: FormEvent<HTMLFormElement>) {
    if (pending !== null) {
      event.preventDefault()
      return
    }
    if (!disconnectArmed) {
      event.preventDefault()
      setDisconnectArmed(true)
      if (disconnectTimerRef.current !== null) {
        window.clearTimeout(disconnectTimerRef.current)
      }
      disconnectTimerRef.current = window.setTimeout(
        () => setDisconnectArmed(false),
        4000,
      )
      return
    }
    if (disconnectTimerRef.current !== null) {
      window.clearTimeout(disconnectTimerRef.current)
    }
    setPending('disconnect')
  }

  const stateCopy = {
    disconnected: {
      zh: '尚未连接。连接后会用 Google 日历排除已有安排。',
      en: 'Not connected. Connect to exclude existing events from availability.',
    },
    connected: {
      zh: '连接正常。日历中的忙碌时间会从预览中排除。',
      en: 'Connected and healthy. Busy Calendar time is excluded from the preview.',
    },
    expired: {
      zh: '连接流程已经过期，没有保存任何新凭据。请重新连接。',
      en: 'The connection attempt expired and no new credential was saved. Connect again.',
    },
    revoked: {
      zh: 'Google 已撤销访问权限。重新连接即可恢复忙碌时间检查。',
      en: 'Google revoked access. Reconnect to restore busy-time checks.',
    },
    'denied-scope': {
      zh: 'Google 没有授予事件与忙闲查询权限。请重新连接并允许两项权限。',
      en: 'Google did not grant event and free/busy access. Reconnect and allow both permissions.',
    },
    unavailable: {
      zh: '暂时无法检查 Google 日历。已保存的可预约时段不会丢失。',
      en: 'Google Calendar cannot be checked right now. Saved Availability Windows are safe.',
    },
  } as const
  const copy = stateCopy[connection.status]
  const connectLabel =
    connection.status === 'disconnected'
      ? { zh: '连接 Google 日历', en: 'Connect Google Calendar' }
      : { zh: '重新连接', en: 'Reconnect' }

  return (
    <section
      className="mt-8 hairline-top pt-6"
      aria-labelledby="google-heading"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-md">
          <h3 id="google-heading" className="text-sm font-medium">
            <T zh="Google 日历" en="Google Calendar" />
          </h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            <T zh={copy.zh} en={copy.en} />
          </p>
        </div>

        <div className="flex items-center gap-2">
          {connection.status !== 'connected' && (
            <form
              action="/api/admin/ama/google/connect"
              method="post"
              onSubmit={connect}
            >
              <button
                type="submit"
                disabled={pending !== null}
                className="min-h-11 touch-manipulation rounded-full bg-foreground px-4 text-sm font-medium text-background outline-none transition-transform duration-100 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-60 focus-visible:ring-1 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transform-none motion-reduce:transition-none"
              >
                {pending === 'connect' ? (
                  <T zh="正在连接…" en="Connecting…" />
                ) : (
                  <T zh={connectLabel.zh} en={connectLabel.en} />
                )}
              </button>
            </form>
          )}
          {connection.status !== 'disconnected' && (
            <form
              action="/api/admin/ama/google/disconnect"
              method="post"
              onSubmit={disconnect}
            >
              <button
                type="submit"
                disabled={pending !== null}
                className={`min-h-11 touch-manipulation rounded-full px-3 text-sm outline-none transition-transform duration-100 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-60 focus-visible:ring-1 motion-reduce:transform-none motion-reduce:transition-none ${
                  disconnectArmed
                    ? 'text-destructive focus-visible:ring-destructive'
                    : 'text-muted-foreground focus-visible:ring-foreground'
                }`}
              >
                {pending === 'disconnect' ? (
                  <T zh="正在断开…" en="Disconnecting…" />
                ) : disconnectArmed ? (
                  <T zh="确认断开？" en="Confirm disconnect?" />
                ) : (
                  <T zh="断开" en="Disconnect" />
                )}
              </button>
            </form>
          )}
        </div>
      </div>

      {disconnectArmed && pending === null && (
        <p className="mt-3 text-sm leading-5 text-muted-foreground">
          <T
            zh="可预约时段会保留，但在重新连接前无法检查日历冲突。"
            en="Availability Windows stay saved, but calendar conflicts cannot be checked until you reconnect."
          />
        </p>
      )}

      <QueryNotices
        notices={notice ? { calendar: notice } : undefined}
        restoreFocus={restoreNoticeFocus}
      />

      {connection.identity && (
        <dl className="mt-4 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[7rem_minmax(0,1fr)]">
          <dt className="text-muted-foreground">
            <T zh="日历" en="Calendar" />
          </dt>
          <dd className="min-w-0 break-words">
            {connection.identity.summary || connection.identity.email || connection.identity.calendarId}
          </dd>
          {connection.identity.email && (
            <>
              <dt className="text-muted-foreground">
                <T zh="账号" en="Account" />
              </dt>
              <dd className="min-w-0 break-words">{connection.identity.email}</dd>
            </>
          )}
        </dl>
      )}
    </section>
  )
}

function SlotPreview({ slots }: { slots: readonly PreviewSlotViewModel[] }) {
  const visibleSlots = slots.slice(0, previewLimit)

  return (
    <section className="mt-8 hairline-top pt-6" aria-labelledby="preview-heading">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 id="preview-heading" className="text-sm font-medium">
          <T zh="开放时间预览" en="Open-time preview" />
        </h3>
        <span className="text-sm text-muted-foreground tabular-nums">
          Asia/Taipei · UTC+8
        </span>
      </div>

      {visibleSlots.length === 0 ? (
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          <T
            zh="未来 30 天没有开放时间。添加可预约时段，或检查 Google 日历连接。"
            en="No open times in the next 30 days. Add an Availability Window or check Google Calendar."
          />
        </p>
      ) : (
        <>
          <ol className="mt-3 divide-y divide-border/70">
            {visibleSlots.map((slot) => {
              const startsAt = new Date(slot.startsAt)
              const endsAt = new Date(slot.endsAt)
              return (
                <li
                  key={slot.startsAt}
                  className="flex min-h-11 items-center justify-between gap-4 py-2 text-sm"
                >
                  <time dateTime={slot.startsAt}>
                    <T
                      zh={previewDateFormatters.zh.format(startsAt)}
                      en={previewDateFormatters.en.format(startsAt)}
                    />
                  </time>
                  <span className="text-muted-foreground tabular-nums">
                    <T
                      zh={`${previewTimeFormatters.zh.format(startsAt)}–${previewTimeFormatters.zh.format(endsAt)}`}
                      en={`${previewTimeFormatters.en.format(startsAt)}–${previewTimeFormatters.en.format(endsAt)}`}
                    />
                  </span>
                </li>
              )
            })}
          </ol>
          {slots.length > visibleSlots.length && (
            <p className="mt-3 text-sm text-muted-foreground tabular-nums">
              <T
                zh={`显示接下来的 ${visibleSlots.length} 个，共 ${slots.length} 个。`}
                en={`Showing the next ${visibleSlots.length} of ${slots.length}.`}
              />
            </p>
          )}
        </>
      )}
    </section>
  )
}

// The scheduling settings live at the bottom of the AMA page: Availability
// Windows and the Google Calendar connection keep their native form-POST
// contract (303 back to /admin/ama with ?availability= / ?calendar= notices).
export function AmaSettings({
  windows,
  googleConnection,
  previewSlots,
  notices,
}: AmaSettingsProps) {
  return (
    <section aria-labelledby="settings-heading" className="mt-10 hairline-top pt-6">
      <h2 id="settings-heading" className="text-sm font-medium text-muted-foreground">
        <T zh="设置" en="Settings" />
      </h2>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">
        <T
          zh="每次 60 分钟 · 至少提前 24 小时 · 开放未来 30 天 · 前后各留 15 分钟"
          en="60 minutes · 24-hour notice · 30-day horizon · 15-minute buffers"
        />
      </p>

      <section className="mt-6" aria-labelledby="availability-heading">
        <div className="max-w-md">
          <h3 id="availability-heading" className="text-sm font-medium">
            <T zh="每周可预约时段" en="Weekly Availability Windows" />
          </h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            <T
              zh="所有时间都按 Asia/Taipei 解释。可以在同一天添加多个时段。"
              en="All times are interpreted in Asia/Taipei. You can add multiple windows on one day."
            />
          </p>
        </div>

        <QueryNotices
          notices={
            notices?.availability
              ? { availability: notices.availability }
              : undefined
          }
          restoreFocus={notices?.availability !== undefined}
        />

        {windows.length > 0 && (
          <div className="mt-5 grid gap-5">
            {windows.map((window) => (
              <AvailabilityWindowForm
                key={window.id}
                window={window}
                describedBy={
                  notices?.availability && notices.availability !== 'saved'
                    ? 'availability-notice'
                    : undefined
                }
              />
            ))}
          </div>
        )}

        <div className="mt-6 hairline-top pt-5">
          <p className="mb-3 text-sm text-muted-foreground">
            <T zh="添加时段" en="Add a window" />
          </p>
          <AvailabilityWindowForm
            describedBy={
              notices?.availability && notices.availability !== 'saved'
                ? 'availability-notice'
                : undefined
            }
          />
        </div>
      </section>

      <GoogleCalendarSection
        connection={googleConnection}
        notice={notices?.calendar}
        restoreNoticeFocus={
          notices?.calendar !== undefined && notices.availability === undefined
        }
      />
      <SlotPreview slots={previewSlots} />
    </section>
  )
}
