'use client'

import dynamic from 'next/dynamic'
import { useCallback, useEffect, useRef, useState } from 'react'

const PortraitShaderField = dynamic(
  () => import('./portrait-shader-field').then((module) => module.PortraitShaderField),
  { ssr: false },
)

const EXIT_MS = 320
const TOUCH_REVEAL_MS = 2600

type WebGpuNavigator = Navigator & {
  gpu?: {
    requestAdapter: () => Promise<unknown | null>
  }
}

export function PortraitHiddenStage({
  children,
  label,
}: Readonly<{
  children: React.ReactNode
  label: string
}>) {
  const [active, setActive] = useState(false)
  const [motionEnabled, setMotionEnabled] = useState(false)
  const [shaderMounted, setShaderMounted] = useState(false)
  const exitTimer = useRef<number | undefined>(undefined)
  const touchTimer = useRef<number | undefined>(undefined)
  const pointerType = useRef<string | null>(null)
  const pointerFocusSuppressed = useRef(false)
  const hovered = useRef(false)
  const keyboardFocused = useRef(false)
  const touchActive = useRef(false)
  const animatedRef = useRef(false)
  const mounted = useRef(true)
  const reducedMotion = useRef(false)
  const webGpuSupported = useRef<boolean | null>(null)
  const webGpuRequest = useRef<Promise<boolean> | null>(null)

  const clearExitTimer = useCallback(() => {
    if (exitTimer.current !== undefined) window.clearTimeout(exitTimer.current)
    exitTimer.current = undefined
  }, [])

  const clearTouchTimer = useCallback(() => {
    if (touchTimer.current !== undefined) window.clearTimeout(touchTimer.current)
    touchTimer.current = undefined
  }, [])

  const checkWebGpu = useCallback(() => {
    if (webGpuSupported.current !== null) {
      return Promise.resolve(webGpuSupported.current)
    }

    if (webGpuRequest.current === null) {
      const gpu = (navigator as WebGpuNavigator).gpu
      webGpuRequest.current = (async () => {
        if (!gpu?.requestAdapter) return false
        try {
          return Boolean(await gpu.requestAdapter())
        } catch {
          return false
        }
      })().then((supported) => {
        webGpuSupported.current = supported
        return supported
      })
    }

    return webGpuRequest.current
  }, [])

  const syncStage = useCallback(() => {
    const nextActive = hovered.current || keyboardFocused.current || touchActive.current
    const wantsAnimation =
      nextActive && !reducedMotion.current && (hovered.current || touchActive.current)
    const nextAnimated = wantsAnimation && webGpuSupported.current === true
    const wasAnimated = animatedRef.current

    animatedRef.current = nextAnimated

    if (wantsAnimation && webGpuSupported.current === null) {
      clearExitTimer()
      setActive(keyboardFocused.current)
      setMotionEnabled(false)
      setShaderMounted(false)

      void checkWebGpu().then((supported) => {
        if (!mounted.current) return

        const stillActive = hovered.current || keyboardFocused.current || touchActive.current
        const canAnimate =
          supported &&
          stillActive &&
          !reducedMotion.current &&
          (hovered.current || touchActive.current)

        animatedRef.current = canAnimate
        setActive(stillActive)
        setMotionEnabled(canAnimate)
        setShaderMounted(canAnimate)
      })
      return
    }

    setActive(nextActive)

    if (!nextActive) {
      if (exitTimer.current !== undefined && !reducedMotion.current) return

      clearExitTimer()
      if (!wasAnimated || reducedMotion.current) {
        setShaderMounted(false)
        setMotionEnabled(false)
        return
      }

      setMotionEnabled(true)
      exitTimer.current = window.setTimeout(() => {
        setShaderMounted(false)
        setMotionEnabled(false)
      }, EXIT_MS)
      return
    }

    clearExitTimer()
    setMotionEnabled(nextAnimated)

    if (!nextAnimated) {
      setShaderMounted(false)
      return
    }

    setShaderMounted(true)
  }, [checkWebGpu, clearExitTimer])

  const revealForTouch = useCallback(() => {
    clearTouchTimer()
    if (touchActive.current) {
      touchActive.current = false
      syncStage()
      return
    }

    touchActive.current = true
    syncStage()
    touchTimer.current = window.setTimeout(() => {
      touchActive.current = false
      pointerFocusSuppressed.current = false
      syncStage()
    }, TOUCH_REVEAL_MS)
  }, [clearTouchTimer, syncStage])

  const markShaderUnavailable = useCallback(() => {
    webGpuSupported.current = false
    animatedRef.current = false
    setShaderMounted(false)
    setMotionEnabled(false)
  }, [])

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updatePreference = () => {
      reducedMotion.current = preference.matches
      syncStage()
    }

    updatePreference()
    preference.addEventListener('change', updatePreference)
    return () => preference.removeEventListener('change', updatePreference)
  }, [syncStage])

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      animatedRef.current = false
      clearExitTimer()
      clearTouchTimer()
    }
  }, [clearExitTimer, clearTouchTimer])

  return (
    <span
      data-portrait-stage
      data-active={active ? 'true' : 'false'}
      data-motion={motionEnabled ? 'true' : 'false'}
    >
      <span className="portrait-hidden-stage-field" aria-hidden>
        <svg
          data-hidden-stage-fallback
          className="portrait-hidden-stage-fallback"
          viewBox="0 0 120 120"
          fill="none"
        >
          <path d="M15 72C8 49 23 23 48 14c24-8 52 2 62 25 9 21 1 49-19 62-21 14-53 10-68-9-5-6-7-13-8-20Z" />
          <path d="M24 68c-4-18 8-38 26-45 19-7 41 1 50 18 8 17 1 38-15 48-17 11-41 8-53-7-4-4-6-9-8-14Z" />
          <path d="M34 65c-2-13 6-27 19-32 14-5 31 1 37 13 6 12 1 27-11 35-12 8-29 6-38-5-3-3-5-7-7-11Z" />
          <path d="M44 61c0-8 5-17 13-20 9-3 19 1 23 9 3 7 0 16-7 21-8 5-18 3-24-3-3-2-4-4-5-7Z" />
          <path d="M53 58c1-4 4-8 8-9 5-2 10 0 12 4 2 4 0 9-4 11-4 3-10 2-13-1-2-1-3-3-3-5Z" />
        </svg>
        {shaderMounted && (
          <span className="portrait-hidden-stage-shader" data-shader-stage>
            <PortraitShaderField onUnavailable={markShaderUnavailable} />
          </span>
        )}
      </span>

      <button
        type="button"
        className="portrait-hidden-stage-trigger"
        aria-label={label}
        onPointerEnter={(event) => {
          if (event.pointerType === 'mouse') {
            hovered.current = true
            syncStage()
          }
        }}
        onPointerDown={(event) => {
          pointerType.current = event.pointerType
          pointerFocusSuppressed.current = event.pointerType !== 'mouse'
        }}
        onPointerLeave={(event) => {
          if (event.pointerType === 'mouse') {
            hovered.current = false
            syncStage()
          }
        }}
        onPointerUp={(event) => {
          if (event.pointerType !== 'mouse') revealForTouch()
          pointerType.current = null
        }}
        onPointerCancel={() => {
          pointerType.current = null
          pointerFocusSuppressed.current = false
        }}
        onFocus={() => {
          if (pointerType.current === null && !pointerFocusSuppressed.current) {
            keyboardFocused.current = true
            syncStage()
          }
        }}
        onKeyDown={() => {
          if (pointerFocusSuppressed.current) {
            pointerFocusSuppressed.current = false
            keyboardFocused.current = true
            syncStage()
          }
        }}
        onBlur={() => {
          pointerFocusSuppressed.current = false
          keyboardFocused.current = false
          syncStage()
        }}
      >
        {children}
      </button>
    </span>
  )
}
