import { createPublicSlotsHandler } from '~/lib/ama/booking/http'
import { getAmaBookingServices } from '~/lib/ama/booking/server'
import { publicContentOnlyNotFound } from '~/lib/public-content-only'

export async function GET() {
  const unavailable = publicContentOnlyNotFound()
  if (unavailable) return unavailable
  const { booking } = getAmaBookingServices()
  return createPublicSlotsHandler({ service: booking })()
}
