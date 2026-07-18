import 'server-only'

import { ownerRequestAuthenticator } from '~/lib/admin/server'

import { availabilityRepository } from '../availability/repository'
import { createAvailabilityService } from '../availability/service'
import { createBookingAdminService } from '../booking/admin'
import { slotClaimsRepository } from '../booking/claims'
import { bookingRepository } from '../booking/repository'
import { getAmaBookingServices } from '../booking/server'
import { createGoogleCalendarClient } from '../google/client'
import { googleRepository } from '../google/repository'
import {
  createGoogleCalendarService,
  type GoogleCalendarService,
} from '../google/service'
import { durableOperationsRepository } from '../operations/repository'
import { getServerEnv } from '../server-env'
import { createSecretBox } from '../secrets'
import { getAmaSecurity } from '../security/server'

export const AMA_OWNER_TIME_ZONE = 'Asia/Taipei'
const GOOGLE_REQUEST_TIMEOUT_MS = 8_000

let services: ReturnType<typeof createServices> | undefined

function fetchWithTimeout(input: string | URL | Request, init: RequestInit = {}) {
  const timeout = AbortSignal.timeout(GOOGLE_REQUEST_TIMEOUT_MS)
  const signal = init.signal ? AbortSignal.any([init.signal, timeout]) : timeout
  return fetch(input, { ...init, signal })
}

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

function createServices() {
  const environment = getServerEnv()
  const clock = { now: () => new Date() }
  const google = environment.features.google
    ? createGoogleCalendarService({
        ownerEmail: environment.ADMIN_EMAIL,
        baseUrl: environment.SITE_URL,
        repository: googleRepository,
        provider: createGoogleCalendarClient({
          clientId: environment.GOOGLE_CLIENT_ID!,
          clientSecret: environment.GOOGLE_CLIENT_SECRET!,
          fetch: fetchWithTimeout,
          clock,
        }),
        secretBox: createSecretBox(environment.AMA_ENCRYPTION_KEY),
        clock,
      })
    : disabledGoogleService()
  const availability = createAvailabilityService({
    repository: availabilityRepository,
    calendar: google,
    ownerTimeZone: AMA_OWNER_TIME_ZONE,
    clock,
  })

  const bookingAdmin = createBookingAdminService({
    repository: bookingRepository,
    claims: slotClaimsRepository,
    operations: durableOperationsRepository,
    slotsSource: { computeSlots: () => getAmaBookingServices().booking.computeSlots() },
    clock,
  })

  return {
    google,
    availability,
    bookingAdmin,
    security: getAmaSecurity(),
    baseUrl: environment.SITE_URL,
  }
}

export function getAmaAdminServices() {
  services ??= createServices()
  return services
}

export { ownerRequestAuthenticator }
