import { createManageRescheduleHandler } from '~/lib/ama/booking/http'
import {
  getAmaBookingServices,
  kickAmaOperations,
} from '~/lib/ama/booking/server'
import { protectAmaLaunchBoundary } from '~/lib/ama/security/launch-boundary-server'

export const maxDuration = 300

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const blocked = protectAmaLaunchBoundary(request, [
    'publicMutations',
    'bookingFinalization',
  ])
  if (blocked) return blocked
  const { token } = await params
  const { manage, guard } = getAmaBookingServices()
  const response = await createManageRescheduleHandler({ manage, guard })(
    request,
    token,
  )
  if (response.ok) kickAmaOperations()
  return response
}
