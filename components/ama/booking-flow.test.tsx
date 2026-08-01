// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { BookingFlow } from './booking-flow'
import { trackFunnelEvent } from '~/lib/analytics'
import { assignLocation } from '~/lib/navigation'

vi.mock('next/navigation', () => ({
  usePathname: () => '/ama/book',
}))
vi.mock('~/lib/navigation', () => ({
  assignLocation: vi.fn(),
}))
vi.mock('~/lib/analytics', () => ({
  trackFunnelEvent: vi.fn(),
}))

// Midday UTC start times keep both slots on one local day (and the third on
// the next) in every plausible test-runner time zone.
const SLOTS = [
  { startsAt: '2026-08-03T12:00:00.000Z', endsAt: '2026-08-03T13:00:00.000Z' },
  { startsAt: '2026-08-03T13:30:00.000Z', endsAt: '2026-08-03T14:30:00.000Z' },
  { startsAt: '2026-08-04T12:00:00.000Z', endsAt: '2026-08-04T13:00:00.000Z' },
]

const BASE_TIME = new Date('2026-08-01T10:00:00.000Z')
const HOLD_ID = '0f8b6c1e-8f4a-4f27-9d3e-5a2b7c4d1e90'

type MockResponse = { ok: boolean; status: number; json: () => Promise<unknown> }

function jsonResponse(status: number, body: unknown): MockResponse {
  return { ok: status >= 200 && status < 300, status, json: async () => body }
}

const fetchMock = vi.fn<(url: string, init?: RequestInit) => Promise<MockResponse>>()

function requestsTo(path: string) {
  return fetchMock.mock.calls.filter(([url]) => url === path)
}

function respondWithSlots(slots = SLOTS) {
  fetchMock.mockImplementation(async (url) => {
    if (url === '/api/ama/slots') return jsonResponse(200, { status: 'available', slots })
    throw new Error(`unexpected fetch ${url}`)
  })
}

async function flush() {
  await act(async () => {
    for (let index = 0; index < 25; index += 1) await Promise.resolve()
  })
}

async function renderOpenFlow() {
  respondWithSlots()
  render(<BookingFlow />)
  await flush()
}

function slotButtons() {
  return screen
    .getAllByRole('button')
    .filter((button) => button.hasAttribute('aria-pressed'))
}

function fillIntake() {
  fireEvent.change(screen.getByLabelText(/名字/), { target: { value: 'Ada Lovelace' } })
  fireEvent.change(screen.getByLabelText(/邮箱/), { target: { value: 'ada@example.com' } })
  fireEvent.click(screen.getAllByRole('checkbox')[0]!)
  fireEvent.change(screen.getByLabelText(/你想从这一小时/), {
    target: { value: 'I want to talk through my product roadmap.' },
  })
}

function submitButton() {
  return screen.getByRole('button', { name: /Hold this time/ })
}

function holdCreationImplementation({
  holdStatus = () =>
    jsonResponse(200, {
      hold: {
        state: 'active',
        startsAt: SLOTS[0]!.startsAt,
        endsAt: SLOTS[0]!.endsAt,
        expiresAt: new Date(BASE_TIME.getTime() + 15 * 60_000).toISOString(),
        checkoutStarted: false,
      },
    }),
  checkout = () =>
    jsonResponse(200, { checkout: { url: 'https://checkout.stripe.test/session' } }),
}: {
  holdStatus?: () => MockResponse
  checkout?: () => MockResponse
} = {}) {
  fetchMock.mockImplementation(async (url, init) => {
    if (url === '/api/ama/slots') return jsonResponse(200, { status: 'available', slots: SLOTS })
    if (url === '/api/ama/holds' && init?.method === 'POST') {
      return jsonResponse(201, {
        hold: {
          id: HOLD_ID,
          expiresAt: new Date(BASE_TIME.getTime() + 15 * 60_000).toISOString(),
          startsAt: SLOTS[0]!.startsAt,
          endsAt: SLOTS[0]!.endsAt,
        },
      })
    }
    if (url === `/api/ama/holds/${HOLD_ID}` && (!init || !init.method)) return holdStatus()
    if (url === `/api/ama/holds/${HOLD_ID}/checkout` && init?.method === 'POST') {
      return checkout()
    }
    throw new Error(`unexpected fetch ${url}`)
  })
}

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  cleanup()
  fetchMock.mockReset()
  vi.mocked(assignLocation).mockReset()
  vi.mocked(trackFunnelEvent).mockReset()
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('BookingFlow', () => {
  it('uses a calendar date picker and only shows times for the chosen day', async () => {
    await renderOpenFlow()

    expect(document.querySelector('[data-slot="calendar"]')).toBeTruthy()
    expect(document.querySelectorAll('[data-available="true"]').length).toBe(2)
    expect(slotButtons().length).toBe(2)
    expect(screen.getByRole('combobox')).toBeTruthy()

    fireEvent.click(slotButtons()[0]!)
    expect(slotButtons()[0]!.getAttribute('aria-pressed')).toBe('true')
    fireEvent.click(document.querySelector('[data-day-key="2026-08-04"]')!)
    expect(slotButtons().length).toBe(1)
    expect(slotButtons()[0]!.getAttribute('aria-pressed')).toBe('false')
  })

  it('re-groups on time zone change without losing typed intake', async () => {
    await renderOpenFlow()
    fillIntake()

    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'America/New_York' },
    })

    expect((screen.getByLabelText(/名字/) as HTMLInputElement).value).toBe('Ada Lovelace')
    expect((screen.getByLabelText(/邮箱/) as HTMLInputElement).value).toBe('ada@example.com')
    expect((screen.getByLabelText(/你想从这一小时/) as HTMLTextAreaElement).value).toBe(
      'I want to talk through my product roadmap.',
    )
    expect(screen.getAllByRole('checkbox')[0]!.getAttribute('aria-checked')).toBe('true')
    expect(slotButtons().length).toBe(2)
  })

  it('blocks submission with inline errors and focuses the first invalid field', async () => {
    await renderOpenFlow()
    fireEvent.click(slotButtons()[0]!)

    fireEvent.click(submitButton())
    await flush()

    expect(screen.getAllByRole('alert').length).toBeGreaterThanOrEqual(3)
    expect(document.activeElement).toBe(screen.getByLabelText(/名字/))
    expect(requestsTo('/api/ama/holds').length).toBe(0)

    // An invalid optional link is caught too.
    fillIntake()
    fireEvent.change(screen.getByLabelText(/链接 1/), { target: { value: 'not-a-url' } })
    fireEvent.click(submitButton())
    await flush()
    expect(document.activeElement).toBe(screen.getByLabelText(/链接 1/))
  })

  it('shows a countdown after the hold that reflects server refreshes', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(BASE_TIME)
    holdCreationImplementation({
      holdStatus: () =>
        jsonResponse(200, {
          hold: {
            state: 'active',
            startsAt: SLOTS[0]!.startsAt,
            endsAt: SLOTS[0]!.endsAt,
            // The server, not the local clock, owns the expiry.
            expiresAt: new Date(BASE_TIME.getTime() + 5 * 60_000).toISOString(),
            checkoutStarted: false,
          },
        }),
    })

    render(<BookingFlow />)
    await flush()
    fireEvent.click(slotButtons()[0]!)
    fillIntake()
    fireEvent.click(submitButton())
    await flush()

    expect(screen.getByText('15:00')).toBeTruthy()
    expect(vi.mocked(trackFunnelEvent)).toHaveBeenCalledWith('ama_hold_created')

    await act(async () => {
      document.dispatchEvent(new Event('visibilitychange'))
      for (let index = 0; index < 25; index += 1) await Promise.resolve()
    })

    expect(requestsTo(`/api/ama/holds/${HOLD_ID}`).length).toBe(1)
    expect(screen.getByText('5:00')).toBeTruthy()
  })

  it('recovers from a taken slot by refetching times and keeping intake', async () => {
    respondWithSlots()
    render(<BookingFlow />)
    await flush()
    fireEvent.click(slotButtons()[0]!)
    fillIntake()

    fetchMock.mockClear()
    fetchMock.mockImplementation(async (url, init) => {
      if (url === '/api/ama/holds' && init?.method === 'POST') {
        return jsonResponse(409, { error: 'slot_taken' })
      }
      if (url === '/api/ama/slots') {
        return jsonResponse(200, { status: 'available', slots: SLOTS.slice(1) })
      }
      throw new Error(`unexpected fetch ${url}`)
    })

    fireEvent.click(submitButton())
    await flush()

    expect(screen.getByRole('alert').textContent).toContain('That time was just taken')
    expect(requestsTo('/api/ama/slots').length).toBe(1)
    expect(slotButtons().length).toBe(1)
    expect(document.querySelectorAll('[data-available="true"]').length).toBe(2)
    expect((screen.getByLabelText(/名字/) as HTMLInputElement).value).toBe('Ada Lovelace')
    expect((screen.getByLabelText(/你想从这一小时/) as HTMLTextAreaElement).value).toBe(
      'I want to talk through my product roadmap.',
    )
  })

  it('starts checkout from the hold stage and hands off to Stripe', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(BASE_TIME)
    holdCreationImplementation()
    render(<BookingFlow />)
    await flush()
    fireEvent.click(slotButtons()[0]!)
    fillIntake()
    fireEvent.click(submitButton())
    await flush()

    fireEvent.click(screen.getByRole('button', { name: /Continue to payment/ }))
    await flush()

    expect(requestsTo(`/api/ama/holds/${HOLD_ID}/checkout`).length).toBe(1)
    expect(vi.mocked(trackFunnelEvent)).toHaveBeenCalledWith('ama_checkout_started')
    expect(vi.mocked(assignLocation)).toHaveBeenCalledWith(
      'https://checkout.stripe.test/session',
    )
  })

  it('falls back to the alternate time request when slots are unavailable', async () => {
    fetchMock.mockImplementation(async (url) => {
      if (url === '/api/ama/slots') return jsonResponse(503, { error: 'dependency_unavailable' })
      throw new Error(`unexpected fetch ${url}`)
    })

    render(<BookingFlow />)
    await flush()

    expect(screen.getByText(/Times cannot be shown right now/)).toBeTruthy()
    expect(screen.getByRole('button', { name: /Send alternate time request/ })).toBeTruthy()
  })

  it('submits an alternate time request without holding or paying', async () => {
    fetchMock.mockImplementation(async (url, init) => {
      if (url === '/api/ama/slots') return jsonResponse(503, { error: 'dependency_unavailable' })
      if (url === '/api/ama/alternate-time-requests' && init?.method === 'POST') {
        return jsonResponse(201, { request: { received: true } })
      }
      throw new Error(`unexpected fetch ${url}`)
    })

    render(<BookingFlow />)
    await flush()

    fireEvent.change(screen.getByLabelText(/名字/), { target: { value: 'Grace Hopper' } })
    fireEvent.change(screen.getByLabelText(/邮箱/), {
      target: { value: 'grace@example.com' },
    })
    fireEvent.change(screen.getByLabelText(/你方便的时间/), {
      target: { value: 'Weekday evenings after 8pm.' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Send alternate time request/ }))
    await flush()

    const [, init] = requestsTo('/api/ama/alternate-time-requests')[0]!
    const payload = JSON.parse(String(init?.body)) as Record<string, unknown>
    expect(payload.preferredWindows).toBe('Weekday evenings after 8pm.')
    expect(vi.mocked(trackFunnelEvent)).toHaveBeenCalledWith('ama_alternate_time_requested')
    expect(screen.getByText(/Got it, thank you/)).toBeTruthy()
    expect(screen.getByText(/no time is reserved yet/)).toBeTruthy()
  })
})
