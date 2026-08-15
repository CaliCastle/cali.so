import { drizzle } from 'drizzle-orm/pglite'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import { usePGliteTestClient } from '~/db/testing/pglite'

import { createSlotClaimsRepository, type ClaimsDatabase } from '../booking/claims'
import { createBookingRepository, type BookingDatabase } from '../booking/repository'
import {
  createDurableOperationsRepository,
  type DurableOperationKind,
  type OperationsDatabase,
} from './repository'

const MINUTE = 60 * 1000
const HOUR = 60 * MINUTE
const now = new Date('2026-08-01T00:00:00.000Z')

function enqueueInput(
  dedupeKey: string,
  overrides: Partial<{
    kind: DurableOperationKind
    bookingId: string | null
    nextAttemptAt: Date
    maxAttempts: number
    now: Date
  }> = {},
) {
  return {
    kind: 'send_booking_email' as DurableOperationKind,
    dedupeKey,
    nextAttemptAt: now,
    now,
    ...overrides,
  }
}

describe('Durable Operations repository', () => {
  const getClient = usePGliteTestClient([
    '0001_ama_owner_auth.sql',
    '0002_ama_availability.sql',
    '0003_ama_google_calendar.sql',
    '0004_ama_google_oauth.sql',
    '0011_ama_booking_system.sql',
  ])
  let repository: ReturnType<typeof createDurableOperationsRepository>
  let claims: ReturnType<typeof createSlotClaimsRepository>
  let bookings: ReturnType<typeof createBookingRepository>

  beforeEach(() => {
    const database = drizzle(getClient())
    repository = createDurableOperationsRepository(
      () => database as unknown as OperationsDatabase,
    )
    claims = createSlotClaimsRepository(() => database as unknown as ClaimsDatabase)
    bookings = createBookingRepository(() => database as unknown as BookingDatabase)
  })

  async function createBookingFixture() {
    const startsAt = new Date('2026-08-10T02:00:00.000Z')
    const endsAt = new Date(startsAt.getTime() + HOUR)
    const hold = await claims.createHold({
      startsAt,
      endsAt,
      expiresAt: new Date(now.getTime() + 30 * MINUTE),
      now,
    })
    if (!hold) throw new Error('test fixture failed to claim a free interval')
    const intent = await bookings.createIntent({
      holdClaimId: hold.id,
      guestName: 'Ada Lovelace',
      guestEmail: 'ada@example.com',
      locale: 'en',
      guestTimeZone: 'America/Los_Angeles',
      topics: ['durable operations'],
      briefText: 'Discuss the operations queue.',
      briefUrls: [],
      meetingProvider: 'google-meet',
      now,
    })
    const claim = await claims.convertHoldToBooking(hold.id, now)
    if (!claim) throw new Error('test fixture failed to convert its hold')
    const { booking } = await bookings.createBooking({
      intent,
      claimId: claim.id,
      status: 'finalizing',
      startsAt,
      endsAt,
      stripeCheckoutSessionId: 'cs_operations',
      stripePaymentIntentId: null,
      amountTotal: 15_000,
      currency: 'usd',
      now,
    })
    return booking
  }

  it('enqueues an operation exactly once per dedupe key', async () => {
    const first = await repository.enqueue(enqueueInput('email:booking-1'))
    const replay = await repository.enqueue(enqueueInput('email:booking-1'))

    expect(first.created).toBe(true)
    expect(first.operation).toMatchObject({
      kind: 'send_booking_email',
      status: 'pending',
      attemptCount: 0,
      maxAttempts: 8,
      leaseToken: null,
    })
    expect(replay.created).toBe(false)
    expect(replay.operation.id).toBe(first.operation.id)
  })

  it('claims due pending operations with a fresh lease', async () => {
    const { operation } = await repository.enqueue(enqueueInput('email:due'))

    const claimed = await repository.claimDue({ now, leaseSeconds: 60, limit: 10 })

    expect(claimed).toHaveLength(1)
    expect(claimed[0]).toMatchObject({
      id: operation.id,
      status: 'running',
      attemptCount: 1,
      leaseExpiresAt: new Date(now.getTime() + 60 * 1000),
    })
    expect(claimed[0]?.leaseToken).toBeTruthy()
  })

  it('claims only the requested operation kinds', async () => {
    const email = await repository.enqueue(enqueueInput('email:filtered'))
    const artifacts = await repository.enqueue(
      enqueueInput('artifacts:filtered', { kind: 'update_booking_artifacts' }),
    )

    const claimed = await repository.claimDue({
      now,
      leaseSeconds: 60,
      limit: 10,
      kinds: ['send_booking_email'],
    })

    expect(claimed.map((operation) => operation.id)).toEqual([email.operation.id])
    await expect(repository.get(artifacts.operation.id)).resolves.toMatchObject({
      status: 'pending',
    })
  })

  it('does not claim operations scheduled for the future', async () => {
    await repository.enqueue(
      enqueueInput('email:future', { nextAttemptAt: new Date(now.getTime() + HOUR) }),
    )

    await expect(
      repository.claimDue({ now, leaseSeconds: 60, limit: 10 }),
    ).resolves.toEqual([])
  })

  it('does not claim terminal operations', async () => {
    const succeeded = await repository.enqueue(enqueueInput('op:succeeded'))
    const failed = await repository.enqueue(enqueueInput('op:failed'))
    const resolved = await repository.enqueue(enqueueInput('op:resolved'))
    const claimed = await repository.claimDue({ now, leaseSeconds: 60, limit: 10 })
    const tokenOf = (id: string) =>
      claimed.find((operation) => operation.id === id)?.leaseToken ?? ''
    await repository.complete(succeeded.operation.id, tokenOf(succeeded.operation.id), now)
    await repository.fail({
      operationId: failed.operation.id,
      leaseToken: tokenOf(failed.operation.id),
      errorCode: 'smtp_down',
      retryAt: now,
      now,
      terminal: true,
    })
    await repository.resolve(resolved.operation.id, now)

    // Every operation is terminal, so even a sweep past every lease expiry
    // has nothing left to claim.
    await expect(
      repository.claimDue({
        now: new Date(now.getTime() + HOUR),
        leaseSeconds: 60,
        limit: 10,
      }),
    ).resolves.toEqual([])
  })

  it('reclaims a running operation only after its lease expires', async () => {
    await repository.enqueue(enqueueInput('email:crash'))
    const [claimed] = await repository.claimDue({ now, leaseSeconds: 60, limit: 10 })

    const beforeExpiry = await repository.claimDue({
      now: new Date(now.getTime() + 30 * 1000),
      leaseSeconds: 60,
      limit: 10,
    })
    const afterExpiry = await repository.claimDue({
      now: new Date(now.getTime() + 61 * 1000),
      leaseSeconds: 60,
      limit: 10,
    })

    expect(beforeExpiry).toEqual([])
    expect(afterExpiry).toHaveLength(1)
    expect(afterExpiry[0]).toMatchObject({ id: claimed!.id, status: 'running', attemptCount: 2 })
    expect(afterExpiry[0]?.leaseToken).not.toBe(claimed?.leaseToken)
  })

  it('claims in due order up to the limit', async () => {
    const third = await repository.enqueue(
      enqueueInput('op:third', { nextAttemptAt: new Date(now.getTime() + 2 * MINUTE) }),
    )
    const first = await repository.enqueue(enqueueInput('op:first'))
    const second = await repository.enqueue(
      enqueueInput('op:second', { nextAttemptAt: new Date(now.getTime() + MINUTE) }),
    )

    const claimed = await repository.claimDue({
      now: new Date(now.getTime() + 10 * MINUTE),
      leaseSeconds: 60,
      limit: 2,
    })

    expect(claimed.map((operation) => operation.id).sort()).toEqual(
      [first.operation.id, second.operation.id].sort(),
    )
    await expect(repository.get(third.operation.id)).resolves.toMatchObject({
      status: 'pending',
    })
  })

  it('completes an operation only with its lease token', async () => {
    const { operation } = await repository.enqueue(enqueueInput('email:complete'))
    const [claimed] = await repository.claimDue({ now, leaseSeconds: 60, limit: 10 })

    await expect(
      repository.complete(operation.id, '00000000-0000-4000-8000-000000000000', now),
    ).resolves.toBeNull()

    const completed = await repository.complete(operation.id, claimed!.leaseToken!, now)

    expect(completed).toMatchObject({
      status: 'succeeded',
      completedAt: now,
      leaseToken: null,
      leaseExpiresAt: null,
    })
    await expect(
      repository.complete(operation.id, claimed!.leaseToken!, now),
    ).resolves.toBeNull()
  })

  it('returns a failed attempt to the queue at its retry time', async () => {
    await repository.enqueue(enqueueInput('email:retryable'))
    const [claimed] = await repository.claimDue({ now, leaseSeconds: 60, limit: 10 })
    const retryAt = new Date(now.getTime() + 5 * MINUTE)

    const failed = await repository.fail({
      operationId: claimed!.id,
      leaseToken: claimed!.leaseToken!,
      errorCode: 'smtp_down',
      retryAt,
      now,
    })

    expect(failed).toMatchObject({
      status: 'pending',
      nextAttemptAt: retryAt,
      lastErrorCode: 'smtp_down',
      leaseToken: null,
      leaseExpiresAt: null,
    })

    const reclaimed = await repository.claimDue({ now: retryAt, leaseSeconds: 60, limit: 10 })
    expect(reclaimed[0]).toMatchObject({ id: claimed!.id, attemptCount: 2 })
  })

  it('rejects a failure report with a stale lease token', async () => {
    await repository.enqueue(enqueueInput('email:stale'))
    const [claimed] = await repository.claimDue({ now, leaseSeconds: 60, limit: 10 })

    await expect(
      repository.fail({
        operationId: claimed!.id,
        leaseToken: '00000000-0000-4000-8000-000000000000',
        errorCode: 'smtp_down',
        retryAt: now,
        now,
      }),
    ).resolves.toBeNull()
    await expect(repository.get(claimed!.id)).resolves.toMatchObject({ status: 'running' })
  })

  it('parks an operation as failed when the failure is terminal', async () => {
    await repository.enqueue(enqueueInput('email:terminal'))
    const [claimed] = await repository.claimDue({ now, leaseSeconds: 60, limit: 10 })

    const failed = await repository.fail({
      operationId: claimed!.id,
      leaseToken: claimed!.leaseToken!,
      errorCode: 'invalid_recipient',
      retryAt: new Date(now.getTime() + 5 * MINUTE),
      now,
      terminal: true,
    })

    expect(failed).toMatchObject({
      status: 'failed',
      lastErrorCode: 'invalid_recipient',
      completedAt: now,
      leaseToken: null,
    })
  })

  it('parks an operation as failed once its attempts are exhausted', async () => {
    await repository.enqueue(enqueueInput('email:exhausted', { maxAttempts: 1 }))
    const [claimed] = await repository.claimDue({ now, leaseSeconds: 60, limit: 10 })

    const failed = await repository.fail({
      operationId: claimed!.id,
      leaseToken: claimed!.leaseToken!,
      errorCode: 'smtp_down',
      retryAt: new Date(now.getTime() + 5 * MINUTE),
      now,
    })

    expect(failed).toMatchObject({
      status: 'failed',
      attemptCount: 1,
      completedAt: now,
    })
  })

  it('cancels only pending operations of the given kinds for a Booking', async () => {
    const booking = await createBookingFixture()
    const reminder = await repository.enqueue(
      enqueueInput('reminder:pending', {
        kind: 'send_reminder',
        bookingId: booking.id,
        nextAttemptAt: new Date(now.getTime() + HOUR),
      }),
    )
    const email = await repository.enqueue(
      enqueueInput('email:pending', {
        bookingId: booking.id,
        nextAttemptAt: new Date(now.getTime() + HOUR),
      }),
    )
    const runningReminder = await repository.enqueue(
      enqueueInput('reminder:running', { kind: 'send_reminder', bookingId: booking.id }),
    )
    // Only the running reminder is due yet, so this leases just that one.
    await repository.claimDue({ now, leaseSeconds: 3600, limit: 10 })

    const cancelled = await repository.cancelPendingForBooking({
      bookingId: booking.id,
      kinds: ['send_reminder'],
      now,
    })

    expect(cancelled).toBe(1)
    await expect(repository.get(reminder.operation.id)).resolves.toMatchObject({
      status: 'cancelled',
      completedAt: now,
    })
    await expect(repository.get(email.operation.id)).resolves.toMatchObject({
      status: 'pending',
    })
    await expect(repository.get(runningReminder.operation.id)).resolves.toMatchObject({
      status: 'running',
    })
  })

  it('returns a failed operation to the queue on admin retry', async () => {
    await repository.enqueue(enqueueInput('email:retry'))
    const [claimed] = await repository.claimDue({ now, leaseSeconds: 60, limit: 10 })
    await repository.fail({
      operationId: claimed!.id,
      leaseToken: claimed!.leaseToken!,
      errorCode: 'smtp_down',
      retryAt: now,
      now,
      terminal: true,
    })
    const retryAt = new Date(now.getTime() + HOUR)

    const retried = await repository.retry(claimed!.id, retryAt)

    expect(retried).toMatchObject({
      status: 'pending',
      attemptCount: 0,
      nextAttemptAt: retryAt,
      completedAt: null,
      leaseToken: null,
    })
    await expect(repository.retry(claimed!.id, retryAt)).resolves.toBeNull()
  })

  it('resolves unfinished work manually but not succeeded work', async () => {
    const pending = await repository.enqueue(
      enqueueInput('op:pending', { nextAttemptAt: new Date(now.getTime() + HOUR) }),
    )
    const running = await repository.enqueue(enqueueInput('op:running'))
    const failing = await repository.enqueue(enqueueInput('op:failing'))
    const succeeding = await repository.enqueue(enqueueInput('op:succeeding'))
    const claimed = await repository.claimDue({ now, leaseSeconds: 60, limit: 10 })
    const tokenOf = (id: string) =>
      claimed.find((operation) => operation.id === id)?.leaseToken ?? ''
    await repository.fail({
      operationId: failing.operation.id,
      leaseToken: tokenOf(failing.operation.id),
      errorCode: 'smtp_down',
      retryAt: now,
      now,
      terminal: true,
    })
    await repository.complete(succeeding.operation.id, tokenOf(succeeding.operation.id), now)

    await expect(repository.resolve(pending.operation.id, now)).resolves.toMatchObject({
      status: 'resolved',
      completedAt: now,
    })
    await expect(repository.resolve(running.operation.id, now)).resolves.toMatchObject({
      status: 'resolved',
    })
    await expect(repository.resolve(failing.operation.id, now)).resolves.toMatchObject({
      status: 'resolved',
    })
    await expect(repository.resolve(succeeding.operation.id, now)).resolves.toBeNull()
  })

  it('lists unresolved operations in due order', async () => {
    const running = await repository.enqueue(enqueueInput('op:running'))
    const failing = await repository.enqueue(
      enqueueInput('op:failing', { nextAttemptAt: new Date(now.getTime() + MINUTE) }),
    )
    const succeeding = await repository.enqueue(
      enqueueInput('op:succeeding', { nextAttemptAt: new Date(now.getTime() + 2 * MINUTE) }),
    )
    const pending = await repository.enqueue(
      enqueueInput('op:pending', { nextAttemptAt: new Date(now.getTime() + HOUR) }),
    )
    const claimed = await repository.claimDue({
      now: new Date(now.getTime() + 5 * MINUTE),
      leaseSeconds: 60,
      limit: 3,
    })
    const tokenOf = (id: string) =>
      claimed.find((operation) => operation.id === id)?.leaseToken ?? ''
    await repository.fail({
      operationId: failing.operation.id,
      leaseToken: tokenOf(failing.operation.id),
      errorCode: 'smtp_down',
      retryAt: new Date(now.getTime() + MINUTE),
      now,
      terminal: true,
    })
    await repository.complete(succeeding.operation.id, tokenOf(succeeding.operation.id), now)

    const unresolved = await repository.listUnresolved()

    expect(unresolved.map((operation) => operation.id)).toEqual([
      running.operation.id,
      failing.operation.id,
      pending.operation.id,
    ])
  })

  it('lists operations for a Booking', async () => {
    const booking = await createBookingFixture()
    const older = await repository.enqueue(
      enqueueInput('booking:older', { bookingId: booking.id }),
    )
    const newer = await repository.enqueue(
      enqueueInput('booking:newer', {
        bookingId: booking.id,
        now: new Date(now.getTime() + MINUTE),
      }),
    )
    await repository.enqueue(enqueueInput('booking:unrelated'))

    const operations = await repository.listForBooking(booking.id)

    expect(operations.map((operation) => operation.id)).toEqual([
      newer.operation.id,
      older.operation.id,
    ])
  })

  it('counts operations by status', async () => {
    await repository.enqueue(enqueueInput('op:1'))
    await repository.enqueue(enqueueInput('op:2'))
    await repository.enqueue(
      enqueueInput('op:3', { nextAttemptAt: new Date(now.getTime() + HOUR) }),
    )
    await repository.claimDue({ now, leaseSeconds: 60, limit: 10 })

    await expect(repository.countByStatus()).resolves.toEqual({
      running: 2,
      pending: 1,
    })
  })

  it('finds an operation by its dedupe key', async () => {
    const { operation } = await repository.enqueue(enqueueInput('email:dedupe'))

    await expect(repository.getByDedupeKey('email:dedupe')).resolves.toMatchObject({
      id: operation.id,
    })
    await expect(repository.getByDedupeKey('email:missing')).resolves.toBeNull()
  })

  it('never double-claims an operation across concurrent claim runs', async () => {
    const { operation } = await repository.enqueue(enqueueInput('email:contended'))

    const [first, second] = await Promise.all([
      repository.claimDue({ now, leaseSeconds: 60, limit: 10 }),
      repository.claimDue({ now, leaseSeconds: 60, limit: 10 }),
    ])

    const claimedIds = [...first, ...second].map((claimedOperation) => claimedOperation.id)
    expect(claimedIds).toEqual([operation.id])
  })
})
