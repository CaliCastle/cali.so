'use client'

import Image, { type ImageLoader } from 'next/image'
import { useCallback, useEffect, useRef, useState, type MouseEvent } from 'react'
import { createPortal } from 'react-dom'

import { localize, useLocale } from '~/lib/locale-client'

const VIEWPORT_PAD = 32
const DEFAULT_ROOT_FONT_SIZE = 16
const DETAIL_SPACE_REM = 4.5
const MOBILE_DETAIL_SPACE_REM = 7
const MOBILE_BREAKPOINT_REM = 40

type ZoomImageRendition = { src: string; width: number }
type CloseReason = 'escape' | 'overlay' | 'viewport'

function prefersReducedMotion() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
}

function rootFontSizePixels() {
  const rootFontSize = Number.parseFloat(
    window.getComputedStyle(document.documentElement).fontSize,
  )
  return Number.isFinite(rootFontSize) ? rootFontSize : DEFAULT_ROOT_FONT_SIZE
}

interface ZoomImageProps {
  src: string
  alt: string
  width: number
  height: number
  sizes?: string
  className?: string
  style?: React.CSSProperties
  renditions?: ReadonlyArray<ZoomImageRendition>
  expandedContent?: React.ReactNode
}

function largestRendition(
  renditions: ZoomImageProps['renditions'],
) {
  return renditions?.reduce<ZoomImageRendition | undefined>(
    (largest, rendition) =>
      !largest || rendition.width > largest.width ? rendition : largest,
    undefined,
  )
}

function renditionForWidth(
  renditions: ZoomImageProps['renditions'],
  requestedWidth: number,
) {
  return renditions?.reduce<ZoomImageRendition | undefined>(
    (best, rendition) =>
      rendition.width >= requestedWidth &&
      (!best || rendition.width < best.width)
        ? rendition
        : best,
    undefined,
  )
}

// Click-to-zoom for post images: the photo is picked up off the page and
// floats over a dimmed sheet (FLIP, transform-only, interruptible).
// Esc / click / scroll put it back down. Reduced motion swaps instantly.
export function ZoomImage({
  src,
  alt,
  width,
  height,
  sizes,
  className,
  style,
  renditions,
  expandedContent,
}: ZoomImageProps) {
  const locale = useLocale()
  const triggerRef = useRef<HTMLButtonElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const preloadedSrcRef = useRef<string | null>(null)
  const [zoom, setZoom] = useState<{
    expandedSrc: string
    target: { left: number; top: number; width: number; height: number }
    from: string
    motion: 'animated' | 'instant'
  } | null>(null)
  const [state, setState] = useState<'opening' | 'open' | 'closing'>('opening')
  const stateRef = useRef(state)
  useEffect(() => {
    stateRef.current = state
  }, [state])

  const expandedSrc = largestRendition(renditions)?.src ?? src
  // Next Image owns responsive selection and layout, while Bunny remains the
  // encoder/cache layer. Selecting an immutable Rendition here avoids a second
  // quality pass through Next's optimizer.
  const renditionLoader = useCallback<ImageLoader>(
    ({ width: requestedWidth }) =>
      renditionForWidth(renditions, requestedWidth)?.src ?? expandedSrc,
    [expandedSrc, renditions],
  )

  const preloadExpanded = useCallback(() => {
    if (expandedSrc === src || preloadedSrcRef.current === expandedSrc) return
    const preload = document.createElement('img')
    preload.decoding = 'async'
    preload.src = expandedSrc
    preloadedSrcRef.current = expandedSrc
  }, [expandedSrc, src])

  const open = useCallback((event: MouseEvent<HTMLButtonElement>) => {
    const img = triggerRef.current?.querySelector('img')
    if (!img) return
    const rect = img.getBoundingClientRect()

    // Fit within the viewport but never beyond the intrinsic size —
    // zoom means "actual size", not "stretch".
    const maxW = Math.min(window.innerWidth - VIEWPORT_PAD * 2, width)
    const rootFontSize = rootFontSizePixels()
    const detailSpace = expandedContent
      ? (window.innerWidth < MOBILE_BREAKPOINT_REM * rootFontSize
          ? MOBILE_DETAIL_SPACE_REM
          : DETAIL_SPACE_REM) * rootFontSize
      : 0
    const maxH = Math.max(
      1,
      Math.min(
        window.innerHeight - VIEWPORT_PAD * 2 - detailSpace,
        height,
      ),
    )
    const scale = Math.min(maxW / width, maxH / height)
    const w = Math.round(width * scale)
    const h = Math.round(height * scale)
    const target = {
      left: Math.round((window.innerWidth - w) / 2),
      top: Math.round((window.innerHeight - detailSpace - h) / 2),
      width: w,
      height: h,
    }

    // Transform that maps the floating image back onto its inline spot
    const s = rect.width / w
    const tx = rect.left + rect.width / 2 - (target.left + w / 2)
    const ty = rect.top + rect.height / 2 - (target.top + h / 2)
    const reduced = prefersReducedMotion()
    const instant = event.detail === 0 || reduced
    setZoom({
      expandedSrc,
      target,
      from: `translate(${tx}px, ${ty}px) scale(${s})`,
      motion: instant ? 'instant' : 'animated',
    })
    setState(instant ? 'open' : 'opening')
  }, [expandedSrc, width, height, expandedContent])

  const unmount = useCallback(() => {
    setZoom(null)
    setState('opening')
    triggerRef.current?.focus({ preventScroll: true })
  }, [])

  const close = useCallback((reason: CloseReason) => {
    // Nothing to reverse if the enter transition never started, and
    // instant motion never fires transitionend — unmount directly.
    const reduced = prefersReducedMotion()
    if (
      reason === 'escape' ||
      reduced ||
      zoom?.motion === 'instant' ||
      stateRef.current === 'opening'
    ) {
      unmount()
      return
    }
    if (stateRef.current !== 'open') return
    // The page may have moved since open (keyboard scroll, scrollbar drag):
    // re-measure the inline spot so the return flight lands where it now is.
    const img = triggerRef.current?.querySelector('img')
    if (img) {
      const rect = img.getBoundingClientRect()
      setZoom((prev) => {
        if (!prev) return prev
        const s = rect.width / prev.target.width
        const tx = rect.left + rect.width / 2 - (prev.target.left + prev.target.width / 2)
        const ty = rect.top + rect.height / 2 - (prev.target.top + prev.target.height / 2)
        return { ...prev, from: `translate(${tx}px, ${ty}px) scale(${s})` }
      })
    }
    setState('closing')
  }, [unmount, zoom?.motion])

  // Promote opening -> open one frame later so the transform transition runs
  useEffect(() => {
    if (!zoom || state !== 'opening') return
    const raf = requestAnimationFrame(() => requestAnimationFrame(() => setState('open')))
    return () => cancelAnimationFrame(raf)
  }, [zoom, state])

  // Focus the dialog while open; belt-and-braces unmount if the close
  // transition's end event is ever missed.
  useEffect(() => {
    if (zoom && state === 'open') overlayRef.current?.focus({ preventScroll: true })
    if (state !== 'closing') return
    const t = setTimeout(unmount, 450)
    return () => clearTimeout(t)
  }, [zoom, state, unmount])

  useEffect(() => {
    if (!zoom) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        close('escape')
      }
      // image-only dialog: the overlay is the sole focusable — keep Tab inside
      if (e.key === 'Tab') e.preventDefault()
    }
    // A scroll gesture still dismisses the print, but never moves the page:
    // the sheet stays frozen while the photo is up (and through its return
    // flight), so the FLIP landing spot stays honest.
    const onGesture = (e: Event) => {
      e.preventDefault()
      close('viewport')
    }
    // Scrolls that bypass wheel/touch (keyboard, scrollbar drag) still close;
    // close() re-measures the landing spot, so the flight stays correct.
    const scrollPosition = { x: window.scrollX, y: window.scrollY }
    const onScroll = () => {
      if (
        window.scrollX === scrollPosition.x &&
        window.scrollY === scrollPosition.y
      ) {
        return
      }
      close('viewport')
    }
    const onResize = () => close('viewport')
    window.addEventListener('keydown', onKey)
    window.addEventListener('wheel', onGesture, { passive: false })
    window.addEventListener('touchmove', onGesture, { passive: false })
    window.addEventListener('scroll', onScroll)
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('wheel', onGesture)
      window.removeEventListener('touchmove', onGesture)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
    }
  }, [zoom, close])

  const settle = () => {
    if (stateRef.current === 'closing') unmount()
  }

  const floating = state === 'open'

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="zoom-trigger"
        style={style}
        aria-label={
          alt
            ? localize(locale, `放大图片：${alt}`, `Zoom image: ${alt}`)
            : localize(locale, '放大图片', 'Zoom image')
        }
        data-zoomed={zoom ? '' : undefined}
        onPointerEnter={preloadExpanded}
        onFocus={preloadExpanded}
        onClick={open}
      >
        <Image
          loader={renditions ? renditionLoader : undefined}
          src={src}
          alt={alt}
          width={width}
          height={height}
          sizes={sizes}
          className={className}
        />
      </button>
      {zoom &&
        createPortal(
          <div
            ref={overlayRef}
            tabIndex={-1}
            className="zoom-overlay"
            data-state={floating ? 'open' : state}
            data-motion={zoom.motion}
            role="dialog"
            aria-modal="true"
            aria-label={alt || localize(locale, '图片', 'Image')}
            onClick={() => close('overlay')}
          >
            <div className="zoom-overlay-backdrop" />
            <Image
              unoptimized
              src={zoom.expandedSrc}
              alt={alt}
              width={width}
              height={height}
              loading="eager"
              fetchPriority="high"
              style={{
                left: zoom.target.left,
                top: zoom.target.top,
                width: zoom.target.width,
                height: zoom.target.height,
                transform: floating ? 'none' : zoom.from,
              }}
              onTransitionEnd={settle}
            />
            <div
              aria-hidden
              className="zoom-overlay-marks calibration-corners"
              style={
                {
                  left: zoom.target.left - 10,
                  top: zoom.target.top - 10,
                  width: zoom.target.width + 20,
                  height: zoom.target.height + 20,
                  '--corner-arm': '11px',
                } as React.CSSProperties
              }
            />
            {expandedContent && (
              <div className="zoom-overlay-details">{expandedContent}</div>
            )}
          </div>,
          document.body,
        )}
    </>
  )
}
