import 'server-only'

import { NextResponse } from 'next/server'

import { checkBrowserMutationRequest } from '~/lib/ama/security/request-policy'
import type { PublicRequestGuard } from '~/lib/ama/booking/http'
import { localePath } from '~/lib/locale-route'

import {
  createResumeSession,
  matchesPassphrase,
  RESUME_COOKIE,
  RESUME_SESSION_SECONDS,
  resumeHeaders,
  type ResumeCredentials,
} from './access'

type Dependencies = {
  baseUrl: URL
  credentials: ResumeCredentials | null
  guard: PublicRequestGuard
}

// Stream a small, URL-encoded form with a hard limit, even without Content-Length.
async function readForm(request: Request) {
  if (request.headers.get('content-type')?.split(';')[0] !== 'application/x-www-form-urlencoded') return null
  const reader = request.body?.getReader()
  if (!reader) return null
  const chunks: Uint8Array[] = []
  let size = 0
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > 4096) {
        await reader.cancel()
        return null
      }
      chunks.push(value)
    }
    return new URLSearchParams(Buffer.concat(chunks).toString('utf8'))
  } catch {
    return null
  } finally {
    reader.releaseLock()
  }
}

function redirectToResume(baseUrl: URL, form: URLSearchParams, error?: string) {
  const locale = form.get('locale') === 'en' ? 'en' : 'zh'
  const destination = new URL(localePath(locale, '/resume'), baseUrl)
  if (error) destination.searchParams.set('access', error)
  return NextResponse.redirect(destination, { status: 303, headers: resumeHeaders })
}

export function createResumeHandlers({ baseUrl, credentials, guard }: Dependencies) {
  const cookieOptions = {
    httpOnly: true,
    secure: baseUrl.protocol === 'https:',
    sameSite: 'lax' as const,
    path: '/',
  }

  return {
    async unlock(request: Request) {
      if (checkBrowserMutationRequest(request, baseUrl)) {
        return new Response(null, { status: 403, headers: resumeHeaders })
      }
      // Rate-limit before reading or comparing any attacker-controlled input.
      const blocked = await guard.check(request)
      const form = await readForm(request)
      if (!form) return new Response(null, { status: 400, headers: resumeHeaders })
      if (blocked) {
        const response = redirectToResume(baseUrl, form, blocked.status === 429 ? 'limited' : 'unavailable')
        const retry = blocked.headers.get('retry-after')
        if (retry) response.headers.set('retry-after', retry)
        return response
      }
      if (!credentials) return redirectToResume(baseUrl, form, 'unavailable')
      const passphrase = form.get('passphrase') ?? ''
      if (passphrase.length > 256 || !matchesPassphrase(passphrase, credentials)) {
        return redirectToResume(baseUrl, form, 'incorrect')
      }
      const response = redirectToResume(baseUrl, form)
      response.cookies.set(RESUME_COOKIE, createResumeSession(credentials), {
        ...cookieOptions,
        maxAge: RESUME_SESSION_SECONDS,
      })
      return response
    },

    async lock(request: Request) {
      if (checkBrowserMutationRequest(request, baseUrl)) {
        return new Response(null, { status: 403, headers: resumeHeaders })
      }
      const form = await readForm(request)
      if (!form) return new Response(null, { status: 400, headers: resumeHeaders })
      const response = redirectToResume(baseUrl, form)
      response.cookies.set(RESUME_COOKIE, '', { ...cookieOptions, maxAge: 0 })
      return response
    },
  }
}
