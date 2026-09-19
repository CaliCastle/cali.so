import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import {
  createResumeSession,
  matchesPassphrase,
  RESUME_SESSION_SECONDS,
  resumeCredentials,
  validResumeSession,
} from './access'

const credentials = { passphrase: 'a sufficiently long test phrase', secret: 'a'.repeat(64) }
const now = 1_790_000_000_000

describe('private resume access', () => {
  it('fails closed for absent, partial, weak, or reused credentials', () => {
    for (const source of [
      {},
      { RESUME_PASSPHRASE: credentials.passphrase },
      { RESUME_SESSION_SECRET: credentials.secret },
      { RESUME_PASSPHRASE: 'short', RESUME_SESSION_SECRET: credentials.secret },
      { RESUME_PASSPHRASE: credentials.passphrase, RESUME_SESSION_SECRET: 'short' },
      { RESUME_PASSPHRASE: credentials.secret, RESUME_SESSION_SECRET: credentials.secret },
    ]) expect(resumeCredentials(source)).toBeNull()
    expect(resumeCredentials({ RESUME_PASSPHRASE: credentials.passphrase, RESUME_SESSION_SECRET: credentials.secret })).toEqual(credentials)
  })

  it('requires the exact passphrase, including case and whitespace', async () => {
    expect(await matchesPassphrase(credentials.passphrase, credentials)).toBe(true)
    expect(await matchesPassphrase(credentials.passphrase.toUpperCase(), credentials)).toBe(false)
    expect(await matchesPassphrase(` ${credentials.passphrase}`, credentials)).toBe(false)
    expect(await matchesPassphrase('', credentials)).toBe(false)
  })

  it('rejects excess concurrent verification and recovers after work finishes', async () => {
    const accepted = [
      matchesPassphrase(credentials.passphrase, credentials),
      matchesPassphrase('incorrect', credentials),
    ]
    const excess = await Promise.allSettled(Array.from({ length: 10 }, () =>
      matchesPassphrase(credentials.passphrase, credentials),
    ))
    expect(excess.every((result) =>
      result.status === 'rejected' && result.reason.message === 'Resume passphrase verification is busy',
    )).toBe(true)
    expect(await Promise.all(accepted)).toEqual([true, false])
    expect(await matchesPassphrase(credentials.passphrase, credentials)).toBe(true)
  })

  it('issues unique sessions without embedding credentials', async () => {
    const token = await createResumeSession(credentials, now)
    expect(await validResumeSession(token, credentials, now)).toBe(true)
    expect(await createResumeSession(credentials, now)).not.toBe(token)
    expect(token).not.toContain(credentials.passphrase)
    expect(token).not.toContain(credentials.secret)
  })

  it('rejects missing, malformed, forged, and expired sessions', async () => {
    const token = await createResumeSession(credentials, now)
    for (const candidate of [undefined, '', 'true', `${token}.extra`, token.replace('v1', 'v2'), `${token.slice(0, -5)}AAAAA`]) {
      expect(await validResumeSession(candidate, credentials, now)).toBe(false)
    }
    expect(await validResumeSession(token, credentials, now + RESUME_SESSION_SECONDS * 1000 - 1000)).toBe(true)
    expect(await validResumeSession(token, credentials, now + RESUME_SESSION_SECONDS * 1000)).toBe(false)
    expect(await validResumeSession(token, null, now)).toBe(false)
  })

  it('invalidates sessions when either credential is rotated', async () => {
    const token = await createResumeSession(credentials, now)
    expect(await validResumeSession(token, { ...credentials, passphrase: 'a different long test phrase' }, now)).toBe(false)
    expect(await validResumeSession(token, { ...credentials, secret: 'b'.repeat(64) }, now)).toBe(false)
  })
})
