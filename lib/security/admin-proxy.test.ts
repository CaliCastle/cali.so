import { clerkMiddleware } from '@clerk/nextjs/server'
import { NextRequest } from 'next/server'
import type { NextFetchEvent } from 'next/server'
import { afterAll, describe, expect, it, vi } from 'vitest'

const previousClerkEnvironment = vi.hoisted(() => {
  const previous = {
    encryptionKey: process.env.CLERK_ENCRYPTION_KEY,
    publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    secretKey: process.env.CLERK_SECRET_KEY,
  }
  process.env.CLERK_SECRET_KEY = 'sk_live_ci_secret_not_real'
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY =
    'pk_live_Y2xlcmsuY2FsaS5zbyQ'
  process.env.CLERK_ENCRYPTION_KEY = 'ci-clerk-middleware-encryption-key'
  return previous
})

import { siteProxy } from '../../proxy'
import { securityHeaders } from './headers'

const throughRealClerkMiddleware = clerkMiddleware((_auth, request) =>
  siteProxy(request),
)

const event = {
  passThroughOnException() {},
  waitUntil() {},
} as unknown as NextFetchEvent

afterAll(() => {
  for (const [name, value] of [
    ['CLERK_ENCRYPTION_KEY', previousClerkEnvironment.encryptionKey],
    [
      'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
      previousClerkEnvironment.publishableKey,
    ],
    ['CLERK_SECRET_KEY', previousClerkEnvironment.secretKey],
  ] as const) {
    if (value === undefined) delete process.env[name]
    else process.env[name] = value
  }
})

describe('admin CSP', () => {
  // The per-request nonce policy was retired in July 2026: nonces require
  // dynamic rendering, which is incompatible with the admin's prerendered
  // instant-navigation shells. Admin pages rely on the static site policy
  // configured in next.config.
  it('stamps no per-request policy in the proxy', () => {
    const response = siteProxy(new NextRequest('https://cali.so/admin/media'))

    expect(response.headers.get('content-security-policy')).toBeNull()
    expect(response.headers.get('x-middleware-request-x-nonce')).toBeNull()
  })

  it('keeps the static site policy strict and nonce-free', () => {
    const policy = securityHeaders.find(
      ({ key }) => key === 'Content-Security-Policy',
    )?.value

    expect(policy).toContain("script-src 'self' 'unsafe-inline'")
    expect(policy).toContain("frame-src 'none'")
    expect(policy).toContain("object-src 'none'")
    expect(policy).not.toContain('nonce-')
    expect(policy).not.toContain('strict-dynamic')
  })

  it('passes admin requests through the real Clerk middleware unchanged', async () => {
    const response = await throughRealClerkMiddleware(
      new NextRequest('https://cali.so/admin/photos'),
      event,
    )

    expect(response?.headers.get('content-security-policy')).toBeNull()
  })
})
