import type { OwnerAccess } from '~/lib/admin/authorization'

import { securityDenialHeaders } from '../security/request-policy'
import type { AmaSecurity, PrivilegedAuditEvent } from '../security/service'
import type { AdminActionResult, BookingAdminService } from '../booking/admin'
import type { OwnerRequestAuthenticator } from './http'

const MAX_JSON_BODY_BYTES = 32 * 1024

type AdminBookingHandlerDependencies = {
  authenticator: OwnerRequestAuthenticator
  service: BookingAdminService
  security: AmaSecurity
  baseUrl: URL
}

function json(status: number, body: unknown) {
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

async function authorize(
  dependencies: AdminBookingHandlerDependencies,
  request: Request,
): Promise<{ response: Response } | { actorId: string }> {
  const { authenticator, security } = dependencies
  const blocked = await security.protectOwnerAdminMutation(request)
  if (blocked) return { response: blocked }

  let access: OwnerAccess
  try {
    access = await authenticator.authenticate(request)
  } catch {
    return {
      response: new Response(null, { status: 503, headers: securityDenialHeaders() }),
    }
  }
  if (access.status !== 'authorized') {
    security.recordAuthenticationDenial(request)
    return {
      response: new Response(null, {
        status: access.status === 'forbidden' ? 403 : 401,
        headers: securityDenialHeaders(),
      }),
    }
  }
  const limited = await security.limitAdminMutation(request, access.principal.actorId)
  if (limited) return { response: limited }
  return { actorId: access.principal.actorId }
}

function actionResponse(result: AdminActionResult) {
  switch (result.outcome) {
    case 'done':
      return json(200, { result: 'done' })
    case 'not_found':
      return json(404, { error: 'not_found' })
    case 'already_cancelled':
      return json(409, { error: 'already_cancelled' })
    case 'stale_slot':
      return json(409, { error: 'stale_slot' })
    case 'slot_taken':
      return json(409, { error: 'slot_taken' })
    case 'not_applicable':
      return json(409, { error: 'not_applicable' })
    case 'unavailable':
      return json(503, { error: 'dependency_unavailable' })
  }
}

export function createAdminBookingActionHandler(
  dependencies: AdminBookingHandlerDependencies,
) {
  const { service, security } = dependencies
  return async function POST(request: Request, bookingId: string) {
    const body = await requestJson(request)
    const action = typeof body?.action === 'string' ? body.action : null
    if (!body || !action) return json(400, { error: 'invalid_request' })

    const authorized = await authorize(dependencies, request)
    if ('response' in authorized) return authorized.response

    try {
      let result: AdminActionResult
      let audit: PrivilegedAuditEvent
      if (action === 'cancel') {
        result = await service.cancel(bookingId, { refund: body.refund === true })
        audit = 'ama_booking.cancelled'
      } else if (action === 'reschedule') {
        const startsAt =
          typeof body.startsAt === 'string' ? new Date(body.startsAt) : null
        if (!startsAt || !Number.isFinite(startsAt.getTime())) {
          return json(400, { error: 'invalid_request', field: 'startsAt' })
        }
        result = await service.reschedule(bookingId, startsAt)
        audit = 'ama_booking.rescheduled'
      } else if (action === 'refund-exception') {
        result = await service.grantRefundException(bookingId)
        audit = 'ama_booking.refund_exception_granted'
      } else {
        return json(400, { error: 'invalid_request', field: 'action' })
      }
      if (result.outcome === 'done') {
        security.recordPrivilegedAction(request, audit, authorized.actorId)
      }
      return actionResponse(result)
    } catch {
      return json(503, { error: 'dependency_unavailable' })
    }
  }
}

export function createAdminOperationActionHandler(
  dependencies: AdminBookingHandlerDependencies,
) {
  const { service, security } = dependencies
  return async function POST(request: Request, operationId: string) {
    const body = await requestJson(request)
    const action = typeof body?.action === 'string' ? body.action : null
    if (!body || (action !== 'retry' && action !== 'resolve')) {
      return json(400, { error: 'invalid_request' })
    }
    const authorized = await authorize(dependencies, request)
    if ('response' in authorized) return authorized.response
    try {
      const result =
        action === 'retry'
          ? await service.retryOperation(operationId)
          : await service.resolveOperation(operationId)
      if (result.outcome === 'done') {
        security.recordPrivilegedAction(
          request,
          action === 'retry' ? 'ama_operation.retried' : 'ama_operation.resolved',
          authorized.actorId,
        )
      }
      return actionResponse(result)
    } catch {
      return json(503, { error: 'dependency_unavailable' })
    }
  }
}

export function createAdminTimeRequestActionHandler(
  dependencies: AdminBookingHandlerDependencies,
) {
  const { service, security } = dependencies
  return async function POST(request: Request, requestId: string) {
    const body = await requestJson(request)
    const action = typeof body?.action === 'string' ? body.action : null
    if (!body || (action !== 'resolve' && action !== 'dismiss')) {
      return json(400, { error: 'invalid_request' })
    }
    const authorized = await authorize(dependencies, request)
    if ('response' in authorized) return authorized.response
    try {
      const result = await service.resolveAlternateTimeRequest(
        requestId,
        action === 'resolve' ? 'resolved' : 'dismissed',
      )
      if (result.outcome === 'done') {
        security.recordPrivilegedAction(
          request,
          'ama_time_request.resolved',
          authorized.actorId,
        )
      }
      return actionResponse(result)
    } catch {
      return json(503, { error: 'dependency_unavailable' })
    }
  }
}
