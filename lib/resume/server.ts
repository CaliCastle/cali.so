import 'server-only'

import { cookies } from 'next/headers'

import { createPublicRequestGuard } from '~/lib/ama/booking/http'
import { getServerEnv } from '~/lib/ama/server-env'
import { createRateLimiter } from '~/lib/rate-limit/server'

import { RESUME_COOKIE, resumeCredentials, validResumeSession } from './access'
import { createResumeHandlers } from './http'

let guard: ReturnType<typeof createPublicRequestGuard> | undefined

export async function hasResumeAccess() {
  const token = (await cookies()).get(RESUME_COOKIE)?.value
  return validResumeSession(token, resumeCredentials())
}

export function getResumeHandlers() {
  const environment = getServerEnv()
  guard ??= createPublicRequestGuard({
    baseUrl: environment.browserMutationBaseUrl,
    pseudonymKey: Buffer.from(environment.RATE_LIMIT_HASH_KEY, 'base64'),
    rateLimiter: createRateLimiter(environment.rateLimitBackend, {
      prefix: 'cali:resume:unlock',
      maxRequests: 5,
      windowSeconds: 15 * 60,
    }),
    retryAfterSeconds: 15 * 60,
  })
  return createResumeHandlers({
    baseUrl: environment.browserMutationBaseUrl,
    credentials: resumeCredentials(),
    guard,
  })
}
