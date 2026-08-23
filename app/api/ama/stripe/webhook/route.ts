import { createStripeWebhookHandler, json } from '~/lib/ama/booking/http'
import {
  getAmaBookingServices,
  kickAmaOperations,
} from '~/lib/ama/booking/server'
import { protectAmaLaunchBoundary } from '~/lib/ama/security/launch-boundary-server'

export const maxDuration = 60

export async function POST(request: Request) {
  const blocked = protectAmaLaunchBoundary(request, ['payments'])
  if (blocked) return blocked
  const { booking, stripeWebhookSecret } = getAmaBookingServices()
  if (!stripeWebhookSecret) return json(503, { error: 'feature_disabled' })
  const response = await createStripeWebhookHandler({
    service: booking,
    signingSecret: stripeWebhookSecret,
  })(request)
  if (response.ok) kickAmaOperations()
  return response
}
