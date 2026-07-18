import { createAdminBookingActionHandler } from '~/lib/ama/admin/booking-http'
import {
  getAmaAdminServices,
  ownerRequestAuthenticator,
} from '~/lib/ama/admin/server'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ bookingId: string }> },
) {
  const { bookingId } = await params
  const { bookingAdmin, security, baseUrl } = getAmaAdminServices()
  return createAdminBookingActionHandler({
    authenticator: ownerRequestAuthenticator,
    service: bookingAdmin,
    security,
    baseUrl,
  })(request, bookingId)
}
