import { createAdminBookingActionHandler } from '~/lib/ama/admin/booking-http'
import {
  getAmaAdminServices,
  ownerRequestAuthenticator,
} from '~/lib/ama/admin/server'
import { kickAmaOperations } from '~/lib/ama/booking/server'

export const maxDuration = 60

export async function POST(
  request: Request,
  { params }: { params: Promise<{ bookingId: string }> },
) {
  const { bookingId } = await params
  const { bookingAdmin, security, baseUrl } = getAmaAdminServices()
  const response = await createAdminBookingActionHandler({
    authenticator: ownerRequestAuthenticator,
    service: bookingAdmin,
    security,
    baseUrl,
  })(request, bookingId)
  if (response.ok) kickAmaOperations()
  return response
}
