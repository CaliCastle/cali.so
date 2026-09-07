import 'server-only'

import { waitUntil } from '@vercel/functions'

import { createRateLimiter } from '~/lib/rate-limit/server'

import { availabilityRepository } from '../availability/repository'
import { createAvailabilityService } from '../availability/service'
import { EmailDeliveryError, type EmailSender } from '../email/types'
import { createResendEmailSender } from '../email/resend'
import { createGoogleBookingCalendar } from '../google/booking-calendar'
import { createGoogleCalendarClient } from '../google/client'
import { googleRepository } from '../google/repository'
import {
  createGoogleCalendarService,
  type GoogleCalendarService,
} from '../google/service'
import type { BookingCalendar } from '../meeting/calendar'
import { createTencentMeetingAdapter } from '../meeting/tencent'
import type { MeetingProviderAdapter } from '../meeting/types'
import { createOperationHandlers } from '../operations/handlers'
import {
  fetchWithOperationsTimeout,
  withOperationsDeadline,
} from '../operations/deadline'
import { durableOperationsRepository } from '../operations/repository'
import { createOperationsRunner } from '../operations/runner'
import { createSecretBox } from '../secrets'
import { getServerEnv } from '../server-env'
import { createStripeClient, StripeError, type StripeClient } from '../stripe/client'
import { slotClaimsRepository } from './claims'
import { createPublicRequestGuard } from './http'
import { createManageService } from './manage'
import { createBookingAdminService } from './admin'
import { bookingRepository } from './repository'
import { createBookingService } from './service'

const OPERATIONS_BATCH_SIZE = 10
// Cancel provider IO at 240s, leaving time within the 300s routes for the
// triggering mutation and lease bookkeeping. The runner's per-pass budget
// is advisory and cannot bound a handler with sequential provider calls.
const INLINE_DRAIN_BUDGET_MS = 240_000

let services: ReturnType<typeof createServices> | undefined

function disabledGoogleService(): GoogleCalendarService {
  return {
    async begin() {
      throw new Error('Google Calendar is disabled')
    },
    async complete() {
      return 'unavailable'
    },
    async getConnection() {
      return null
    },
    async queryFreeBusy() {
      return { status: 'disconnected', busy: [] }
    },
    async disconnect() {
      throw new Error('Google Calendar is disabled')
    },
  }
}

function disabledCalendar(): BookingCalendar {
  return {
    async createEvent() {
      return { status: 'disconnected' }
    },
    async moveEvent() {
      return { status: 'disconnected' }
    },
    async deleteEvent() {
      return { status: 'disconnected' }
    },
  }
}

function disabledEmailSender(): EmailSender {
  return {
    async send() {
      throw new EmailDeliveryError(
        'provider_unavailable',
        'Transactional email is not configured.',
      )
    },
  }
}

function disabledStripeClient(): StripeClient {
  const unavailable = () => {
    throw new StripeError('provider_unavailable', 'Payments are not configured.')
  }
  return {
    createCheckoutSession: async () => unavailable(),
    getCheckoutSession: async () => unavailable(),
    createRefund: async () => unavailable(),
  }
}

function createServices() {
  const environment = getServerEnv()
  const clock = { now: () => new Date() }
  const secretBox = createSecretBox(environment.AMA_ENCRYPTION_KEY)

  const googleProvider = environment.features.google
    ? createGoogleCalendarClient({
        clientId: environment.GOOGLE_CLIENT_ID!,
        clientSecret: environment.GOOGLE_CLIENT_SECRET!,
        fetch: fetchWithOperationsTimeout,
        clock,
      })
    : null
  const google = googleProvider
    ? createGoogleCalendarService({
        ownerEmail: environment.ADMIN_EMAIL,
        baseUrl: environment.SITE_URL,
        repository: googleRepository,
        provider: googleProvider,
        secretBox,
        clock,
      })
    : disabledGoogleService()
  const availability = createAvailabilityService({
    repository: availabilityRepository,
    calendar: google,
    clock,
  })
  const calendar: BookingCalendar = googleProvider
    ? createGoogleBookingCalendar({
        repository: googleRepository,
        provider: googleProvider,
        secretBox,
        clock,
      })
    : disabledCalendar()

  const stripe =
    environment.features.payments && environment.STRIPE_SECRET_KEY
      ? createStripeClient({
          secretKey: environment.STRIPE_SECRET_KEY,
          fetch: fetchWithOperationsTimeout,
        })
      : disabledStripeClient()

  const email =
    environment.features.bookingFinalization &&
    environment.RESEND_API_KEY &&
    environment.AMA_EMAIL_FROM
      ? createResendEmailSender({
          apiKey: environment.RESEND_API_KEY,
          from: environment.AMA_EMAIL_FROM,
          fetch: fetchWithOperationsTimeout,
        })
      : disabledEmailSender()

  const tencent: MeetingProviderAdapter | null =
    environment.features.tencent &&
    environment.TENCENT_MEETING_MCP_URL &&
    environment.TENCENT_MEETING_MCP_TOKEN
      ? createTencentMeetingAdapter({
          url: environment.TENCENT_MEETING_MCP_URL,
          token: environment.TENCENT_MEETING_MCP_TOKEN,
          fetch: fetchWithOperationsTimeout,
        })
      : null

  const booking = createBookingService({
    claims: slotClaimsRepository,
    repository: bookingRepository,
    operations: durableOperationsRepository,
    availability,
    stripe,
    baseUrl: environment.SITE_URL,
    clock,
  })
  const manage = createManageService({
    repository: bookingRepository,
    claims: slotClaimsRepository,
    operations: durableOperationsRepository,
    booking,
    clock,
  })
  const admin = createBookingAdminService({
    repository: bookingRepository,
    claims: slotClaimsRepository,
    operations: durableOperationsRepository,
    slotsSource: booking,
    clock,
  })
  const runner = createOperationsRunner({
    batchSize: OPERATIONS_BATCH_SIZE,
    operations: durableOperationsRepository,
    handler: createOperationHandlers({
      repository: bookingRepository,
      claims: slotClaimsRepository,
      operations: durableOperationsRepository,
      calendar,
      tencent,
      email,
      stripe: environment.features.payments ? stripe : null,
      encryptionKey: environment.AMA_ENCRYPTION_KEY,
      baseUrl: environment.SITE_URL,
      clock,
    }),
    clock,
  })
  const guard = createPublicRequestGuard({
    baseUrl: environment.browserMutationBaseUrl,
    rateLimiter: createRateLimiter(environment.rateLimitBackend, {
      prefix: 'cali:ama:public-mutation',
      maxRequests: environment.AMA_PUBLIC_RATE_LIMIT_MAX_REQUESTS,
      windowSeconds: environment.AMA_PUBLIC_RATE_LIMIT_WINDOW_SECONDS,
    }),
    pseudonymKey: Buffer.from(environment.RATE_LIMIT_HASH_KEY, 'base64'),
  })

  return {
    booking,
    manage,
    admin,
    runner,
    guard,
    claims: slotClaimsRepository,
    stripeWebhookSecret: environment.STRIPE_WEBHOOK_SECRET ?? null,
    baseUrl: environment.SITE_URL,
  }
}

export function getAmaBookingServices() {
  services ??= createServices()
  return services
}

/**
 * Starts a background drain of due durable operations inside the current
 * invocation, so work enqueued by a mutation (booking emails, Finalizing
 * Booking recovery, refunds) begins immediately instead of waiting for the
 * next scheduled sweep. The scheduled endpoint remains the sole driver for
 * reminders, retry backoff, and expired Slot Hold release.
 */
export function kickAmaOperations() {
  const { runner } = getAmaBookingServices()
  waitUntil(
    withOperationsDeadline(INLINE_DRAIN_BUDGET_MS, async (signal) => {
      // A full batch means older due work may have crowded out the operation
      // this mutation enqueued, so keep draining until a partial batch shows
      // the due queue is empty or the inline budget is spent. Anything left
      // over stays with the scheduled sweep.
      let result = await runner.run({ signal })
      while (
        result.claimed >= OPERATIONS_BATCH_SIZE &&
        !signal.aborted
      ) {
        result = await runner.run({ signal })
      }
    }).catch((error) => {
      console.error('ama: inline operations drain failed', error)
    }),
  )
}
