// @vitest-environment jsdom

import { cleanup, fireEvent, render, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  AmaOperations,
  type AmaOperationsProps,
} from '../../../app/admin/(protected)/ama/AmaOperations'

const fetchMock = vi.fn<typeof fetch>()
vi.stubGlobal('fetch', fetchMock)

beforeEach(() => {
  // Notices from localize() follow the admin locale preference.
  document.documentElement.dataset.locale = 'en'
})

afterEach(() => {
  cleanup()
  fetchMock.mockReset()
  delete document.documentElement.dataset.locale
})

function jsonResponse(body: unknown, status = 200) {
  return Response.json(body, { status })
}

function buttonWithText(container: HTMLElement, text: string) {
  const button = Array.from(container.querySelectorAll('button')).find((item) =>
    item.textContent?.includes(text),
  )
  if (!button) throw new Error(`No button containing "${text}"`)
  return button
}

const settings: AmaOperationsProps['settings'] = {
  windows: [{ id: 1, isoWeekday: 1, startMinute: 540, endMinute: 720 }],
  googleConnection: { status: 'disconnected', identity: null },
  previewSlots: [],
}

const fixtures: AmaOperationsProps = {
  upcoming: [
    {
      id: 'bk_upcoming',
      status: 'confirmed',
      guestName: 'Ada Lovelace',
      guestEmail: 'ada@example.com',
      guestTimeZone: 'America/New_York',
      meetingProvider: 'google-meet',
      startsAt: '2026-08-01T02:00:00.000Z',
      endsAt: '2026-08-01T03:00:00.000Z',
      refundStatus: 'none',
      hasMeetingLink: true,
      hasBrief: false,
    },
  ],
  past: [
    {
      id: 'bk_past',
      status: 'confirmed',
      guestName: 'Grace Hopper',
      guestEmail: 'grace@example.com',
      guestTimeZone: 'Europe/Berlin',
      meetingProvider: 'tencent-meeting',
      startsAt: '2026-06-01T02:00:00.000Z',
      endsAt: '2026-06-01T03:00:00.000Z',
      refundStatus: 'none',
      hasMeetingLink: true,
      hasBrief: true,
    },
  ],
  attention: [
    {
      id: 'bk_attention',
      status: 'needs_reschedule',
      guestName: 'Alan Turing',
      guestEmail: 'alan@example.com',
      guestTimeZone: 'Asia/Tokyo',
      meetingProvider: 'google-meet',
      startsAt: '2026-08-02T02:00:00.000Z',
      endsAt: '2026-08-02T03:00:00.000Z',
      refundStatus: 'failed',
      hasMeetingLink: false,
      hasBrief: true,
    },
  ],
  timeRequests: [
    {
      id: 'req_1',
      guestName: 'Katherine Johnson',
      guestEmail: 'katherine@example.com',
      guestTimeZone: 'America/Chicago',
      preferredWindows: 'Weekday evenings after 19:00',
      note: 'Any Friday works best.',
      createdAt: '2026-07-10T09:00:00.000Z',
    },
  ],
  failedOperations: [
    {
      id: 'op_failed',
      kind: 'issue_refund',
      bookingId: 'bk_attention',
      status: 'failed',
      attemptCount: 8,
      maxAttempts: 8,
      nextAttemptAt: '2026-07-16T00:00:00.000Z',
      lastErrorCode: 'stripe_unavailable',
    },
  ],
  settings,
}

const emptyFixtures: AmaOperationsProps = {
  upcoming: [],
  past: [],
  attention: [],
  timeRequests: [],
  failedOperations: [],
  settings,
}

describe('AMA admin page', () => {
  it('leads with attention, then upcoming prep, and retires the status strip', () => {
    const { container } = render(<AmaOperations {...fixtures} />)
    const text = container.textContent!

    // Header counts: upcoming and everything needing a hand.
    const countLine = container.querySelector('h1 + p')!
    expect(countLine.textContent).toContain('1 ')
    expect(countLine.textContent).toContain('3 ')
    expect(countLine.className).toContain('tabular-nums')

    // Attention comes first: the broken booking, the failed operation, and
    // the new Alternate Time Request.
    const sections = Array.from(container.querySelectorAll('section'))
    expect(sections[0]?.textContent).toContain('Alan Turing')
    expect(sections[0]?.textContent).toContain('stripe_unavailable')
    expect(sections[0]?.textContent).toContain('katherine@example.com')
    expect(sections[0]?.textContent).toContain('Weekday evenings after 19:00')
    expect(sections[0]?.textContent).toContain('Any Friday works best.')
    expect(sections[0]?.querySelector('.text-destructive')).not.toBeNull()

    // Upcoming rows link to the Booking detail with both time zones and
    // prep-at-a-glance indicators.
    expect(
      container.querySelector('a[href="/admin/ama/bookings/bk_upcoming"]'),
    ).not.toBeNull()
    expect(text).toContain('(Asia/Taipei)')
    expect(text).toContain('(America/New_York)')
    expect(text).toContain('Meeting link ready')
    expect(text).toContain('No Booking Brief')

    // The operation-status count strip is gone.
    expect(text).not.toContain('Succeeded')
    expect(text).not.toContain('Running')

    // Settings render at the bottom with the native form contract.
    expect(text).toContain('Weekly Availability Windows')
    expect(
      container.querySelector('form[action="/api/admin/ama/availability"]'),
    ).not.toBeNull()
    expect(
      container.querySelector('form[action="/api/admin/ama/google/connect"]'),
    ).not.toBeNull()
  })

  it('collapses past Bookings behind a toggle instead of the front page', () => {
    const { container } = render(<AmaOperations {...fixtures} />)

    const details = container.querySelector('details')!
    expect(details.open).toBe(false)
    expect(details.textContent).toContain('Grace Hopper')
    expect(details.querySelector('summary')?.textContent).toContain('1')
  })

  it('shows one quiet all-clear line when nothing needs attention', () => {
    const { container } = render(<AmaOperations {...emptyFixtures} />)
    const text = container.textContent!

    expect(text).toContain('All clear.')
    expect(text).toContain('There are no upcoming Bookings.')
    expect(text).toContain('There are no past Bookings yet.')
    expect(container.querySelector('.text-destructive')).toBeNull()
  })

  it('resolves an Alternate Time Request, removes its row, and drops the count', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ result: 'done' }))
    const { container } = render(<AmaOperations {...fixtures} />)

    fireEvent.click(buttonWithText(container, 'Resolve'))

    await waitFor(() =>
      expect(container.textContent).not.toContain('katherine@example.com'),
    )
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/admin/ama/time-requests/req_1',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ action: 'resolve' }),
      }),
    )
    expect(container.textContent).toContain('Marked as resolved.')
    expect(container.querySelector('h1 + p')?.textContent).toContain('2 ')
  })

  it('retries a failed operation from the attention section', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ result: 'done' }))
    const { container } = render(<AmaOperations {...fixtures} />)

    fireEvent.click(buttonWithText(container, 'Retry'))

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/admin/ama/operations/op_failed',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ action: 'retry' }),
        }),
      ),
    )
    await waitFor(() =>
      expect(container.textContent).not.toContain('stripe_unavailable'),
    )
    // The retried operation no longer offers Retry (it is pending again).
    expect(
      Array.from(container.querySelectorAll('button')).some((item) =>
        item.textContent?.includes('Retry'),
      ),
    ).toBe(false)
    expect(container.querySelector('h1 + p')?.textContent).toContain('2 ')
  })

  it('requires an inline confirm before marking an operation resolved', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ result: 'done' }))
    const { container } = render(<AmaOperations {...fixtures} />)

    fireEvent.click(buttonWithText(container, 'Mark resolved'))
    expect(fetchMock).not.toHaveBeenCalled()

    fireEvent.click(buttonWithText(container, 'Confirm done outside the system'))
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/admin/ama/operations/op_failed',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ action: 'resolve' }),
        }),
      ),
    )
    await waitFor(() =>
      expect(container.textContent).toContain('Marked as manually resolved.'),
    )
    expect(container.textContent).not.toContain('stripe_unavailable')
  })

  it('keeps the row and shows a specific notice when an action fails', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ error: 'dependency_unavailable' }, 503),
    )
    const { container } = render(<AmaOperations {...fixtures} />)

    fireEvent.click(buttonWithText(container, 'Retry'))

    await waitFor(() =>
      expect(container.textContent).toContain(
        'Retry failed: the service is unavailable. Try again.',
      ),
    )
    expect(container.textContent).toContain('stripe_unavailable')
    expect(container.querySelectorAll('[role="status"]').length).toBeGreaterThan(0)
  })
})
