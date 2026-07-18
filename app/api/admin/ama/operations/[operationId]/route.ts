import { createAdminOperationActionHandler } from '~/lib/ama/admin/booking-http'
import {
  getAmaAdminServices,
  ownerRequestAuthenticator,
} from '~/lib/ama/admin/server'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ operationId: string }> },
) {
  const { operationId } = await params
  const { bookingAdmin, security, baseUrl } = getAmaAdminServices()
  return createAdminOperationActionHandler({
    authenticator: ownerRequestAuthenticator,
    service: bookingAdmin,
    security,
    baseUrl,
  })(request, operationId)
}
