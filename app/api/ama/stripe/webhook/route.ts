import { createStripeWebhookHandler, json } from '~/lib/ama/booking/http'
import {
  getAmaBookingServices,
  kickAmaOperations,
} from '~/lib/ama/booking/server'
import { protectAmaLaunchBoundary } from '~/lib/ama/security/launch-boundary-server'

export const maxDuration = 300

export async function POST(request: Request) {
  const blocked = protectAmaLaunchBoundary(request, ['payments'])
  if (blocked) return blocked
  const { booking, stripeWebhookSecret } = getAmaBookingServices()
  if (!stripeWebhookSecret) return json(503, { error: 'feature_disabled' })
  return createStripeWebhookHandler({
    service: booking,
    signingSecret: stripeWebhookSecret,
    // Only booking creation enqueues durable work; duplicate, ignored,
    // orphaned, and hold-release deliveries return 200 without any.
    onOutcome: (outcome) => {
      if (outcome === 'booking_created') kickAmaOperations()
    },
  })(request)
}
