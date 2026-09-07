import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import { fetchWithOperationsTimeout, withOperationsDeadline } from './deadline'
import type { DurableOperationsRepository } from './repository'
import { createOperationsRunner } from './runner'

function abortableFetch() {
  return vi.fn((_input: unknown, init?: RequestInit) =>
    new Promise<Response>((_resolve, reject) => {
      const signal = init!.signal!
      signal.throwIfAborted()
      signal.addEventListener('abort', () => reject(signal.reason), { once: true })
    }),
  )
}

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('operation deadline', () => {
  it('aborts a late multi-call handler, records its retry, and defers remaining work', async () => {
    vi.useFakeTimers()
    const fetch = abortableFetch()
    fetch.mockResolvedValueOnce(new Response('{}'))
    vi.stubGlobal('fetch', fetch)
    const claimDue = vi.fn().mockResolvedValue([
      { id: 'slow', leaseToken: 'lease-1', attemptCount: 1 },
      { id: 'later', leaseToken: 'lease-2', attemptCount: 1 },
    ])
    const complete = vi.fn()
    const fail = vi.fn().mockResolvedValue({ status: 'pending' })
    const handler = vi.fn(async () => {
      await fetchWithOperationsTimeout('https://provider.test/first')
      try {
        await fetchWithOperationsTimeout('https://provider.test/second')
      } catch {
        // A provider retry must inherit the expired deadline too.
        await fetchWithOperationsTimeout('https://provider.test/retry')
      }
    })
    const runner = createOperationsRunner({
      operations: { claimDue, complete, fail } as unknown as DurableOperationsRepository,
      handler,
    })
    const drain = withOperationsDeadline(240_000, async (signal) => {
      // Earlier passes consume almost the entire shared drain budget.
      await new Promise((resolve) => setTimeout(resolve, 239_000))
      return runner.run({ signal })
    })

    await vi.advanceTimersByTimeAsync(240_000)
    expect(await drain).toEqual({
      claimed: 2, succeeded: 0, retried: 1, failed: 0, deferred: 1,
    })
    expect(fetch).toHaveBeenCalledTimes(2)
    expect(handler).toHaveBeenCalledTimes(1)
    expect(claimDue).toHaveBeenCalledTimes(1)
    expect(complete).not.toHaveBeenCalled()
    expect(fail).toHaveBeenCalledWith(expect.objectContaining({
      operationId: 'slow', leaseToken: 'lease-1', terminal: false,
    }))
    expect(vi.getTimerCount()).toBe(0)
  })

  it('does not claim work when the shared deadline has already expired', async () => {
    const claimDue = vi.fn()
    const runner = createOperationsRunner({
      operations: { claimDue } as unknown as DurableOperationsRepository,
      handler: vi.fn(),
    })
    const result = await runner.run({ signal: AbortSignal.abort() })
    expect(result.claimed).toBe(0)
    expect(claimDue).not.toHaveBeenCalled()
  })

  it('isolates concurrent drains and leaves ordinary provider requests unaffected', async () => {
    vi.useFakeTimers()
    const signals: AbortSignal[] = []
    vi.stubGlobal('fetch', vi.fn(async (_input, init) => {
      signals.push(init.signal)
      return new Response('{}')
    }))
    const short = withOperationsDeadline(100, async () => {
      await fetchWithOperationsTimeout('https://provider.test/short')
      await new Promise((resolve) => setTimeout(resolve, 150))
    })
    const long = withOperationsDeadline(300, async () => {
      await fetchWithOperationsTimeout('https://provider.test/long')
      await new Promise((resolve) => setTimeout(resolve, 200))
    })
    await fetchWithOperationsTimeout('https://provider.test/outside')
    await vi.advanceTimersByTimeAsync(100)
    expect(signals.map((signal) => signal.aborted)).toEqual([true, false, false])
    await vi.advanceTimersByTimeAsync(100)
    await Promise.all([short, long])
    expect(vi.getTimerCount()).toBe(0)
  })

  it('preserves caller cancellation and the per-request timeout', async () => {
    const fetch = abortableFetch()
    vi.stubGlobal('fetch', fetch)
    const caller = new AbortController()
    const request = fetchWithOperationsTimeout('https://provider.test', { signal: caller.signal })
    caller.abort()
    await expect(request).rejects.toMatchObject({ name: 'AbortError' })

    const timeout = new AbortController()
    const timeoutSpy = vi.spyOn(AbortSignal, 'timeout').mockReturnValue(timeout.signal)
    try {
      const pending = fetchWithOperationsTimeout('https://provider.test')
      timeout.abort(new DOMException('Timed out', 'TimeoutError'))
      await expect(pending).rejects.toMatchObject({ name: 'TimeoutError' })
      expect(timeoutSpy).toHaveBeenCalledWith(8_000)
    } finally {
      timeoutSpy.mockRestore()
    }
  })
})
