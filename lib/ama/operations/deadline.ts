import 'server-only'

import { AsyncLocalStorage } from 'node:async_hooks'

const operationSignal = new AsyncLocalStorage<AbortSignal>()
const PROVIDER_REQUEST_TIMEOUT_MS = 8_000

/** Share one deadline across every provider call in a drain, including retries. */
export async function withOperationsDeadline<T>(
  budgetMs: number,
  work: (signal: AbortSignal) => Promise<T>,
): Promise<T> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), budgetMs)
  try {
    return await operationSignal.run(controller.signal, () => work(controller.signal))
  } finally {
    clearTimeout(timer)
  }
}

/** The shared clients read the current drain's signal without affecting other requests. */
export function fetchWithOperationsTimeout(
  input: string | URL | Request,
  init: RequestInit = {},
) {
  const signals = [AbortSignal.timeout(PROVIDER_REQUEST_TIMEOUT_MS)]
  const callerSignal = init.signal ?? (input instanceof Request ? input.signal : null)
  if (callerSignal) signals.push(callerSignal)
  const deadlineSignal = operationSignal.getStore()
  if (deadlineSignal) signals.push(deadlineSignal)
  const signal = AbortSignal.any(signals)
  signal.throwIfAborted()
  return fetch(input, { ...init, signal })
}
