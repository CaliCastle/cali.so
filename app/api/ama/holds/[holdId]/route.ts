import { createHoldStateHandler } from '~/lib/ama/booking/http'
import { getLocalConfirmationFixture } from '~/lib/ama/booking/local-confirmation-fixtures'
import { getAmaBookingServices } from '~/lib/ama/booking/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ holdId: string }> },
) {
  const { holdId } = await params
  const fixture = getLocalConfirmationFixture(holdId)
  if (fixture) {
    // Session facts mirror the real paid payload so the confirmation
    // plate renders in local development.
    const startsAt = new Date(Date.now() + 72 * 60 * 60 * 1000)
    return Response.json({
      hold: {
        state: 'paid',
        bookingStatus: fixture,
        startsAt: startsAt.toISOString(),
        endsAt: new Date(startsAt.getTime() + 60 * 60 * 1000).toISOString(),
        meetingProvider: 'google-meet',
        guestTimeZone: 'Asia/Taipei',
        // Finalizing has no link yet, mirroring the real lifecycle.
        meetingUrl:
          fixture === 'confirmed' ? 'https://meet.google.com/abc-defg-hij' : null,
      },
    })
  }

  const { booking } = getAmaBookingServices()
  return createHoldStateHandler({ service: booking })(request, holdId)
}
