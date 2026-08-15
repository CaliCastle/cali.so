// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ManageBooking } from './manage-booking'

vi.mock('next/navigation', () => ({
  usePathname: () => '/ama/manage/test-token',
}))

const TOKEN = 'test-token'

const SLOTS = [
  { startsAt: '2026-08-10T12:00:00.000Z', endsAt: '2026-08-10T13:00:00.000Z' },
  { startsAt: '2026-08-11T12:00:00.000Z', endsAt: '2026-08-11T13:00:00.000Z' },
]

type Booking = {
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

function booking(overrides: Partial<Booking> = {}): Booking {
  return {
    status: 'confirmed',
    guestName: 'Ada Lovelace',
    locale: 'en',
    guestTimeZone: 'America/New_York',
    startsAt: '2026-08-05T14:00:00.000Z',
    endsAt: '2026-08-05T15:00:00.000Z',
    meetingProvider: 'google-meet',
    meetingUrl: 'https://meet.google.com/abc-defg-hij',
    refundStatus: 'none',
    canReschedule: true,
    canCancel: true,
    refundOnCancel: true,
    ...overrides,
  }
}

type MockResponse = { ok: boolean; status: number; json: () => Promise<unknown> }

function jsonResponse(status: number, body: unknown): MockResponse {
  return { ok: status >= 200 && status < 300, status, json: async () => body }
}

const fetchMock = vi.fn<(url: string, init?: RequestInit) => Promise<MockResponse>>()

function requestsTo(path: string) {
  return fetchMock.mock.calls.filter(([url]) => url === path)
}

async function flush() {
  await act(async () => {
    for (let index = 0; index < 25; index += 1) await Promise.resolve()
  })
}

async function renderManage({
  view = booking(),
  reschedule,
  cancel,
}: {
  view?: Booking
  reschedule?: () => MockResponse
  cancel?: () => MockResponse
} = {}) {
  fetchMock.mockImplementation(async (url, init) => {
    if (url === `/api/ama/manage/${TOKEN}` && (!init || !init.method)) {
      return jsonResponse(200, { booking: view })
    }
    if (url === '/api/ama/slots') {
      return jsonResponse(200, { status: 'available', slots: SLOTS })
    }
    if (url === `/api/ama/manage/${TOKEN}/reschedule` && init?.method === 'POST') {
      return (
        reschedule?.() ??
        jsonResponse(200, {
          booking: booking({
            status: 'finalizing',
            startsAt: SLOTS[0]!.startsAt,
            endsAt: SLOTS[0]!.endsAt,
            meetingUrl: view.meetingUrl,
          }),
        })
      )
    }
    if (url === `/api/ama/manage/${TOKEN}/cancel` && init?.method === 'POST') {
      return (
        cancel?.() ??
        jsonResponse(200, {
          booking: booking({
            status: 'cancelled',
            refundStatus: 'pending',
            canReschedule: false,
            canCancel: false,
          }),
        })
      )
    }
    throw new Error(`unexpected fetch ${url}`)
  })

  render(<ManageBooking token={TOKEN} />)
  await flush()
}

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  cleanup()
  fetchMock.mockReset()
  vi.unstubAllGlobals()
})

describe('ManageBooking', () => {
  it('shows a disclosure-free state for an invalid link', async () => {
    fetchMock.mockImplementation(async () => jsonResponse(404, { error: 'not_found' }))

    render(<ManageBooking token={TOKEN} />)
    await flush()

    expect(screen.getByText(/This link is not valid/)).toBeTruthy()
    expect(screen.getByText(/这个链接无效/)).toBeTruthy()
    expect(screen.queryByText(/Ada Lovelace/)).toBeNull()
    expect(screen.queryByRole('button', { name: /Cancel booking/ })).toBeNull()
  })

  it('renders the booking summary with provider and the meeting link in the plate', async () => {
    await renderManage()

    // The zone label moved into a hover tooltip — never in the static DOM.
    expect(screen.queryByText('America/New_York')).toBeNull()
    expect(screen.getAllByText('Google Meet').length).toBeGreaterThanOrEqual(1)
    expect(
      screen
        .getByRole('link', { name: 'meet.google.com/abc-defg-hij' })
        .getAttribute('href'),
    ).toBe('https://meet.google.com/abc-defg-hij')
    expect(screen.getByText(/Confirmed/)).toBeTruthy()
  })

  it('notes a Finalizing Booking instead of pretending it is complete', async () => {
    await renderManage({
      view: booking({
        status: 'finalizing',
        meetingUrl: 'https://meet.google.com/stale-room',
      }),
    })

    expect(screen.getByText(/meeting details being finalized/)).toBeTruthy()
    expect(screen.queryByRole('link', { name: /stale-room/ })).toBeNull()
    expect(screen.queryByText(/stale-room/)).toBeNull()
  })

  it('cancels only after an explicit two-step confirmation', async () => {
    await renderManage()

    fireEvent.click(screen.getByRole('button', { name: /Cancel booking/ }))
    expect(requestsTo(`/api/ama/manage/${TOKEN}/cancel`).length).toBe(0)
    expect(screen.getByText(/refunded in full, automatically/)).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: /Cancel and refund/ }))
    await flush()

    expect(requestsTo(`/api/ama/manage/${TOKEN}/cancel`).length).toBe(1)
    expect(screen.getAllByText(/已取消。|Cancelled\./).length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText(/Refund in progress/)).toBeTruthy()
  })

  it('warns about the missing automatic refund inside 24 hours', async () => {
    await renderManage({ view: booking({ refundOnCancel: false, canReschedule: false }) })

    fireEvent.click(screen.getByRole('button', { name: /Cancel booking/ }))

    expect(screen.getByText(/no automatic refund/)).toBeTruthy()
    expect(screen.getByText(/不会自动退款/)).toBeTruthy()
    expect(screen.getByRole('button', { name: /Cancel anyway/ })).toBeTruthy()

    // The first step is reversible.
    fireEvent.click(screen.getByRole('button', { name: /Keep the booking/ }))
    expect(screen.queryByRole('button', { name: /Cancel anyway/ })).toBeNull()
    expect(requestsTo(`/api/ama/manage/${TOKEN}/cancel`).length).toBe(0)
  })

  it('reschedules through the shared slot picker', async () => {
    await renderManage()

    fireEvent.click(screen.getByRole('button', { name: /改期|Reschedule/ }))
    await flush()
    expect(requestsTo('/api/ama/slots').length).toBe(1)

    const slotButton = screen
      .getAllByRole('button')
      .find((button) => button.hasAttribute('aria-pressed'))
    expect(slotButton).toBeTruthy()
    fireEvent.click(slotButton!)
    fireEvent.click(screen.getByRole('button', { name: /Confirm new time/ }))
    await flush()

    const [, init] = requestsTo(`/api/ama/manage/${TOKEN}/reschedule`)[0]!
    expect(JSON.parse(String(init?.body))).toEqual({ startsAt: SLOTS[0]!.startsAt })
    expect(screen.getByText(/Rescheduled\./)).toBeTruthy()
    expect(screen.getByText(/meeting details being finalized/)).toBeTruthy()
    expect(screen.queryByRole('link', { name: /abc-defg-hij/ })).toBeNull()
  })

  it('explains the 24 hour rule when the reschedule window has closed', async () => {
    await renderManage({
      reschedule: () => jsonResponse(409, { error: 'window_closed' }),
    })

    fireEvent.click(screen.getByRole('button', { name: /改期|Reschedule/ }))
    await flush()
    const slotButton = screen
      .getAllByRole('button')
      .find((button) => button.hasAttribute('aria-pressed'))
    fireEvent.click(slotButton!)
    fireEvent.click(screen.getByRole('button', { name: /Confirm new time/ }))
    await flush()

    expect(screen.getByRole('alert').textContent).toContain('less than 24 hours')
    expect(screen.getByRole('alert').textContent).toContain('不足 24 小时')
  })
})
