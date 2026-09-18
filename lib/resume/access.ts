import 'server-only'

import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto'

export const RESUME_COOKIE = 'cali-resume'
export const RESUME_SESSION_SECONDS = 8 * 60 * 60

export type ResumeCredentials = { passphrase: string; secret: string }

export function resumeCredentials(
  source: Record<string, string | undefined> = process.env,
): ResumeCredentials | null {
  const passphrase = source.RESUME_PASSPHRASE
  const secret = source.RESUME_SESSION_SECRET
  if (!passphrase || passphrase.trim().length < 16 || passphrase.length > 256) return null
  if (!secret || secret.trim().length < 32 || secret === passphrase) return null
  return { passphrase, secret }
}

export function matchesPassphrase(value: string, credentials: ResumeCredentials) {
  const digest = (text: string) => createHash('sha256').update(text).digest()
  return timingSafeEqual(digest(value), digest(credentials.passphrase))
}

function signature(payload: string, credentials: ResumeCredentials) {
  // Bind sessions to both credentials so rotating either invalidates access.
  return createHmac('sha256', credentials.secret)
    .update(JSON.stringify(['resume:v1', credentials.passphrase, payload]))
    .digest('base64url')
}

export function createResumeSession(credentials: ResumeCredentials, now = Date.now()) {
  const expires = Math.floor(now / 1000) + RESUME_SESSION_SECONDS
  const payload = `v1.${expires}.${randomBytes(16).toString('hex')}`
  return `${payload}.${signature(payload, credentials)}`
}

export function validResumeSession(
  token: string | undefined,
  credentials: ResumeCredentials | null,
  now = Date.now(),
) {
  if (!token || !credentials) return false
  const match = /^(v1\.(\d{10})\.[a-f0-9]{32})\.([A-Za-z0-9_-]{43})$/.exec(token)
  if (!match) return false
  const [, payload, expires, supplied] = match
  const seconds = Math.floor(now / 1000)
  if (Number(expires) <= seconds || Number(expires) > seconds + RESUME_SESSION_SECONDS) return false
  return timingSafeEqual(Buffer.from(supplied), Buffer.from(signature(payload, credentials)))
}

export const resumeHeaders = {
  'Cache-Control': 'private, no-store, max-age=0',
  'X-Robots-Tag': 'noindex, nofollow, noarchive, nosnippet',
  // Preserve Origin on native same-origin form POSTs without sending the
  // private page URL to external destinations.
  'Referrer-Policy': 'same-origin',
}
