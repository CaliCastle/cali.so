'use client'

import { useEffect, useId, useRef, useState, type FormEvent } from 'react'

import { T } from '~/lib/i18n'
import { localize, useLocale } from '~/lib/locale-client'

export type AvailabilityWindowViewModel = {
  id: number
  isoWeekday: number
  startMinute: number
  endMinute: number
}

type AvailabilityWindowFormProps = {
  window?: AvailabilityWindowViewModel
  describedBy?: string
}

const weekdays = [
  { value: 1, zh: '星期一', en: 'Monday' },
  { value: 2, zh: '星期二', en: 'Tuesday' },
  { value: 3, zh: '星期三', en: 'Wednesday' },
  { value: 4, zh: '星期四', en: 'Thursday' },
  { value: 5, zh: '星期五', en: 'Friday' },
  { value: 6, zh: '星期六', en: 'Saturday' },
  { value: 7, zh: '星期日', en: 'Sunday' },
] as const

function formatMinute(minute: number) {
  if (minute === 24 * 60) return '24:00'
  const hour = Math.floor(minute / 60)
  return `${hour.toString().padStart(2, '0')}:${(minute % 60).toString().padStart(2, '0')}`
}

function timeOptions(firstMinute: number, lastMinute: number) {
  const options: number[] = []
  for (let minute = firstMinute; minute <= lastMinute; minute += 30) options.push(minute)
  return options
}

const startOptions = timeOptions(0, 23 * 60 + 30)
const endOptions = timeOptions(30, 24 * 60)

export function AvailabilityWindowForm({
  window: availabilityWindow,
  describedBy,
}: AvailabilityWindowFormProps) {
  const locale = useLocale()
  const weekdayId = useId()
  const [weekday, setWeekday] = useState(availabilityWindow?.isoWeekday ?? 1)
  const [pending, setPending] = useState<'save' | 'delete' | null>(null)
  const [deleteArmed, setDeleteArmed] = useState(false)
  const deleteTimerRef = useRef<number | null>(null)
  const isExisting = availabilityWindow !== undefined

  useEffect(
    () => () => {
      if (deleteTimerRef.current !== null) {
        window.clearTimeout(deleteTimerRef.current)
      }
    },
    [],
  )

  // Deleting a window is a two-step armed action: the first press asks for
  // confirmation on the button itself and disarms after 4 seconds.
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const submitter = (event.nativeEvent as SubmitEvent).submitter as
      | HTMLButtonElement
      | null
    if (submitter?.value === 'delete') {
      if (!deleteArmed) {
        event.preventDefault()
        setDeleteArmed(true)
        if (deleteTimerRef.current !== null) {
          window.clearTimeout(deleteTimerRef.current)
        }
        deleteTimerRef.current = window.setTimeout(
          () => setDeleteArmed(false),
          4000,
        )
        return
      }
      if (deleteTimerRef.current !== null) {
        window.clearTimeout(deleteTimerRef.current)
      }
      setPending('delete')
      return
    }
    setPending('save')
  }

  return (
    <form
      action="/api/admin/ama/availability"
      method="post"
      aria-describedby={describedBy}
      className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end"
      onSubmit={handleSubmit}
    >
      {availabilityWindow && (
        <input type="hidden" name="id" value={availabilityWindow.id} />
      )}

      <div className="grid gap-1.5 text-sm">
        <input
          type="hidden"
          name="weekdayOriginal"
          value={availabilityWindow?.isoWeekday ?? 1}
        />
        {(['zh', 'en'] as const).map((language) => {
          const selectId = `${weekdayId}-weekday-${language}`
          return (
            <label
              key={language}
              htmlFor={selectId}
              data-zh-block={language === 'zh' ? true : undefined}
              data-en-block={language === 'en' ? true : undefined}
              className="grid gap-1.5"
            >
              <span className="text-muted-foreground">
                {language === 'zh' ? '星期' : 'Day'}
              </span>
              <select
                id={selectId}
                name={language === 'zh' ? 'weekdayZh' : 'weekdayEn'}
                value={weekday}
                disabled={pending !== null}
                onChange={(event) => setWeekday(Number(event.target.value))}
                className="min-h-11 w-full touch-manipulation rounded-md bg-background px-3 text-base shadow-[0_0_0_1px_var(--border)] outline-none focus-visible:shadow-[0_0_0_1px_var(--foreground)]"
              >
                {weekdays.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option[language]}
                  </option>
                ))}
              </select>
            </label>
          )
        })}
      </div>

      <label className="grid gap-1.5 text-sm">
        <span className="text-muted-foreground">
          <T zh="开始" en="Start" />
        </span>
        <select
          name="start"
          defaultValue={formatMinute(availabilityWindow?.startMinute ?? 9 * 60)}
          disabled={pending !== null}
          aria-label={localize(locale, '开始时间', 'Start time')}
          className="min-h-11 touch-manipulation rounded-md bg-background px-3 text-base tabular-nums shadow-[0_0_0_1px_var(--border)] outline-none focus-visible:shadow-[0_0_0_1px_var(--foreground)]"
        >
          {startOptions.map((minute) => (
            <option key={minute} value={formatMinute(minute)}>
              {formatMinute(minute)}
            </option>
          ))}
        </select>
      </label>

      <label className="grid gap-1.5 text-sm">
        <span className="text-muted-foreground">
          <T zh="结束" en="End" />
        </span>
        <select
          name="end"
          defaultValue={formatMinute(availabilityWindow?.endMinute ?? 12 * 60)}
          disabled={pending !== null}
          aria-label={localize(locale, '结束时间', 'End time')}
          className="min-h-11 touch-manipulation rounded-md bg-background px-3 text-base tabular-nums shadow-[0_0_0_1px_var(--border)] outline-none focus-visible:shadow-[0_0_0_1px_var(--foreground)]"
        >
          {endOptions.map((minute) => (
            <option key={minute} value={formatMinute(minute)}>
              {formatMinute(minute)}
            </option>
          ))}
        </select>
      </label>

      <div className="flex min-h-11 items-center gap-2 sm:justify-end">
        <button
          type="submit"
          name="intent"
          value={isExisting ? 'update' : 'create'}
          disabled={pending !== null}
          className="min-h-11 min-w-[5.5rem] touch-manipulation rounded-full bg-foreground px-4 text-sm font-medium text-background outline-none transition-transform duration-100 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-60 focus-visible:ring-1 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transform-none motion-reduce:transition-none"
        >
          {pending === 'save' ? (
            <T zh="正在保存…" en="Saving…" />
          ) : isExisting ? (
            <T zh="保存" en="Save" />
          ) : (
            <T zh="添加" en="Add" />
          )}
        </button>
        {isExisting && (
          <button
            type="submit"
            name="intent"
            value="delete"
            formNoValidate
            disabled={pending !== null}
            className={`min-h-11 min-w-[6rem] touch-manipulation rounded-full px-3 text-sm outline-none transition-transform duration-100 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-60 focus-visible:ring-1 motion-reduce:transform-none motion-reduce:transition-none ${
              deleteArmed
                ? 'text-destructive focus-visible:ring-destructive'
                : 'text-muted-foreground focus-visible:ring-foreground'
            }`}
          >
            {pending === 'delete' ? (
              <T zh="正在删除…" en="Deleting…" />
            ) : deleteArmed ? (
              <T zh="确认删除？" en="Confirm delete?" />
            ) : (
              <T zh="删除" en="Delete" />
            )}
          </button>
        )}
      </div>
    </form>
  )
}
