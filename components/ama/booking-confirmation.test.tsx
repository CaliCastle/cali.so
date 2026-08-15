// @vitest-environment jsdom

import { act, cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { BookingConfirmation } from './booking-confirmation'
import { trackFunnelEvent } from '~/lib/analytics'

let search = ''

vi.mock('next/navigation', () => ({
  usePathname: () => '/ama/book/confirmation',
  useSearchParams: () => new URLSearchParams(search),
}))
vi.mock('~/lib/analytics', () => ({
  trackFunnelEvent: vi.fn(),
}))

const HOLD_ID = '0f8b6c1e-8f4a-4f27-9d3e-5a2b7c4d1e90'

type MockResponse = { ok: boolean; status: number; json: () => Promise<unknown> }

function jsonResponse(status: number, body: unknown): MockResponse {
  return { ok: status >= 200 && status < 300, status, json: async () => body }
}

const fetchMock = vi.fn<() => Promise<MockResponse>>()

function respondWithHoldStates(states: MockResponse[]) {
  let call = 0
  fetchMock.mockImplementation(async () => {
    const state = states[Math.min(call, states.length - 1)]!
    call += 1
    return state
  })
}

async function flush() {
  await act(async () => {
    for (let index = 0; index < 25; index += 1) await Promise.resolve()
  })
}

beforeEach(() => {
  search = `hold=${HOLD_ID}`
  vi.useFakeTimers()
  vi.stubGlobal('fetch', fetchMock)
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  )
})

afterEach(() => {
  cleanup()
  fetchMock.mockReset()
  vi.mocked(trackFunnelEvent).mockReset()
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('BookingConfirmation', () => {
  it('confirms payment once paid and stops polling', async () => {
    respondWithHoldStates([
      jsonResponse(200, { hold: { state: 'paid', bookingStatus: 'confirmed' } }),
    ])

    render(<BookingConfirmation />)
    await flush()

    expect(screen.getByText(/Payment confirmed/)).toBeTruthy()
    expect(screen.getByText(/付款已确认/)).toBeTruthy()
    expect(screen.getByText(/Manage Link/)).toBeTruthy()
    expect(vi.mocked(trackFunnelEvent)).toHaveBeenCalledExactlyOnceWith('ama_booking_paid')
    expect(document.querySelector('[data-ama-success-stage]')).not.toBeNull()
    expect(document.querySelectorAll('[data-ama-confetti-piece]').length).toBeGreaterThan(0)

    const callsAfterSettle = fetchMock.mock.calls.length
    await act(async () => {
      await vi.advanceTimersByTimeAsync(15_000)
    })
    expect(fetchMock.mock.calls.length).toBe(callsAfterSettle)
  })

  it('keeps polling through processing until the payment settles', async () => {
    respondWithHoldStates([
      jsonResponse(200, { hold: { state: 'processing' } }),
      jsonResponse(200, { hold: { state: 'paid', bookingStatus: 'finalizing' } }),
    ])

    render(<BookingConfirmation />)
    await flush()

    expect(screen.getByText(/Confirming your payment/)).toBeTruthy()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3_000)
    })

    expect(screen.getByText(/Payment confirmed/)).toBeTruthy()
    expect(screen.getByText(/being finalized/)).toBeTruthy()
    expect(document.querySelector('[data-ama-success-stage]')).not.toBeNull()
  })

  it('hides a stale meeting link while a paid Booking is finalizing', async () => {
    respondWithHoldStates([
      jsonResponse(200, {
        hold: {
          state: 'paid',
          bookingStatus: 'finalizing',
          startsAt: '2026-08-10T12:00:00.000Z',
          endsAt: '2026-08-10T13:00:00.000Z',
          meetingProvider: 'tencent-meeting',
          guestTimeZone: 'Asia/Shanghai',
          meetingUrl: 'https://meeting.tencent.com/stale-room',
        },
      }),
    ])

    render(<BookingConfirmation />)
    await flush()

    expect(screen.getByText(/being finalized/)).toBeTruthy()
    expect(screen.queryByRole('link', { name: /stale-room/ })).toBeNull()
    expect(screen.queryByText(/stale-room/)).toBeNull()
  })

  it('tells the truth when payment landed but the time was taken', async () => {
    respondWithHoldStates([
      jsonResponse(200, { hold: { state: 'paid', bookingStatus: 'needs_reschedule' } }),
    ])

    render(<BookingConfirmation />)
    await flush()

    expect(screen.getByText(/that time was taken while you paid/)).toBeTruthy()
    expect(screen.getByText(/Manage Link/)).toBeTruthy()
    expect(document.querySelector('[data-ama-success-stage]')).toBeNull()
    expect(document.querySelector('[data-ama-confetti-piece]')).toBeNull()
  })

  it('offers a way back when the hold expired unpaid', async () => {
    respondWithHoldStates([jsonResponse(200, { hold: { state: 'expired' } })])

    render(<BookingConfirmation />)
    await flush()

    expect(screen.getByText(/expired without a payment/)).toBeTruthy()
    expect(
      screen.getByRole('link', { name: /重新选择时间|Pick a new time/ }).getAttribute('href'),
    ).toBe('/ama/book')
    expect(vi.mocked(trackFunnelEvent)).not.toHaveBeenCalled()

    const callsAfterSettle = fetchMock.mock.calls.length
    await act(async () => {
      await vi.advanceTimersByTimeAsync(15_000)
    })
    expect(fetchMock.mock.calls.length).toBe(callsAfterSettle)
  })

  it('handles a cancelled hold as terminal', async () => {
    respondWithHoldStates([jsonResponse(200, { hold: { state: 'cancelled' } })])

    render(<BookingConfirmation />)
    await flush()

    expect(screen.getByText(/This booking was cancelled/)).toBeTruthy()

    const callsAfterSettle = fetchMock.mock.calls.length
    await act(async () => {
      await vi.advanceTimersByTimeAsync(15_000)
    })
    expect(fetchMock.mock.calls.length).toBe(callsAfterSettle)
  })

  it('shows a generic empty state for an unknown hold or missing param', async () => {
    respondWithHoldStates([jsonResponse(404, { error: 'not_found' })])
    render(<BookingConfirmation />)
    await flush()
    expect(screen.getByText(/Nothing to show here/)).toBeTruthy()
    cleanup()

    search = ''
    fetchMock.mockClear()
    render(<BookingConfirmation />)
    await flush()
    expect(screen.getByText(/Nothing to show here/)).toBeTruthy()
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
