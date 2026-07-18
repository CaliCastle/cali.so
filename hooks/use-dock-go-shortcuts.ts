'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef } from 'react'

import { localePath, type Locale } from '~/lib/locale-route'
import { playDockSound } from '~/lib/sound'

export const GO_TIMEOUT_MS = 1000

/** G then <key> → unlocalized dock route (GitHub-style). */
export const DOCK_GO_SHORTCUTS: Record<string, string> = {
  h: '/',
  w: '/blog',
  p: '/photos',
  j: '/projects',
  a: '/ama',
}

/**
 * G then D → the owner admin. Not part of DOCK_GO_SHORTCUTS: the chord is
 * armed only after the owner probe confirms the session, and /admin is an
 * unlocalized route (the admin restores its locale in place).
 */
export const ADMIN_GO_SHORTCUT = { key: 'd', href: '/admin' } as const

/** G then <key> inside the owner admin; S returns to the public site. */
export const ADMIN_GO_SHORTCUTS: Record<string, string> = {
  o: '/admin',
  a: '/admin/ama',
  m: '/admin/media',
  p: '/admin/photos',
  s: '/',
}

/** Uppercase second key for an unlocalized dock href, e.g. `/blog` → `"W"`. */
export function dockGoKeyFor(href: string): string | undefined {
  const entry = Object.entries(DOCK_GO_SHORTCUTS).find(([, path]) => path === href)
  return entry?.[0]?.toUpperCase()
}

/** Uppercase second key for an owner-admin dock href, e.g. `/admin/media` → `"M"`. */
export function adminGoKeyFor(href: string): string | undefined {
  const entry = Object.entries(ADMIN_GO_SHORTCUTS).find(([, path]) => path === href)
  return entry?.[0]?.toUpperCase()
}

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  return (
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT' ||
    target.isContentEditable
  )
}

type GoTarget = { href: string; localize: boolean }

/**
 * The chord machine both docks share: press G, then a second key within the
 * window; `resolve` maps that key to a destination (or ignores it). Escape
 * or the timeout cancels; typing contexts and modified keys never chord.
 */
function useGoChords({
  locale,
  activeHref,
  onNavigate,
  resolve,
}: {
  locale: Locale
  activeHref: string | undefined
  onNavigate?: (href: string, keyboardInitiated: boolean) => void
  resolve: (key: string) => GoTarget | undefined
}) {
  const router = useRouter()
  const pendingGoRef = useRef(false)
  const timeoutRef = useRef<number | null>(null)
  const localeRef = useRef(locale)
  const activeHrefRef = useRef(activeHref)
  const onNavigateRef = useRef(onNavigate)
  const resolveRef = useRef(resolve)

  localeRef.current = locale
  activeHrefRef.current = activeHref
  onNavigateRef.current = onNavigate
  resolveRef.current = resolve

  useEffect(() => {
    function clearPending() {
      pendingGoRef.current = false
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }

    function armGo() {
      pendingGoRef.current = true
      if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current)
      timeoutRef.current = window.setTimeout(clearPending, GO_TIMEOUT_MS)
    }

    function goTo(target: GoTarget) {
      const destination = target.localize
        ? localePath(localeRef.current, target.href)
        : target.href
      const isActive = activeHrefRef.current === target.href
      onNavigateRef.current?.(target.href, true)
      if (!isActive) playDockSound()
      router.push(destination)
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) {
        clearPending()
        return
      }
      if (event.repeat) return
      if (isTypingTarget(event.target)) {
        clearPending()
        return
      }

      const key = event.key.length === 1 ? event.key.toLowerCase() : event.key

      if (!pendingGoRef.current) {
        if (key === 'g') {
          event.preventDefault()
          armGo()
        }
        return
      }

      if (key === 'Escape') {
        event.preventDefault()
        clearPending()
        return
      }

      if (key === 'g') {
        event.preventDefault()
        armGo()
        return
      }

      const target = resolveRef.current(key)
      clearPending()
      if (!target) return

      event.preventDefault()
      goTo(target)
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      clearPending()
    }
  }, [router])
}

/**
 * Global chord shortcuts for the public dock: press G, then H / W / P / J /
 * A within a short window to jump Home / Writing / Photos / Projects / AMA
 * — plus D to the admin once the owner probe confirms.
 */
export function useDockGoShortcuts({
  locale,
  activeHref,
  onNavigate,
  ownerAdmin = false,
}: {
  locale: Locale
  activeHref: string | undefined
  onNavigate?: (href: string, keyboardInitiated: boolean) => void
  /** Arms G then D → /admin once the owner probe has confirmed the session. */
  ownerAdmin?: boolean
}) {
  const ownerAdminRef = useRef(ownerAdmin)
  ownerAdminRef.current = ownerAdmin

  useGoChords({
    locale,
    activeHref,
    onNavigate,
    resolve(key) {
      if (ownerAdminRef.current && key === ADMIN_GO_SHORTCUT.key) {
        return { href: ADMIN_GO_SHORTCUT.href, localize: false }
      }
      const href = DOCK_GO_SHORTCUTS[key]
      return href ? { href, localize: true } : undefined
    },
  })
}

/**
 * Chord shortcuts for the owner dock: G then O / A / M / P for the admin
 * surfaces, G then S back to the public site (the one localized hop).
 */
export function useAdminGoShortcuts({
  locale,
  activeHref,
  onNavigate,
}: {
  locale: Locale
  activeHref: string | undefined
  onNavigate?: (href: string, keyboardInitiated: boolean) => void
}) {
  useGoChords({
    locale,
    activeHref,
    onNavigate,
    resolve(key) {
      const href = ADMIN_GO_SHORTCUTS[key]
      return href ? { href, localize: href === '/' } : undefined
    },
  })
}
