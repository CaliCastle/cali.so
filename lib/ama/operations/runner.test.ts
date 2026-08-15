import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import {
  RetryableOperationError,
  TerminalOperationError,
} from './handlers'
import type {
  DurableOperationRecord,
  DurableOperationsRepository,
} from './repository'
import { createOperationsRunner } from './runner'

const NOW = new Date('2026-07-01T12:00:00Z')

function makeOperation(
  overrides: Partial<DurableOperationRecord> = {},
): DurableOperationRecord {
  return {
    id: 'op_1',
    kind: 'send_booking_email',
    dedupeKey: `dedupe:${overrides.id ?? 'op_1'}`,
    bookingId: 'bk_1',
    payload: {},
    status: 'running',
    attemptCount: 1,
    maxAttempts: 8,
    nextAttemptAt: NOW,
    leaseToken: 'lease-1',
    leaseExpiresAt: null,
    lastErrorCode: null,
    completedAt: null,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  }
}

type FailInput = {
  operationId: string
  leaseToken: string
  errorCode: string
  retryAt: Date
  now: Date
  terminal?: boolean
}

function fixture(input: {
  batch: DurableOperationRecord[]
  behavior?: Record<string, (operation: DurableOperationRecord) => Promise<void>>
  failStatus?: Record<string, 'pending' | 'failed'>
}) {
  const completes: { operationId: string; leaseToken: string; now: Date }[] = []
  const fails: FailInput[] = []
  let claimed = false
  const operations = {
    async claimDue() {
      if (claimed) return []
      claimed = true
      return input.batch
    },
    async complete(operationId: string, leaseToken: string, now: Date) {
      completes.push({ operationId, leaseToken, now })
      return makeOperation({ id: operationId, status: 'succeeded' })
    },
    async fail(failInput: FailInput) {
      fails.push(failInput)
      const status = input.failStatus?.[failInput.operationId] ?? 'pending'
      return makeOperation({ id: failInput.operationId, status })
    },
  } as unknown as DurableOperationsRepository

  const handled: string[] = []
  const runner = createOperationsRunner({
    operations,
    handler: async (operation) => {
      handled.push(operation.id)
      const behave = input.behavior?.[operation.id]
      if (behave) await behave(operation)
    },
    clock: { now: () => NOW },
  })
  return { runner, completes, fails, handled }
}

describe('operations runner', () => {
  it('completes a succeeded operation under its lease token', async () => {
    const f = fixture({ batch: [makeOperation({ id: 'op_1', leaseToken: 'lease-a' })] })

    const result = await f.runner.run()

    expect(f.completes).toEqual([
      { operationId: 'op_1', leaseToken: 'lease-a', now: NOW },
    ])
    expect(f.fails).toEqual([])
    expect(result).toEqual({ claimed: 1, succeeded: 1, retried: 0, failed: 0, deferred: 0 })
  })

  it.each([
    [1, 30],
    [3, 120],
    [12, 3600],
  ])(
    'requeues a retryable failure on attempt %i with a %is backoff',
    async (attemptCount, seconds) => {
      const f = fixture({
        batch: [makeOperation({ id: 'op_1', attemptCount })],
        behavior: {
          op_1: async () => {
            throw new RetryableOperationError('calendar_unavailable')
          },
        },
      })

      await f.runner.run()

      expect(f.fails).toEqual([
        {
          operationId: 'op_1',
          leaseToken: 'lease-1',
          errorCode: 'calendar_unavailable',
          retryAt: new Date(NOW.getTime() + seconds * 1000),
          now: NOW,
          terminal: false,
        },
      ])
    },
  )

  it('honors an explicit retry time over the computed backoff', async () => {
    const retryAt = new Date('2026-10-08T10:00:00Z')
    const f = fixture({
      batch: [makeOperation({ id: 'op_1' })],
      behavior: {
        op_1: async () => {
          throw new RetryableOperationError('purge_not_due', retryAt)
        },
      },
    })

    await f.runner.run()

    expect(f.fails[0].retryAt).toBe(retryAt)
    expect(f.fails[0].terminal).toBe(false)
  })

  it('parks a terminal failure with its error code', async () => {
    const f = fixture({
      batch: [makeOperation({ id: 'op_1' })],
      behavior: {
        op_1: async () => {
          throw new TerminalOperationError('unknown_email_kind')
        },
      },
      failStatus: { op_1: 'failed' },
    })

    const result = await f.runner.run()

    expect(f.fails[0]).toMatchObject({
      errorCode: 'unknown_email_kind',
      terminal: true,
    })
    expect(result.failed).toBe(1)
  })

  it('treats an unexpected error as a non-terminal unexpected_error retry', async () => {
    const f = fixture({
      batch: [makeOperation({ id: 'op_1' })],
      behavior: {
        op_1: async () => {
          throw new Error('boom')
        },
      },
    })

    const result = await f.runner.run()

    expect(f.fails[0]).toMatchObject({
      errorCode: 'unexpected_error',
      terminal: false,
    })
    expect(result).toEqual({ claimed: 1, succeeded: 0, retried: 1, failed: 0, deferred: 0 })
  })

  it('counts claimed, succeeded, retried, and failed operations per run', async () => {
    const f = fixture({
      batch: [
        makeOperation({ id: 'op_ok' }),
        makeOperation({ id: 'op_retry' }),
        makeOperation({ id: 'op_dead' }),
      ],
      behavior: {
        op_retry: async () => {
          throw new RetryableOperationError('email_unavailable')
        },
        op_dead: async () => {
          throw new TerminalOperationError('booking_missing')
        },
      },
      failStatus: { op_dead: 'failed' },
    })

    const result = await f.runner.run()

    expect(result).toEqual({ claimed: 3, succeeded: 1, retried: 1, failed: 1, deferred: 0 })
  })

  it('keeps draining the batch after one operation fails', async () => {
    const f = fixture({
      batch: [
        makeOperation({ id: 'op_bad' }),
        makeOperation({ id: 'op_good', leaseToken: 'lease-good' }),
      ],
      behavior: {
        op_bad: async () => {
          throw new Error('boom')
        },
      },
    })

    await f.runner.run()

    expect(f.handled).toEqual(['op_bad', 'op_good'])
    expect(f.completes).toEqual([
      { operationId: 'op_good', leaseToken: 'lease-good', now: NOW },
    ])
  })

  it('claims due work enqueued by a handler in the same run', async () => {
    const queue = [makeOperation({ id: 'op_parent', leaseToken: 'lease-parent' })]
    const handled: string[] = []
    const claims: Array<{ limit: number; kinds?: string[] }> = []
    const operations = {
      async claimDue(input: { limit: number; kinds?: string[] }) {
        claims.push(input)
        return queue.splice(0, input.limit)
      },
      async complete(operationId: string) {
        return makeOperation({ id: operationId, status: 'succeeded' })
      },
      async fail() {
        throw new Error('unexpected fail call')
      },
    } as unknown as DurableOperationsRepository
    const runner = createOperationsRunner({
      operations,
      handler: async (operation) => {
        handled.push(operation.id)
        if (operation.id === 'op_parent') {
          queue.push(makeOperation({ id: 'op_child', leaseToken: 'lease-child' }))
        }
      },
      clock: { now: () => NOW },
    })

    const result = await runner.run()

    expect(handled).toEqual(['op_parent', 'op_child'])
    expect(claims.map(({ limit, kinds }) => ({ limit, kinds }))).toEqual([
      { limit: 10, kinds: undefined },
      { limit: 1, kinds: ['send_booking_email'] },
      { limit: 1, kinds: ['send_booking_email'] },
    ])
    expect(result).toEqual({
      claimed: 2,
      succeeded: 2,
      retried: 0,
      failed: 0,
      deferred: 0,
    })
  })

  it('keeps the total claimed work within the batch size across rounds', async () => {
    const queue = [makeOperation({ id: 'op_1', leaseToken: 'lease-1' })]
    const handled: string[] = []
    const claimLimits: number[] = []
    const operations = {
      async claimDue(input: { limit: number }) {
        claimLimits.push(input.limit)
        return queue.splice(0, input.limit)
      },
      async complete(operationId: string) {
        return makeOperation({ id: operationId, status: 'succeeded' })
      },
      async fail() {
        throw new Error('unexpected fail call')
      },
    } as unknown as DurableOperationsRepository
    const runner = createOperationsRunner({
      operations,
      handler: async (operation) => {
        handled.push(operation.id)
        const next = Number(operation.id.slice('op_'.length)) + 1
        queue.push(
          makeOperation({ id: `op_${next}`, leaseToken: `lease-${next}` }),
        )
      },
      clock: { now: () => NOW },
      batchSize: 3,
    })

    const result = await runner.run()

    expect(handled).toEqual(['op_1', 'op_2', 'op_3'])
    expect(claimLimits).toEqual([3, 1, 1])
    expect(queue.map((operation) => operation.id)).toEqual(['op_4'])
    expect(result.claimed).toBe(3)
    expect(result.succeeded).toBe(3)
  })

  it('does not start a follow-up claim without provider timeout headroom', async () => {
    const queue = [makeOperation({ id: 'op_parent', leaseToken: 'lease-parent' })]
    const claimLimits: number[] = []
    let nowMs = NOW.getTime()
    const operations = {
      async claimDue(input: { limit: number }) {
        claimLimits.push(input.limit)
        return queue.splice(0, input.limit)
      },
      async complete(operationId: string) {
        return makeOperation({ id: operationId, status: 'succeeded' })
      },
      async fail() {
        throw new Error('unexpected fail call')
      },
    } as unknown as DurableOperationsRepository
    const runner = createOperationsRunner({
      operations,
      handler: async () => {
        queue.push(makeOperation({ id: 'op_child', leaseToken: 'lease-child' }))
        nowMs += 36_000
      },
      clock: { now: () => new Date(nowMs) },
      timeBudgetMs: 45_000,
    })

    const result = await runner.run()

    expect(claimLimits).toEqual([10])
    expect(queue.map((operation) => operation.id)).toEqual(['op_child'])
    expect(result).toEqual({
      claimed: 1,
      succeeded: 1,
      retried: 0,
      failed: 0,
      deferred: 0,
    })
  })

  it('skips claimed rows without a lease token', async () => {
    const f = fixture({
      batch: [makeOperation({ id: 'op_1', leaseToken: null })],
    })

    const result = await f.runner.run()

    expect(f.handled).toEqual([])
    expect(result).toEqual({ claimed: 1, succeeded: 0, retried: 0, failed: 0, deferred: 0 })
  })

  it('defers work beyond the time budget so the run fits its function deadline', async () => {
    const batch = [
      makeOperation({ id: 'op_first', leaseToken: 'lease-1' }),
      makeOperation({ id: 'op_second', leaseToken: 'lease-2' }),
      makeOperation({ id: 'op_third', leaseToken: 'lease-3' }),
    ]
    const completes: string[] = []
    const handled: string[] = []
    let nowMs = NOW.getTime()
    const operations = {
      async claimDue() {
        return batch
      },
      async complete(operationId: string) {
        completes.push(operationId)
        return makeOperation({ id: operationId, status: 'succeeded' })
      },
      async fail() {
        throw new Error('unexpected fail call')
      },
    } as unknown as DurableOperationsRepository

    const runner = createOperationsRunner({
      operations,
      handler: async (operation) => {
        handled.push(operation.id)
        // Each operation consumes 20 seconds of wall clock.
        nowMs += 20_000
      },
      clock: { now: () => new Date(nowMs) },
      timeBudgetMs: 30_000,
    })

    const result = await runner.run()

    expect(handled).toEqual(['op_first', 'op_second'])
    expect(completes).toEqual(['op_first', 'op_second'])
    expect(result).toEqual({
      claimed: 3,
      succeeded: 2,
      retried: 0,
      failed: 0,
      deferred: 1,
    })
  })
})
