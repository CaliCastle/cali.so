import 'server-only'

import { randomUUID } from 'node:crypto'

import { and, asc, desc, eq, inArray, lte, or, sql } from 'drizzle-orm'

import { getDatabase } from '~/db'
import { amaDurableOperations } from '~/db/schema'

export type OperationsDatabase = ReturnType<typeof getDatabase>

export type DurableOperationKind =
  | 'finalize_booking'
  | 'send_booking_email'
  | 'send_reminder'
  | 'issue_refund'
  | 'update_booking_artifacts'
  | 'remove_booking_artifacts'
  | 'purge_booking_brief'

export type DurableOperationStatus =
  | 'pending'
  | 'running'
  | 'succeeded'
  | 'failed'
  | 'cancelled'
  | 'resolved'

export type DurableOperationRecord = {
  id: string
  kind: DurableOperationKind
  dedupeKey: string
  bookingId: string | null
  payload: Record<string, unknown>
  status: DurableOperationStatus
  attemptCount: number
  maxAttempts: number
  nextAttemptAt: Date
  leaseToken: string | null
  leaseExpiresAt: Date | null
  lastErrorCode: string | null
  completedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

const TERMINAL_STATUSES = ['succeeded', 'failed', 'cancelled', 'resolved'] as const

export function createDurableOperationsRepository(database: () => OperationsDatabase) {
  return {
    /**
     * Enqueues durable work exactly once per dedupe key. A replayed enqueue
     * returns the already stored operation, so no side effect can be
     * scheduled twice.
     */
    async enqueue(input: {
      kind: DurableOperationKind
      dedupeKey: string
      bookingId?: string | null
      payload?: Record<string, unknown>
      nextAttemptAt: Date
      maxAttempts?: number
      now: Date
    }): Promise<{ operation: DurableOperationRecord; created: boolean }> {
      const [created] = await database()
        .insert(amaDurableOperations)
        .values({
          kind: input.kind,
          dedupeKey: input.dedupeKey,
          bookingId: input.bookingId ?? null,
          payload: input.payload ?? {},
          nextAttemptAt: input.nextAttemptAt,
          maxAttempts: input.maxAttempts ?? 8,
          createdAt: input.now,
          updatedAt: input.now,
        })
        .onConflictDoNothing({ target: amaDurableOperations.dedupeKey })
        .returning()
      if (created) {
        return { operation: created as DurableOperationRecord, created: true }
      }
      const [existing] = await database()
        .select()
        .from(amaDurableOperations)
        .where(eq(amaDurableOperations.dedupeKey, input.dedupeKey))
      if (!existing) {
        throw new Error('Durable operation enqueue conflicted without a stored row')
      }
      return { operation: existing as DurableOperationRecord, created: false }
    },

    /**
     * Leases due work. Pending operations whose attempt time has arrived and
     * running operations whose lease expired (an interrupted worker) are
     * claimed with one compare-and-set statement per batch.
     */
    async claimDue(input: {
      now: Date
      leaseSeconds: number
      limit: number
      kinds?: DurableOperationKind[]
    }): Promise<DurableOperationRecord[]> {
      if (input.kinds?.length === 0) return []
      const leaseToken = randomUUID()
      const leaseExpiresAt = new Date(input.now.getTime() + input.leaseSeconds * 1000)
      const due = database()
        .select({ id: amaDurableOperations.id })
        .from(amaDurableOperations)
        .where(
          and(
            input.kinds
              ? inArray(amaDurableOperations.kind, input.kinds)
              : undefined,
            or(
              and(
                eq(amaDurableOperations.status, 'pending'),
                lte(amaDurableOperations.nextAttemptAt, input.now),
              ),
              and(
                eq(amaDurableOperations.status, 'running'),
                lte(amaDurableOperations.leaseExpiresAt, input.now),
              ),
            ),
          ),
        )
        .orderBy(asc(amaDurableOperations.nextAttemptAt))
        .limit(input.limit)
      const claimed = await database()
        .update(amaDurableOperations)
        .set({
          status: 'running',
          leaseToken,
          leaseExpiresAt,
          attemptCount: sql`${amaDurableOperations.attemptCount} + 1`,
          updatedAt: input.now,
        })
        .where(
          and(
            inArray(amaDurableOperations.id, due),
            // Re-checked on the latest row version so a concurrent runner
            // that already leased an operation cannot lease it again.
            or(
              and(
                eq(amaDurableOperations.status, 'pending'),
                lte(amaDurableOperations.nextAttemptAt, input.now),
              ),
              and(
                eq(amaDurableOperations.status, 'running'),
                lte(amaDurableOperations.leaseExpiresAt, input.now),
              ),
            ),
          ),
        )
        .returning()
      return claimed as DurableOperationRecord[]
    },

    /**
     * Completes a leased operation. The lease token guards against a slow
     * worker finishing after its lease was reclaimed by another run.
     */
    async complete(operationId: string, leaseToken: string, now: Date) {
      const [updated] = await database()
        .update(amaDurableOperations)
        .set({
          status: 'succeeded',
          leaseToken: null,
          leaseExpiresAt: null,
          lastErrorCode: null,
          completedAt: now,
          updatedAt: now,
        })
        .where(
          and(
            eq(amaDurableOperations.id, operationId),
            eq(amaDurableOperations.leaseToken, leaseToken),
            eq(amaDurableOperations.status, 'running'),
          ),
        )
        .returning()
      return (updated as DurableOperationRecord | undefined) ?? null
    },

    /**
     * Records a failed attempt. The operation retries at the supplied time
     * until its attempts are exhausted, then parks in the terminal failed
     * state for admin recovery.
     */
    async fail(input: {
      operationId: string
      leaseToken: string
      errorCode: string
      retryAt: Date
      now: Date
      terminal?: boolean
    }): Promise<DurableOperationRecord | null> {
      const [current] = await database()
        .select()
        .from(amaDurableOperations)
        .where(
          and(
            eq(amaDurableOperations.id, input.operationId),
            eq(amaDurableOperations.leaseToken, input.leaseToken),
            eq(amaDurableOperations.status, 'running'),
          ),
        )
      if (!current) return null
      const exhausted =
        input.terminal === true || current.attemptCount >= current.maxAttempts
      const [updated] = await database()
        .update(amaDurableOperations)
        .set(
          exhausted
            ? {
                status: 'failed',
                leaseToken: null,
                leaseExpiresAt: null,
                lastErrorCode: input.errorCode,
                completedAt: input.now,
                updatedAt: input.now,
              }
            : {
                status: 'pending',
                leaseToken: null,
                leaseExpiresAt: null,
                lastErrorCode: input.errorCode,
                nextAttemptAt: input.retryAt,
                updatedAt: input.now,
              },
        )
        .where(
          and(
            eq(amaDurableOperations.id, input.operationId),
            eq(amaDurableOperations.leaseToken, input.leaseToken),
            eq(amaDurableOperations.status, 'running'),
          ),
        )
        .returning()
      return (updated as DurableOperationRecord | undefined) ?? null
    },

    /**
     * Cancels not-yet-terminal work, used when a reschedule or cancellation
     * makes queued reminders or artifacts obsolete.
     */
    async cancelPendingForBooking(input: {
      bookingId: string
      kinds: readonly DurableOperationKind[]
      now: Date
    }): Promise<number> {
      const cancelled = await database()
        .update(amaDurableOperations)
        .set({
          status: 'cancelled',
          leaseToken: null,
          leaseExpiresAt: null,
          completedAt: input.now,
          updatedAt: input.now,
        })
        .where(
          and(
            eq(amaDurableOperations.bookingId, input.bookingId),
            inArray(amaDurableOperations.kind, [...input.kinds]),
            eq(amaDurableOperations.status, 'pending'),
          ),
        )
        .returning({ id: amaDurableOperations.id })
      return cancelled.length
    },

    /**
     * Admin retry: returns a terminally failed operation to the queue with a
     * fresh attempt budget.
     */
    async retry(operationId: string, now: Date): Promise<DurableOperationRecord | null> {
      const [updated] = await database()
        .update(amaDurableOperations)
        .set({
          status: 'pending',
          attemptCount: 0,
          nextAttemptAt: now,
          leaseToken: null,
          leaseExpiresAt: null,
          completedAt: null,
          updatedAt: now,
        })
        .where(
          and(
            eq(amaDurableOperations.id, operationId),
            eq(amaDurableOperations.status, 'failed'),
          ),
        )
        .returning()
      return (updated as DurableOperationRecord | undefined) ?? null
    },

    /**
     * Admin manual resolution for work completed outside the system.
     */
    async resolve(operationId: string, now: Date): Promise<DurableOperationRecord | null> {
      const [updated] = await database()
        .update(amaDurableOperations)
        .set({
          status: 'resolved',
          leaseToken: null,
          leaseExpiresAt: null,
          completedAt: now,
          updatedAt: now,
        })
        .where(
          and(
            eq(amaDurableOperations.id, operationId),
            inArray(amaDurableOperations.status, ['pending', 'running', 'failed']),
          ),
        )
        .returning()
      return (updated as DurableOperationRecord | undefined) ?? null
    },

    async get(operationId: string): Promise<DurableOperationRecord | null> {
      const [operation] = await database()
        .select()
        .from(amaDurableOperations)
        .where(eq(amaDurableOperations.id, operationId))
      return (operation as DurableOperationRecord | undefined) ?? null
    },

    async getByDedupeKey(dedupeKey: string): Promise<DurableOperationRecord | null> {
      const [operation] = await database()
        .select()
        .from(amaDurableOperations)
        .where(eq(amaDurableOperations.dedupeKey, dedupeKey))
      return (operation as DurableOperationRecord | undefined) ?? null
    },

    async listUnresolved(limit = 100): Promise<DurableOperationRecord[]> {
      return (await database()
        .select()
        .from(amaDurableOperations)
        .where(
          inArray(amaDurableOperations.status, ['pending', 'running', 'failed']),
        )
        .orderBy(asc(amaDurableOperations.nextAttemptAt))
        .limit(limit)) as DurableOperationRecord[]
    },

    async listForBooking(bookingId: string): Promise<DurableOperationRecord[]> {
      return (await database()
        .select()
        .from(amaDurableOperations)
        .where(eq(amaDurableOperations.bookingId, bookingId))
        .orderBy(desc(amaDurableOperations.createdAt))) as DurableOperationRecord[]
    },

    async countByStatus(): Promise<Record<string, number>> {
      const rows = await database()
        .select({
          status: amaDurableOperations.status,
          count: sql<number>`count(*)::int`,
        })
        .from(amaDurableOperations)
        .groupBy(amaDurableOperations.status)
      return Object.fromEntries(rows.map((row) => [row.status, row.count]))
    },
  }
}

export function isTerminalOperationStatus(status: DurableOperationStatus) {
  return (TERMINAL_STATUSES as readonly string[]).includes(status)
}

export type DurableOperationsRepository = ReturnType<
  typeof createDurableOperationsRepository
>

export const durableOperationsRepository = createDurableOperationsRepository(getDatabase)
