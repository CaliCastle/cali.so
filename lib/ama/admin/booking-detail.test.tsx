// @vitest-environment jsdom

import { cleanup, fireEvent, render, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const router = vi.hoisted(() => ({
  refresh: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => router,
  usePathname: () => '/admin/ama/bookings/bk_1',
  notFound: vi.fn(),
}))

import {
  BookingDetail,
  type BookingViewModel,
} from '../../../app/admin/(protected)/ama/bookings/[bookingId]/BookingDetail'

const fetchMock = vi.fn<typeof fetch>()
vi.stubGlobal('fetch', fetchMock)

beforeEach(() => {
  // Notices from localize() follow the admin locale preference.
  document.documentElement.dataset.locale = 'en'
})

afterEach(() => {
  cleanup()
  fetchMock.mockReset()
  router.refresh.mockReset()
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

const inThreeDays = new Date(Date.now() + 72 * 60 * 60 * 1000)
const inThreeDaysEnd = new Date(inThreeDays.getTime() + 60 * 60 * 1000)

function makeBooking(overrides: Partial<BookingViewModel> = {}): BookingViewModel {
  return {
    id: 'bk_1',
    status: 'confirmed',
    guestName: 'Ada Lovelace',
    guestEmail: 'ada@example.com',
    locale: 'en',
    guestTimeZone: 'America/New_York',
    topics: ['engineering'],
    briefText: 'I want to talk about durable workflows.',
    briefUrls: ['https://example.com/context'],
    briefPurgedAt: null,
    meetingProvider: 'google-meet',
    startsAt: inThreeDays.toISOString(),
    endsAt: inThreeDaysEnd.toISOString(),
    stripeCheckoutSessionId: 'cs_test_123',
    stripePaymentIntentId: 'pi_test_456',
    amountTotal: 9900,
    currency: 'usd',
    refundStatus: 'none',
    stripeRefundId: null,
    refundedAt: null,
    refundReason: null,
    cancelledAt: null,
    cancelledBy: null,
    meetingUrl: 'https://meet.google.com/abc-defg-hij',
    googleCalendarEventId: 'gcal_evt_1',
    tencentMeetingId: null,
    createdAt: '2026-07-01T02:00:00.000Z',
    ...overrides,
  }
}

const events = [
  {
    id: 'evt_1',
    event: 'booking_confirmed',
    actor: 'system' as const,
    occurredAt: '2026-07-01T02:00:05.000Z',
    detail: {},
  },
  {
    id: 'evt_2',
    event: 'operation_retried',
    actor: 'owner' as const,
    occurredAt: '2026-07-02T02:00:00.000Z',
    detail: { kind: 'issue_refund' },
  },
  {
    id: 'evt_3',
    event: 'artifacts_updated',
    actor: 'system' as const,
    occurredAt: '2026-07-03T02:00:00.000Z',
    detail: { calendar: { eventId: 'gcal_evt_1' } },
  },
]

const operations = [
  {
    id: 'op_1',
    kind: 'send_reminder' as const,
    bookingId: 'bk_1',
    status: 'pending' as const,
    attemptCount: 0,
    maxAttempts: 8,
    nextAttemptAt: '2026-07-20T00:00:00.000Z',
    lastErrorCode: null,
  },
]

function renderDetail(booking = makeBooking()) {
  return render(
    <BookingDetail booking={booking} events={events} operations={operations} />,
  )
}

describe('AMA booking detail', () => {
  it('renders identity, payment, meeting, and lifecycle history', () => {
    const { container } = renderDetail()
    const text = container.textContent!

    expect(text).toContain('Ada Lovelace')
    expect(text).toContain('ada@example.com')
    expect(text).toContain('Engineering and full-stack')
    expect(text).toContain('I want to talk about durable workflows.')
    expect(text).toContain('https://example.com/context')
    expect(text).toContain('99.00')
    expect(text).toContain('cs_test_123')
    expect(text).toContain('pi_test_456')
    expect(text).toContain('https://meet.google.com/abc-defg-hij')
    expect(text).toContain('gcal_evt_1')
    expect(text).toContain('booking_confirmed')
    expect(text).toContain('operation_retried')
    // A flat event detail renders as definition rows, not raw JSON.
    const detailTerms = Array.from(container.querySelectorAll('ol dl dt'))
    expect(detailTerms.some((term) => term.textContent === 'kind')).toBe(true)
    expect(text).toContain('issue_refund')
    expect(text).not.toContain('{"kind":"issue_refund"}')
    // A nested detail keeps the JSON fallback.
    expect(text).toContain('{"calendar":{"eventId":"gcal_evt_1"}}')
    expect(text).toContain('(Asia/Taipei)')
    expect(text).toContain('(America/New_York)')
    // Operations for this Booking render with the shared rows.
    expect(text).toContain('Send reminder')
  })

  it('notes a purged Booking Brief instead of its content', () => {
    const { container } = renderDetail(
      makeBooking({
        briefText: null,
        briefUrls: null,
        briefPurgedAt: '2026-07-10T00:00:00.000Z',
      }),
    )

    expect(container.textContent).toContain('Purged')
    expect(container.textContent).toContain('已清除')
    expect(container.textContent).not.toContain('durable workflows')
  })

  it('cancels through a two-step confirm and sends the refund choice', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ result: 'done' }))
    const { container } = renderDetail()

    fireEvent.click(buttonWithText(container, 'Cancel Booking'))
    expect(fetchMock).not.toHaveBeenCalled()

    // More than 24 hours out, the full-refund choice defaults to checked.
    const checkbox = container.querySelector<HTMLInputElement>(
      'input[type="checkbox"]',
    )!
    expect(checkbox.checked).toBe(true)

    fireEvent.click(buttonWithText(container, 'Confirm cancellation'))

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/admin/ama/bookings/bk_1',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ action: 'cancel', refund: true }),
        }),
      ),
    )
    await waitFor(() => expect(container.textContent).toContain('was cancelled'))
    expect(router.refresh).toHaveBeenCalled()
  })

  it('keeps the Booking unchanged on a failed cancel and succeeds on retry', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ error: 'dependency_unavailable' }, 503))
      .mockResolvedValueOnce(jsonResponse({ result: 'done' }))
    const { container } = renderDetail()

    fireEvent.click(buttonWithText(container, 'Cancel Booking'))
    fireEvent.click(buttonWithText(container, 'Confirm cancellation'))

    await waitFor(() =>
      expect(container.textContent).toContain(
        'The cancellation did not complete and the Booking is unchanged.',
      ),
    )
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(router.refresh).not.toHaveBeenCalled()

    fireEvent.click(buttonWithText(container, 'Confirm cancellation'))

    await waitFor(() => expect(container.textContent).toContain('was cancelled'))
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('reschedules through the slot picker', async () => {
    const slot = {
      startsAt: '2026-08-03T02:00:00.000Z',
      endsAt: '2026-08-03T03:00:00.000Z',
    }
    fetchMock.mockImplementation(async (input, init) => {
      if (String(input) === '/api/ama/slots') {
        return jsonResponse({ status: 'available', slots: [slot] })
      }
      expect(String(input)).toBe('/api/admin/ama/bookings/bk_1')
      expect(init?.body).toBe(
        JSON.stringify({ action: 'reschedule', startsAt: slot.startsAt }),
      )
      return jsonResponse({ result: 'done' })
    })
    const { container } = renderDetail()

    fireEvent.click(buttonWithText(container, 'Reschedule'))

    // 02:00Z is 10:00 in the owner zone (Asia/Taipei).
    await waitFor(() => buttonWithText(container, '10:00'))
    fireEvent.click(buttonWithText(container, '10:00'))
    fireEvent.click(buttonWithText(container, 'Confirm reschedule'))

    await waitFor(() => expect(container.textContent).toContain('Rescheduled.'))
    expect(
      fetchMock.mock.calls.some(([input]) => String(input) === '/api/ama/slots'),
    ).toBe(true)
    expect(router.refresh).toHaveBeenCalled()
    expect(container.textContent).toContain('Finalizing')
  })

  it('refetches open times when the chosen slot is taken', async () => {
    const slot = {
      startsAt: '2026-08-03T02:00:00.000Z',
      endsAt: '2026-08-03T03:00:00.000Z',
    }
    fetchMock.mockImplementation(async (input) => {
      if (String(input) === '/api/ama/slots') {
        return jsonResponse({ status: 'available', slots: [slot] })
      }
      return jsonResponse({ error: 'slot_taken' }, 409)
    })
    const { container } = renderDetail()

    fireEvent.click(buttonWithText(container, 'Reschedule'))
    await waitFor(() => buttonWithText(container, '10:00'))
    fireEvent.click(buttonWithText(container, '10:00'))
    fireEvent.click(buttonWithText(container, 'Confirm reschedule'))

    await waitFor(() =>
      expect(container.textContent).toContain('That time is no longer available.'),
    )
    const slotFetches = fetchMock.mock.calls.filter(
      ([input]) => String(input) === '/api/ama/slots',
    )
    expect(slotFetches.length).toBe(2)
    expect(router.refresh).not.toHaveBeenCalled()
  })

  it('grants a refund exception for a cancelled unrefunded Booking', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ result: 'done' }))
    const { container } = renderDetail(
      makeBooking({ status: 'cancelled', cancelledBy: 'guest' }),
    )

    fireEvent.click(buttonWithText(container, 'Grant refund exception'))
    expect(fetchMock).not.toHaveBeenCalled()

    fireEvent.click(buttonWithText(container, 'Confirm refund exception'))

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/admin/ama/bookings/bk_1',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ action: 'refund-exception' }),
        }),
      ),
    )
    await waitFor(() =>
      expect(container.textContent).toContain('refund is in progress'),
    )
    expect(container.textContent).toContain('Refund pending')
  })

  it('explains a not_applicable refund exception without changing anything', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ error: 'not_applicable' }, 409))
    const { container } = renderDetail(
      makeBooking({ status: 'cancelled', cancelledBy: 'guest' }),
    )

    fireEvent.click(buttonWithText(container, 'Grant refund exception'))
    fireEvent.click(buttonWithText(container, 'Confirm refund exception'))

    await waitFor(() =>
      expect(container.textContent).toContain(
        'already refunded or refunding',
      ),
    )
    expect(container.textContent).not.toContain('Refund pending')
  })
})
