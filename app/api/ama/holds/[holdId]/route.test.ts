import { afterEach, describe, expect, it, vi } from 'vitest'

import { getLocalConfirmationFixture } from '~/lib/ama/booking/local-confirmation-fixtures'
import { getAmaBookingServices } from '~/lib/ama/booking/server'

import { GET } from './route'

vi.mock('~/lib/ama/booking/server', () => ({
  getAmaBookingServices: vi.fn(),
}))

const CONFIRMED_HOLD_ID = '00000000-0000-4000-8000-000000000001'

afterEach(() => {
  vi.unstubAllEnvs()
  vi.mocked(getAmaBookingServices).mockReset()
})

describe('local AMA confirmation fixtures', () => {
  it.each([
    ['00000000-0000-4000-8000-000000000001', 'confirmed'],
    ['00000000-0000-4000-8000-000000000002', 'finalizing'],
    ['00000000-0000-4000-8000-000000000003', 'needs_reschedule'],
  ])('returns %s as %s in development', async (holdId, bookingStatus) => {
    vi.stubEnv('NODE_ENV', 'development')

    const response = await GET(
      new Request(`http://localhost/api/ama/holds/${holdId}`),
      { params: Promise.resolve({ holdId }) },
    )

    expect(response.status).toBe(200)
    // Session facts mirror the real paid payload; the fixture dates are
    // relative to now, so only their presence and shape are asserted.
    await expect(response.json()).resolves.toEqual({
      hold: {
        state: 'paid',
        bookingStatus,
        startsAt: expect.stringMatching(/T.*Z$/),
        endsAt: expect.stringMatching(/T.*Z$/),
        meetingProvider: 'google-meet',
        guestTimeZone: 'Asia/Taipei',
        meetingUrl:
          bookingStatus === 'confirmed'
            ? 'https://meet.google.com/abc-defg-hij'
            : null,
      },
    })
    expect(getAmaBookingServices).not.toHaveBeenCalled()
  })

  it('never exposes fixture data outside development', () => {
    expect(getLocalConfirmationFixture(CONFIRMED_HOLD_ID, 'production')).toBeNull()
    expect(getLocalConfirmationFixture(CONFIRMED_HOLD_ID, 'test')).toBeNull()
  })
})
