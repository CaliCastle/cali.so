import { createAdminOperationActionHandler } from '~/lib/ama/admin/booking-http'
import {
  getAmaAdminServices,
  ownerRequestAuthenticator,
} from '~/lib/ama/admin/server'
import { kickAmaOperations } from '~/lib/ama/booking/server'

export const maxDuration = 60

export async function POST(
  request: Request,
  { params }: { params: Promise<{ operationId: string }> },
) {
  const { operationId } = await params
  const { bookingAdmin, security, baseUrl } = getAmaAdminServices()
  const response = await createAdminOperationActionHandler({
    authenticator: ownerRequestAuthenticator,
    service: bookingAdmin,
    security,
    baseUrl,
  })(request, operationId)
  if (response.ok) kickAmaOperations()
  return response
}
