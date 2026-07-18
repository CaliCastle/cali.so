import { createHmac } from 'node:crypto'

import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import type { AdminActionResult, BookingAdminService } from '../booking/admin'
import { createAmaSecurity, type SecurityAuditEvent } from '../security/service'
import type { OwnerRequestAuthenticator } from './http'
import {
  createAdminBookingActionHandler,
  createAdminOperationActionHandler,
  createAdminTimeRequestActionHandler,
} from './booking-http'

const PSEUDONYM_KEY = Buffer.alloc(32, 4)
const EXPECTED_ACTOR = createHmac('sha256', PSEUDONYM_KEY)
  .update('user_owner')
  .digest('hex')

function jsonRequest(
  path: string,
  body: unknown,
  options: { authenticated?: boolean; headers?: Record<string, string> } = {},
) {
  return new Request(`https://cali.so${path}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      origin: 'https://cali.so',
      'sec-fetch-site': 'same-origin',
      ...(options.authenticated === false ? {} : { cookie: 'owner=valid' }),
      ...options.headers,
    },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  })
}

function fixture(options: { rateLimitAllows?: boolean } = {}) {
  const calls: unknown[] = []
  let result: AdminActionResult = { outcome: 'done' }
  const service = {
    async cancel(bookingId: string, opts: { refund: boolean }) {
      calls.push(['cancel', bookingId, opts])
      return result
    },
    async reschedule(bookingId: string, startsAt: Date) {
      calls.push(['reschedule', bookingId, startsAt])
      return result
    },
    async grantRefundException(bookingId: string) {
      calls.push(['refund-exception', bookingId])
      return result
    },
    async retryOperation(operationId: string) {
      calls.push(['retry', operationId])
      return result
    },
    async resolveOperation(operationId: string) {
      calls.push(['resolve', operationId])
      return result
    },
    async resolveAlternateTimeRequest(
      requestId: string,
      resolution: 'resolved' | 'dismissed',
    ) {
      calls.push(['time-request', requestId, resolution])
      return result
    },
  } as unknown as BookingAdminService

  const authenticator: OwnerRequestAuthenticator = {
    async authenticate(request) {
      return request.headers.get('cookie') === 'owner=valid'
        ? {
            status: 'authorized',
            principal: { id: 'owner@example.com', actorId: 'user_owner' },
          }
        : { status: 'unauthenticated' }
    },
  }

  const securityEvents: SecurityAuditEvent[] = []
  const security = createAmaSecurity({
    baseUrl: new URL('https://cali.so'),
    features: {
      publicMutations: true,
      payments: true,
      bookingFinalization: true,
      google: true,
      tencent: true,
    },
    pseudonymKey: PSEUDONYM_KEY,
    rateLimiter: {
      async limit() {
        return { success: options.rateLimitAllows ?? true }
      },
    },
    audit: {
      write(event) {
        securityEvents.push(event)
      },
    },
    requestId: () => 'admin-request-id',
  })

  const dependencies = {
    authenticator,
    service,
    security,
    baseUrl: new URL('https://cali.so'),
  }

  return {
    dependencies,
    calls,
    securityEvents,
    setResult(next: AdminActionResult) {
      result = next
    },
  }
}

describe('admin booking action handler', () => {
  it('rejects unauthenticated actions and records the denial', async () => {
    const f = fixture()
    const handler = createAdminBookingActionHandler(f.dependencies)

    const response = await handler(
      jsonRequest('/api/admin/ama/bookings/bk_1', { action: 'cancel' }, {
        authenticated: false,
      }),
      'bk_1',
    )

    expect(response.status).toBe(401)
    expect(f.calls).toEqual([])
    expect(f.securityEvents.at(-1)?.event).toBe('admin_authentication.denied')
  })

  it('forbids signed-in users without owner access', async () => {
    const f = fixture()
    const handler = createAdminBookingActionHandler({
      ...f.dependencies,
      authenticator: {
        async authenticate() {
          return { status: 'forbidden' }
        },
      },
    })

    const response = await handler(
      jsonRequest('/api/admin/ama/bookings/bk_1', { action: 'cancel' }),
      'bk_1',
    )

    expect(response.status).toBe(403)
    expect(f.calls).toEqual([])
  })

  it('rejects cross-site mutations before authentication or service work', async () => {
    const f = fixture()
    const handler = createAdminBookingActionHandler({
      ...f.dependencies,
      authenticator: {
        async authenticate() {
          throw new Error('authentication must not run')
        },
      },
    })

    const response = await handler(
      jsonRequest('/api/admin/ama/bookings/bk_1', { action: 'cancel' }, {
        headers: {
          origin: 'https://attacker.example',
          'sec-fetch-site': 'cross-site',
        },
      }),
      'bk_1',
    )

    expect(response.status).toBe(403)
    expect(f.calls).toEqual([])
    expect(f.securityEvents[0]?.event).toBe('browser_mutation.denied')
  })

  it('rate limits authenticated actions before service work', async () => {
    const f = fixture({ rateLimitAllows: false })
    const handler = createAdminBookingActionHandler(f.dependencies)

    const response = await handler(
      jsonRequest('/api/admin/ama/bookings/bk_1', { action: 'cancel' }),
      'bk_1',
    )

    expect(response.status).toBe(429)
    expect(f.calls).toEqual([])
    expect(f.securityEvents[0]?.event).toBe('admin_mutation.rate_limited')
  })

  it('rejects garbage bodies with 400 even for an authenticated owner', async () => {
    const f = fixture()
    const handler = createAdminBookingActionHandler(f.dependencies)

    const response = await handler(
      jsonRequest('/api/admin/ama/bookings/bk_1', 'not json {'),
      'bk_1',
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ error: 'invalid_request' })
    expect(f.calls).toEqual([])
  })

  it('rejects unknown actions with the failing field', async () => {
    const f = fixture()
    const handler = createAdminBookingActionHandler(f.dependencies)

    const response = await handler(
      jsonRequest('/api/admin/ama/bookings/bk_1', { action: 'explode' }),
      'bk_1',
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: 'invalid_request',
      field: 'action',
    })
    expect(f.calls).toEqual([])
  })

  it('cancels a Booking and audits with a pseudonymous actor', async () => {
    const f = fixture()
    const handler = createAdminBookingActionHandler(f.dependencies)

    const response = await handler(
      jsonRequest('/api/admin/ama/bookings/bk_1', { action: 'cancel', refund: true }),
      'bk_1',
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ result: 'done' })
    expect(f.calls).toEqual([['cancel', 'bk_1', { refund: true }]])
    const audit = f.securityEvents.at(-1)
    expect(audit?.event).toBe('ama_booking.cancelled')
    expect(audit?.actorId).toBe(EXPECTED_ACTOR)
    expect(audit?.actorId).not.toBe('user_owner')
  })

  it('reschedules with a parsed start time', async () => {
    const f = fixture()
    const handler = createAdminBookingActionHandler(f.dependencies)

    const response = await handler(
      jsonRequest('/api/admin/ama/bookings/bk_1', {
        action: 'reschedule',
        startsAt: '2026-07-10T09:00:00.000Z',
      }),
      'bk_1',
    )

    expect(response.status).toBe(200)
    expect(f.calls).toEqual([
      ['reschedule', 'bk_1', new Date('2026-07-10T09:00:00.000Z')],
    ])
    expect(f.securityEvents.at(-1)?.event).toBe('ama_booking.rescheduled')
  })

  it('rejects a reschedule without a parseable start time', async () => {
    const f = fixture()
    const handler = createAdminBookingActionHandler(f.dependencies)

    const response = await handler(
      jsonRequest('/api/admin/ama/bookings/bk_1', {
        action: 'reschedule',
        startsAt: 'someday',
      }),
      'bk_1',
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: 'invalid_request',
      field: 'startsAt',
    })
    expect(f.calls).toEqual([])
  })

  it('grants a refund exception and audits it', async () => {
    const f = fixture()
    const handler = createAdminBookingActionHandler(f.dependencies)

    const response = await handler(
      jsonRequest('/api/admin/ama/bookings/bk_1', { action: 'refund-exception' }),
      'bk_1',
    )

    expect(response.status).toBe(200)
    expect(f.calls).toEqual([['refund-exception', 'bk_1']])
    expect(f.securityEvents.at(-1)?.event).toBe(
      'ama_booking.refund_exception_granted',
    )
  })

  it.each([
    [{ outcome: 'not_found' }, 404, { error: 'not_found' }],
    [{ outcome: 'already_cancelled' }, 409, { error: 'already_cancelled' }],
    [{ outcome: 'slot_taken' }, 409, { error: 'slot_taken' }],
    [{ outcome: 'unavailable' }, 503, { error: 'dependency_unavailable' }],
  ] as const)('maps the %o outcome without auditing', async (result, status, body) => {
    const f = fixture()
    f.setResult(result as AdminActionResult)
    const handler = createAdminBookingActionHandler(f.dependencies)

    const response = await handler(
      jsonRequest('/api/admin/ama/bookings/bk_1', { action: 'cancel' }),
      'bk_1',
    )

    expect(response.status).toBe(status)
    await expect(response.json()).resolves.toEqual(body)
    expect(
      f.securityEvents.some((event) => event.event === 'ama_booking.cancelled'),
    ).toBe(false)
  })
})

describe('admin operation action handler', () => {
  it('retries a failed operation and audits it', async () => {
    const f = fixture()
    const handler = createAdminOperationActionHandler(f.dependencies)

    const response = await handler(
      jsonRequest('/api/admin/ama/operations/op_1', { action: 'retry' }),
      'op_1',
    )

    expect(response.status).toBe(200)
    expect(f.calls).toEqual([['retry', 'op_1']])
    expect(f.securityEvents.at(-1)?.event).toBe('ama_operation.retried')
    expect(f.securityEvents.at(-1)?.actorId).toBe(EXPECTED_ACTOR)
  })

  it('resolves an operation completed outside the system and audits it', async () => {
    const f = fixture()
    const handler = createAdminOperationActionHandler(f.dependencies)

    const response = await handler(
      jsonRequest('/api/admin/ama/operations/op_1', { action: 'resolve' }),
      'op_1',
    )

    expect(response.status).toBe(200)
    expect(f.calls).toEqual([['resolve', 'op_1']])
    expect(f.securityEvents.at(-1)?.event).toBe('ama_operation.resolved')
  })

  it('rejects unknown operation actions', async () => {
    const f = fixture()
    const handler = createAdminOperationActionHandler(f.dependencies)

    const response = await handler(
      jsonRequest('/api/admin/ama/operations/op_1', { action: 'cancel' }),
      'op_1',
    )

    expect(response.status).toBe(400)
    expect(f.calls).toEqual([])
  })

  it('maps not_applicable operation outcomes to 409', async () => {
    const f = fixture()
    f.setResult({ outcome: 'not_applicable' })
    const handler = createAdminOperationActionHandler(f.dependencies)

    const response = await handler(
      jsonRequest('/api/admin/ama/operations/op_1', { action: 'retry' }),
      'op_1',
    )

    expect(response.status).toBe(409)
    await expect(response.json()).resolves.toEqual({ error: 'not_applicable' })
  })
})

describe('admin time request action handler', () => {
  it.each([
    ['resolve', 'resolved'],
    ['dismiss', 'dismissed'],
  ] as const)('%ss the request and audits the resolution', async (action, resolution) => {
    const f = fixture()
    const handler = createAdminTimeRequestActionHandler(f.dependencies)

    const response = await handler(
      jsonRequest('/api/admin/ama/time-requests/req_1', { action }),
      'req_1',
    )

    expect(response.status).toBe(200)
    expect(f.calls).toEqual([['time-request', 'req_1', resolution]])
    expect(f.securityEvents.at(-1)?.event).toBe('ama_time_request.resolved')
  })

  it('rejects unknown time request actions', async () => {
    const f = fixture()
    const handler = createAdminTimeRequestActionHandler(f.dependencies)

    const response = await handler(
      jsonRequest('/api/admin/ama/time-requests/req_1', { action: 'nudge' }),
      'req_1',
    )

    expect(response.status).toBe(400)
    expect(f.calls).toEqual([])
  })

  it('maps an already-handled request to 409 not_applicable', async () => {
    const f = fixture()
    f.setResult({ outcome: 'not_applicable' })
    const handler = createAdminTimeRequestActionHandler(f.dependencies)

    const response = await handler(
      jsonRequest('/api/admin/ama/time-requests/req_1', { action: 'resolve' }),
      'req_1',
    )

    expect(response.status).toBe(409)
    await expect(response.json()).resolves.toEqual({ error: 'not_applicable' })
  })
})
