import { createHmac } from 'node:crypto'

import {
  browserMutationDeniedResponse,
  checkBrowserMutationRequest,
  featureUnavailableResponse,
  securityDenialHeaders,
} from '../security/request-policy'
import type { SecurityRateLimiter } from '../security/service'
import { verifyStripeWebhook } from '../stripe/webhook'
import type { ManageService } from './manage'
import type { BookingService, WebhookOutcome } from './service'

const MAX_JSON_BODY_BYTES = 32 * 1024

export function json(status: number, body: unknown) {
  const headers = securityDenialHeaders()
  headers.set('content-type', 'application/json; charset=utf-8')
  headers.set('x-content-type-options', 'nosniff')
  return new Response(JSON.stringify(body), { status, headers })
}

async function requestJson(request: Request): Promise<Record<string, unknown> | null> {
  const contentType = request.headers.get('content-type') ?? ''
  if (!contentType.toLowerCase().startsWith('application/json')) return null
  let text: string
  try {
    text = await request.text()
  } catch {
    return null
  }
  if (text.length > MAX_JSON_BODY_BYTES) return null
  try {
    const parsed: unknown = JSON.parse(text)
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return null
    }
    return parsed as Record<string, unknown>
  } catch {
    return null
  }
}

function stringField(body: Record<string, unknown>, key: string): string {
  const value = body[key]
  return typeof value === 'string' ? value : ''
}

function stringArrayField(body: Record<string, unknown>, key: string): string[] {
  const value = body[key]
  if (!Array.isArray(value)) return []
  return value.filter((entry): entry is string => typeof entry === 'string')
}

function dateField(body: Record<string, unknown>, key: string): Date | null {
  const value = body[key]
  if (typeof value !== 'string') return null
  const parsed = new Date(value)
  return Number.isFinite(parsed.getTime()) ? parsed : null
}

type PublicGuardDependencies = {
  baseUrl: URL
  rateLimiter: SecurityRateLimiter
  pseudonymKey: Buffer
  retryAfterSeconds?: number
}

/**
 * The public mutation guard: same-origin browser policy plus a pseudonymous
 * per-client rate limit. Raw client addresses never leave this function.
 */
export function createPublicRequestGuard({
  baseUrl,
  rateLimiter,
  pseudonymKey,
  retryAfterSeconds = 60,
}: PublicGuardDependencies) {
  return {
    async check(request: Request): Promise<Response | null> {
      if (checkBrowserMutationRequest(request, baseUrl)) {
        return browserMutationDeniedResponse()
      }
      const client =
        request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        request.headers.get('x-real-ip') ||
        'unknown'
      const key = createHmac('sha256', pseudonymKey).update(client).digest('hex')
      try {
        const { success } = await rateLimiter.limit(key)
        if (success) return null
        const headers = securityDenialHeaders()
        headers.set('retry-after', String(retryAfterSeconds))
        return new Response(null, { status: 429, headers })
      } catch {
        return featureUnavailableResponse(retryAfterSeconds)
      }
    },
  }
}

export type PublicRequestGuard = ReturnType<typeof createPublicRequestGuard>

type SlotsHandlerDependencies = {
  service: Pick<BookingService, 'computeSlots'>
}

export function createPublicSlotsHandler({ service }: SlotsHandlerDependencies) {
  return async function GET() {
    try {
      const result = await service.computeSlots()
      if (result.status !== 'available') {
        return json(200, { status: 'unavailable', slots: [] })
      }
      return json(200, {
        status: 'available',
        slots: result.slots.map((slot) => ({
          startsAt: slot.startsAt.toISOString(),
          endsAt: slot.endsAt.toISOString(),
        })),
      })
    } catch {
      return json(503, { error: 'dependency_unavailable' })
    }
  }
}

type HoldCreateDependencies = {
  service: Pick<BookingService, 'createHold'>
  guard: PublicRequestGuard
}

export function createHoldCreateHandler({ service, guard }: HoldCreateDependencies) {
  return async function POST(request: Request) {
    const blocked = await guard.check(request)
    if (blocked) return blocked
    const body = await requestJson(request)
    if (!body) return json(400, { error: 'invalid_request' })
    const startsAt = dateField(body, 'startsAt')
    if (!startsAt) return json(400, { error: 'invalid_request', field: 'startsAt' })

    try {
      const result = await service.createHold({
        startsAt,
        guestName: stringField(body, 'name'),
        guestEmail: stringField(body, 'email'),
        locale: stringField(body, 'locale') as 'zh' | 'en',
        guestTimeZone: stringField(body, 'timeZone'),
        topics: stringArrayField(body, 'topics'),
        briefText: stringField(body, 'brief'),
        briefUrls: stringArrayField(body, 'urls'),
        meetingProvider: stringField(body, 'provider') as
          | 'google-meet'
          | 'tencent-meeting',
      })
      switch (result.outcome) {
        case 'created':
          return json(201, {
            hold: {
              id: result.holdId,
              expiresAt: result.expiresAt.toISOString(),
              startsAt: result.startsAt.toISOString(),
              endsAt: result.endsAt.toISOString(),
            },
          })
        case 'invalid':
          return json(400, { error: 'invalid_request', field: result.field })
        case 'stale_slot':
          return json(409, { error: 'stale_slot' })
        case 'slot_taken':
          return json(409, { error: 'slot_taken' })
        case 'unavailable':
          return json(503, { error: 'provider_unavailable' })
      }
    } catch {
      return json(503, { error: 'dependency_unavailable' })
    }
  }
}

type HoldStateDependencies = {
  service: Pick<BookingService, 'getHoldState'>
}

export function createHoldStateHandler({ service }: HoldStateDependencies) {
  return async function GET(_request: Request, holdId: string) {
    if (!/^[0-9a-f-]{36}$/.test(holdId)) return json(404, { error: 'not_found' })
    try {
      const state = await service.getHoldState(holdId)
      if (state.state === 'unknown') return json(404, { error: 'not_found' })
      if (state.state === 'active') {
        return json(200, {
          hold: {
            state: 'active',
            startsAt: state.startsAt.toISOString(),
            endsAt: state.endsAt.toISOString(),
            expiresAt: state.expiresAt.toISOString(),
            checkoutStarted: state.checkoutStarted,
          },
        })
      }
      if (state.state === 'paid') {
        return json(200, {
          hold: {
            state: 'paid',
            bookingStatus: state.bookingStatus,
            startsAt: state.startsAt.toISOString(),
            endsAt: state.endsAt.toISOString(),
            meetingProvider: state.meetingProvider,
            guestTimeZone: state.guestTimeZone,
            meetingUrl: state.meetingUrl,
          },
        })
      }
      return json(200, { hold: { state: state.state } })
    } catch {
      return json(503, { error: 'dependency_unavailable' })
    }
  }
}

type CheckoutDependencies = {
  service: Pick<BookingService, 'createCheckout'>
  guard: PublicRequestGuard
}

export function createCheckoutHandler({ service, guard }: CheckoutDependencies) {
  return async function POST(request: Request, holdId: string) {
    const blocked = await guard.check(request)
    if (blocked) return blocked
    if (!/^[0-9a-f-]{36}$/.test(holdId)) return json(404, { error: 'not_found' })
    try {
      const result = await service.createCheckout(holdId)
      switch (result.outcome) {
        case 'redirect':
          return json(200, { checkout: { url: result.url } })
        case 'hold_expired':
          return json(409, { error: 'hold_expired' })
        case 'already_paid':
          return json(409, { error: 'already_paid' })
        case 'unknown':
          return json(404, { error: 'not_found' })
        case 'unavailable':
          return json(503, { error: 'provider_unavailable' })
      }
    } catch {
      return json(503, { error: 'dependency_unavailable' })
    }
  }
}

type WebhookDependencies = {
  service: Pick<BookingService, 'processWebhookEvent'>
  signingSecret: string
  clock?: { now(): Date }
  /**
   * Observes the processed outcome so callers can react to the ones that
   * enqueued durable work without re-parsing the response body.
   */
  onOutcome?: (outcome: WebhookOutcome) => void
}

export function createStripeWebhookHandler({
  service,
  signingSecret,
  clock = { now: () => new Date() },
  onOutcome,
}: WebhookDependencies) {
  return async function POST(request: Request) {
    let payload: string
    try {
      payload = await request.text()
    } catch {
      return json(400, { error: 'invalid_request' })
    }
    const event = verifyStripeWebhook({
      payload,
      signatureHeader: request.headers.get('stripe-signature'),
      signingSecret,
      now: clock.now(),
    })
    if (!event) return json(400, { error: 'invalid_signature' })
    try {
      const outcome = await service.processWebhookEvent(event)
      onOutcome?.(outcome)
      return json(200, { received: true, outcome })
    } catch {
      // Signal Stripe to redeliver; the persisted provider event makes the
      // retry safe.
      return json(503, { error: 'dependency_unavailable' })
    }
  }
}

type AlternateTimeRequestDependencies = {
  service: Pick<BookingService, 'createAlternateTimeRequest'>
  guard: PublicRequestGuard
}

export function createAlternateTimeRequestHandler({
  service,
  guard,
}: AlternateTimeRequestDependencies) {
  return async function POST(request: Request) {
    const blocked = await guard.check(request)
    if (blocked) return blocked
    const body = await requestJson(request)
    if (!body) return json(400, { error: 'invalid_request' })
    try {
      const result = await service.createAlternateTimeRequest({
        guestName: stringField(body, 'name'),
        guestEmail: stringField(body, 'email'),
        locale: stringField(body, 'locale') as 'zh' | 'en',
        guestTimeZone: stringField(body, 'timeZone'),
        preferredWindows: stringField(body, 'preferredWindows'),
        note: stringField(body, 'note') || null,
      })
      if (result.outcome === 'invalid') {
        return json(400, { error: 'invalid_request', field: result.field })
      }
      return json(201, { request: { received: true } })
    } catch {
      return json(503, { error: 'dependency_unavailable' })
    }
  }
}

function manageViewBody(view: NonNullable<Awaited<ReturnType<ManageService['getView']>>>) {
  return {
    booking: {
      status: view.status,
      guestName: view.guestName,
      locale: view.locale,
      guestTimeZone: view.guestTimeZone,
      startsAt: view.startsAt.toISOString(),
      endsAt: view.endsAt.toISOString(),
      meetingProvider: view.meetingProvider,
      meetingUrl: view.meetingUrl,
      refundStatus: view.refundStatus,
      canReschedule: view.canReschedule,
      canCancel: view.canCancel,
      refundOnCancel: view.refundOnCancel,
    },
  }
}

type ManageHandlerDependencies = {
  manage: ManageService
  guard: PublicRequestGuard
}

export function createManageStateHandler({ manage }: Pick<ManageHandlerDependencies, 'manage'>) {
  return async function GET(_request: Request, token: string) {
    try {
      const view = await manage.getView(token)
      if (!view) return json(404, { error: 'not_found' })
      return json(200, manageViewBody(view))
    } catch {
      return json(503, { error: 'dependency_unavailable' })
    }
  }
}

export function createManageRescheduleHandler({ manage, guard }: ManageHandlerDependencies) {
  return async function POST(request: Request, token: string) {
    const blocked = await guard.check(request)
    if (blocked) return blocked
    const body = await requestJson(request)
    if (!body) return json(400, { error: 'invalid_request' })
    const startsAt = dateField(body, 'startsAt')
    if (!startsAt) return json(400, { error: 'invalid_request', field: 'startsAt' })
    try {
      const result = await manage.reschedule(token, startsAt)
      switch (result.outcome) {
        case 'done':
          return json(200, manageViewBody(result.view))
        case 'not_found':
          return json(404, { error: 'not_found' })
        case 'window_closed':
          return json(409, { error: 'window_closed' })
        case 'stale_slot':
          return json(409, { error: 'stale_slot' })
        case 'slot_taken':
          return json(409, { error: 'slot_taken' })
        case 'already_cancelled':
          return json(409, { error: 'already_cancelled' })
        case 'unavailable':
          return json(503, { error: 'provider_unavailable' })
      }
    } catch {
      return json(503, { error: 'dependency_unavailable' })
    }
  }
}

export function createManageCancelHandler({ manage, guard }: ManageHandlerDependencies) {
  return async function POST(request: Request, token: string) {
    const blocked = await guard.check(request)
    if (blocked) return blocked
    try {
      const result = await manage.cancel(token)
      switch (result.outcome) {
        case 'done':
          return json(200, manageViewBody(result.view))
        case 'not_found':
          return json(404, { error: 'not_found' })
        case 'already_cancelled':
          return json(409, { error: 'already_cancelled' })
        default:
          return json(503, { error: 'dependency_unavailable' })
      }
    } catch {
      return json(503, { error: 'dependency_unavailable' })
    }
  }
}
