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

  it('requires the exact passphrase, including case and whitespace', () => {
    expect(matchesPassphrase(credentials.passphrase, credentials)).toBe(true)
    expect(matchesPassphrase(credentials.passphrase.toUpperCase(), credentials)).toBe(false)
    expect(matchesPassphrase(` ${credentials.passphrase}`, credentials)).toBe(false)
    expect(matchesPassphrase('', credentials)).toBe(false)
  })

  it('issues unique sessions without embedding credentials', () => {
    const token = createResumeSession(credentials, now)
    expect(validResumeSession(token, credentials, now)).toBe(true)
    expect(createResumeSession(credentials, now)).not.toBe(token)
    expect(token).not.toContain(credentials.passphrase)
    expect(token).not.toContain(credentials.secret)
  })

  it('rejects missing, malformed, forged, and expired sessions', () => {
    const token = createResumeSession(credentials, now)
    for (const candidate of [undefined, '', 'true', `${token}.extra`, token.replace('v1', 'v2'), `${token.slice(0, -5)}AAAAA`]) {
      expect(validResumeSession(candidate, credentials, now)).toBe(false)
    }
    expect(validResumeSession(token, credentials, now + RESUME_SESSION_SECONDS * 1000 - 1000)).toBe(true)
    expect(validResumeSession(token, credentials, now + RESUME_SESSION_SECONDS * 1000)).toBe(false)
    expect(validResumeSession(token, null, now)).toBe(false)
  })

  it('invalidates sessions when either credential is rotated', () => {
    const token = createResumeSession(credentials, now)
    expect(validResumeSession(token, { ...credentials, passphrase: 'a different long test phrase' }, now)).toBe(false)
    expect(validResumeSession(token, { ...credentials, secret: 'b'.repeat(64) }, now)).toBe(false)
  })
})
