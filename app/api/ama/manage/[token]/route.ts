import { createManageStateHandler } from '~/lib/ama/booking/http'
import { getAmaBookingServices } from '~/lib/ama/booking/server'
import { publicContentOnlyNotFound } from '~/lib/public-content-only'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const unavailable = publicContentOnlyNotFound()
  if (unavailable) return unavailable
  const { token } = await params
  const { manage } = getAmaBookingServices()
  return createManageStateHandler({ manage })(request, token)
}
