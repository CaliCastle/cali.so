import 'server-only'

import { createHmac, randomBytes, scrypt, timingSafeEqual } from 'node:crypto'

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

function deriveKey(passphrase: string, secret: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(passphrase, secret, 32, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }, (error, key) => {
      if (error) reject(error)
      else resolve(key)
    })
  })
}

// Cache only the configured key, never submitted passphrases. Credential
// rotation replaces the single entry and invalidates existing sessions.
let cachedKey: (ResumeCredentials & { key: Promise<Buffer> }) | undefined

function credentialKey(credentials: ResumeCredentials) {
  if (cachedKey?.passphrase !== credentials.passphrase || cachedKey?.secret !== credentials.secret) {
    cachedKey = { ...credentials, key: deriveKey(credentials.passphrase, credentials.secret) }
  }
  return cachedKey.key
}

// Keep untrusted scrypt work bounded across client identities. Reject excess
// attempts without a queue so other requests can still use the crypto pool.
let activeVerifications = 0
const MAX_ACTIVE_VERIFICATIONS = 2

export async function matchesPassphrase(value: string, credentials: ResumeCredentials) {
  if (activeVerifications >= MAX_ACTIVE_VERIFICATIONS) {
    throw new Error('Resume passphrase verification is busy')
  }
  activeVerifications++
  try {
    // Finish the single cached derivation before starting submitted work.
    const expected = await credentialKey(credentials)
    const supplied = await deriveKey(value, credentials.secret)
    return timingSafeEqual(supplied, expected)
  } finally {
    activeVerifications--
  }
}

async function signature(payload: string, credentials: ResumeCredentials) {
  return createHmac('sha256', await credentialKey(credentials))
    .update(JSON.stringify(['resume:v1', payload]))
    .digest('base64url')
}

export async function createResumeSession(credentials: ResumeCredentials, now = Date.now()) {
  const expires = Math.floor(now / 1000) + RESUME_SESSION_SECONDS
  const payload = `v1.${expires}.${randomBytes(16).toString('hex')}`
  return `${payload}.${await signature(payload, credentials)}`
}

export async function validResumeSession(
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
  return timingSafeEqual(Buffer.from(supplied), Buffer.from(await signature(payload, credentials)))
}

export const resumeHeaders = {
  'Cache-Control': 'private, no-store, max-age=0',
  'X-Robots-Tag': 'noindex, nofollow, noarchive, nosnippet',
  // Preserve Origin on native same-origin form POSTs without sending the
  // private page URL to external destinations.
  'Referrer-Policy': 'same-origin',
}
