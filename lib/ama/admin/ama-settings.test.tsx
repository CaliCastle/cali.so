// @vitest-environment jsdom

import { act, cleanup, fireEvent, render } from '@testing-library/react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  AmaSettings,
  type AmaSettingsProps,
} from '../../../app/admin/(protected)/ama/AmaSettings'
import { AvailabilityWindowForm } from '../../../app/admin/(protected)/ama/AvailabilityWindowForm'
import { LOCALE_CHANGE_EVENT } from '../../locale-client'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.useRealTimers()
  delete document.documentElement.dataset.locale
})

function settingsProps(
  status: AmaSettingsProps['googleConnection']['status'],
): AmaSettingsProps {
  return {
    windows: [{ id: 1, isoWeekday: 1, startMinute: 540, endMinute: 720 }],
    googleConnection: {
      status,
      identity:
        status === 'disconnected'
          ? null
          : {
              calendarId: 'owner@example.com',
              summary: 'Cali Castle',
              email: 'owner@example.com',
            },
    },
    previewSlots: [
      {
        startsAt: '2026-07-15T01:00:00.000Z',
        endsAt: '2026-07-15T02:00:00.000Z',
      },
    ],
    notices: { availability: 'invalid', calendar: status },
  }
}

function renderSettingsMarkup(
  status: AmaSettingsProps['googleConnection']['status'],
) {
  return renderToStaticMarkup(<AmaSettings {...settingsProps(status)} />)
}

describe('AMA settings UI contract', () => {
  it('keeps bilingual scheduling content and accessible form recovery in static HTML', () => {
    const html = renderSettingsMarkup('expired')

    expect(html).toMatch(/<label[^>]+for="[^"]+-weekday-zh"[^>]+data-zh-block="true"/)
    expect(html).toMatch(/<label[^>]+for="[^"]+-weekday-en"[^>]+data-en-block="true"/)
    expect(html).toContain('<option value="1" selected="">星期一</option>')
    expect(html).toContain('<option value="1" selected="">Monday</option>')
    expect(html).toContain('data-zh="true"')
    expect(html).toContain('data-en="true"')
    expect(html).toContain('Wed, Jul 15')
    expect(html).toContain('aria-describedby="availability-notice"')
    expect(html).toContain('id="availability-notice"')
    expect(html).toContain('min-h-11')
    expect(html).toContain('motion-reduce:transition-none')
  })

  it('offers recovery and local disconnect for an unhealthy Calendar connection', () => {
    const html = renderSettingsMarkup('revoked')

    expect(html).toContain('action="/api/admin/ama/google/connect"')
    expect(html).toContain('action="/api/admin/ama/google/disconnect"')
    expect(html).toContain('owner@example.com')
  })

  it('does not offer disconnect before a Calendar has connected', () => {
    const html = renderSettingsMarkup('disconnected')

    expect(html).toContain('action="/api/admin/ama/google/connect"')
    expect(html).not.toContain('action="/api/admin/ama/google/disconnect"')
  })

  it('submits Google connect directly and locks in a pending state', () => {
    const { container } = render(
      <AmaSettings
        windows={[]}
        googleConnection={{ status: 'disconnected', identity: null }}
        previewSlots={[]}
      />,
    )
    const form = container.querySelector<HTMLFormElement>(
      'form[action="/api/admin/ama/google/connect"]',
    )!

    const firstSubmit = fireEvent.submit(form)
    expect(firstSubmit).toBe(true)
    expect(form.querySelector('button')?.textContent).toContain('Connecting')

    const repeatSubmit = fireEvent.submit(form)
    expect(repeatSubmit).toBe(false)
  })

  it('requires arming disconnect before the form posts, and disarms after 4s', () => {
    vi.useFakeTimers()
    const { container } = render(
      <AmaSettings
        windows={[]}
        googleConnection={{
          status: 'connected',
          identity: {
            calendarId: 'owner@example.com',
            summary: 'Cali Castle',
            email: 'owner@example.com',
          },
        }}
        previewSlots={[]}
      />,
    )
    const form = container.querySelector<HTMLFormElement>(
      'form[action="/api/admin/ama/google/disconnect"]',
    )!
    const button = form.querySelector('button')!

    // The first submit arms the button instead of posting.
    const armed = fireEvent.submit(form)
    expect(armed).toBe(false)
    expect(button.textContent).toContain('Confirm disconnect?')

    // Left alone, the armed state expires.
    act(() => {
      vi.advanceTimersByTime(4000)
    })
    expect(button.textContent).toContain('Disconnect')
    expect(button.textContent).not.toContain('Confirm')

    // Arm again and confirm within the window: the form posts.
    fireEvent.submit(form)
    const confirmed = fireEvent.submit(form)
    expect(confirmed).toBe(true)
    expect(button.textContent).toContain('Disconnecting')
  })

  it('preserves an edited weekday when the locale changes mid-form', () => {
    const { container } = render(<AvailabilityWindowForm />)
    const zhSelect = container.querySelector<HTMLSelectElement>('label[data-zh-block] select')!
    const enSelect = container.querySelector<HTMLSelectElement>('label[data-en-block] select')!

    fireEvent.change(zhSelect, { target: { value: '5' } })
    expect(zhSelect.value).toBe('5')
    expect(enSelect.value).toBe('5')

    act(() => {
      document.documentElement.dataset.locale = 'en'
      window.dispatchEvent(new Event(LOCALE_CHANGE_EVENT))
    })

    expect(enSelect.value).toBe('5')
    expect(enSelect.options[4]?.text).toBe('Friday')
    expect(zhSelect.options[4]?.text).toBe('星期五')
    const formData = new FormData(container.querySelector('form')!)
    expect(formData.get('weekdayZh')).toBe('5')
    expect(formData.get('weekdayEn')).toBe('5')
    expect(formData.get('weekdayOriginal')).toBe('1')
  })

  it('supports keyboard-style submission with a stable pending state', () => {
    const { container } = render(<AvailabilityWindowForm />)
    const form = container.querySelector('form')!
    form.addEventListener('submit', (event) => event.preventDefault())

    fireEvent.submit(form)

    const save = container.querySelector<HTMLButtonElement>('button[value="create"]')!
    expect(save.disabled).toBe(true)
    expect(save.textContent).toContain('Saving')
    for (const select of container.querySelectorAll('select')) {
      expect(select.disabled).toBe(true)
    }
  })

  it('restores focus to mutation feedback after a redirect render', () => {
    render(
      <AmaSettings
        windows={[]}
        googleConnection={{ status: 'disconnected', identity: null }}
        previewSlots={[]}
        notices={{ availability: 'saved' }}
      />,
    )

    expect(document.activeElement?.id).toBe('availability-notice')
    expect(document.activeElement?.getAttribute('tabindex')).toBe('-1')
  })

  it('requires arming delete before the form posts, and disarms after 4s', () => {
    vi.useFakeTimers()
    const { container } = render(
      <AvailabilityWindowForm
        window={{ id: 1, isoWeekday: 1, startMinute: 540, endMinute: 720 }}
      />,
    )
    const form = container.querySelector('form')!
    form.addEventListener('submit', (event) => event.preventDefault())
    const remove = container.querySelector<HTMLButtonElement>('button[value="delete"]')!

    // The first press arms the button instead of deleting.
    fireEvent.click(remove)
    expect(remove.disabled).toBe(false)
    expect(remove.textContent).toContain('Confirm delete?')

    // Left alone, the armed state expires.
    act(() => {
      vi.advanceTimersByTime(4000)
    })
    expect(remove.textContent).not.toContain('Confirm')

    // Arm again and confirm within the window: the delete submits.
    fireEvent.click(remove)
    fireEvent.click(remove)
    expect(remove.disabled).toBe(true)
    expect(remove.textContent).toContain('Deleting')
  })
})
