import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import { createPublicRequestGuard } from '~/lib/ama/booking/http'
import { createMemoryRateLimiter } from '~/lib/rate-limit/memory'
import { RESUME_COOKIE, validResumeSession } from './access'
import { createResumeHandlers } from './http'

const baseUrl = new URL('https://cali.so')
const credentials = { passphrase: 'a sufficiently long test phrase', secret: 'a'.repeat(64) }

function request(passphrase = credentials.passphrase, headers: Record<string, string> = {}, locale = 'en') {
  return new Request(new URL('/api/resume/unlock', baseUrl), {
    method: 'POST',
    headers: { origin: baseUrl.origin, 'sec-fetch-site': 'same-origin', ...headers },
    body: new URLSearchParams({ passphrase, locale }),
  })
}

function handlers(configured = true, limiter = createMemoryRateLimiter({ prefix: 'test', maxRequests: 5, windowSeconds: 900 })) {
  return createResumeHandlers({
    baseUrl,
    credentials: configured ? credentials : null,
    guard: createPublicRequestGuard({ baseUrl, pseudonymKey: Buffer.alloc(32), rateLimiter: limiter, retryAfterSeconds: 900 }),
  })
}

describe('resume HTTP boundary', () => {
  it('sets an expiring, secure, HttpOnly session only after a correct passphrase', async () => {
    const response = await handlers().unlock(request())
    expect(response.status).toBe(303)
    expect(response.headers.get('location')).toBe('https://cali.so/en/resume')
    const cookie = response.headers.get('set-cookie')!
    expect(cookie).toContain('HttpOnly')
    expect(cookie).toContain('Secure')
    expect(cookie).toContain('SameSite=lax')
    expect(cookie).toContain('Max-Age=28800')
    expect(validResumeSession(cookie.split(';')[0].slice(RESUME_COOKIE.length + 1), credentials)).toBe(true)
    expect(response.headers.get('cache-control')).toContain('no-store')
    expect(response.headers.get('x-robots-tag')).toContain('noindex')
    expect(response.headers.get('referrer-policy')).toBe('same-origin')
  })

  it('never grants a cookie for incorrect or unconfigured credentials', async () => {
    for (const [handler, phrase, error] of [
      [handlers(), 'wrong', 'incorrect'],
      [handlers(false), credentials.passphrase, 'unavailable'],
    ] as const) {
      const response = await handler.unlock(request(phrase))
      expect(response.headers.get('set-cookie')).toBeNull()
      expect(response.headers.get('location')).toBe(`https://cali.so/en/resume?access=${error}`)
      expect(response.headers.get('location')).not.toContain(phrase)
    }
  })

  it('denies cross-origin or missing-origin submissions before granting or clearing cookies', async () => {
    const deniedHeaders: Record<string, string>[] = [{ origin: 'https://evil.example' }, { origin: '' }, { 'sec-fetch-site': 'cross-site' }]
    for (const headers of deniedHeaders) {
      for (const handler of ['unlock', 'lock'] as const) {
        const response = await handlers()[handler](request(credentials.passphrase, headers))
        expect(response.status).toBe(403)
        expect(response.headers.get('set-cookie')).toBeNull()
      }
    }
  })

  it('rate-limits attempts, including a correct passphrase after the limit', async () => {
    const handler = handlers()
    for (let index = 0; index < 5; index++) await handler.unlock(request('incorrect'))
    const response = await handler.unlock(request())
    expect(response.headers.get('location')).toContain('access=limited')
    expect(response.headers.get('retry-after')).toBe('900')
    expect(response.headers.get('set-cookie')).toBeNull()
  })

  it('fails closed when rate limiting is unavailable', async () => {
    const handler = handlers(true, { limit: vi.fn().mockRejectedValue(new Error('offline')) })
    const response = await handler.unlock(request())
    expect(response.headers.get('location')).toContain('access=unavailable')
    expect(response.headers.get('set-cookie')).toBeNull()
  })

  it('rejects oversized forms and unsupported request bodies', async () => {
    const oversized = await handlers().unlock(request('a'.repeat(5000)))
    expect(oversized.status).toBe(400)
    const json = await handlers().unlock(request(credentials.passphrase, { 'content-type': 'application/json' }))
    expect(json.status).toBe(400)
    expect(oversized.headers.get('set-cookie')).toBeNull()
  })

  it('clears the same cookie and keeps redirects within the two resume routes', async () => {
    const response = await handlers().lock(request('', {}, 'https://evil.example'))
    expect(response.headers.get('location')).toBe('https://cali.so/resume')
    expect(response.headers.get('set-cookie')).toContain(`${RESUME_COOKIE}=`)
    expect(response.headers.get('set-cookie')).toContain('Max-Age=0')
    expect(response.headers.get('set-cookie')).toContain('Path=/')
  })
})
