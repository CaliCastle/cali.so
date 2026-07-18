'use client'

import { animate, stagger } from 'motion'
import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { flushSync } from 'react-dom'

import type { PostRailNode } from '~/lib/content'
import { localize, useLocale } from '~/lib/locale-client'
import { localePath } from '~/lib/locale-route'

const DESKTOP_QUERY = '(min-width: 64rem)'
const DESKTOP_EXIT_DURATION = 0.2
const DESKTOP_EXIT_STAGGER_WINDOW = 0.06
const EASE_SWIFT = [0.2, 0.8, 0.2, 1] as const
const PHONE_ENTER_STAGGER_WINDOW = 0.1
const PHONE_EXIT_STAGGER_WINDOW = 0.1
const PHONE_ISLAND_ENTER_DURATION = 0.28
const PHONE_ISLAND_EXIT_DURATION = 0.26
const PHONE_ISLAND_HIDDEN_TRANSFORM = 'translate(-50%, -16px) scale(0.96)'
const PHONE_ISLAND_VISIBLE_TRANSFORM = 'translate(-50%, 0px) scale(1)'
const PHONE_NODE_ENTER_DURATION = 0.18
const PHONE_NODE_EXIT_DURATION = 0.16
const PHONE_NODE_HIDDEN_FILTER = 'blur(2px)'
const PHONE_PANEL_ENTER_DURATION = 0.28
const PHONE_PANEL_EXIT_DURATION = 0.26
const PHONE_PANEL_HIDDEN_TRANSFORM = 'translateY(-12px) scale(0.96)'
const PHONE_PANEL_VISIBLE_TRANSFORM = 'translateY(0px) scale(1)'
const PHONE_QUERY = '(max-width: 39.99rem)'
const TARGET_OFFSET = 100
const RAIL_ID = 'post-document-minimap'

function getReadingTop(target: HTMLElement) {
  const rectTop = target.getBoundingClientRect().top
  const transform = window.getComputedStyle(target).transform
  if (transform === 'none') return rectTop

  // RevealScope gives unread prose a temporary 5px translate. Navigation and
  // scroll-spy should use the heading's settled layout position instead.
  return rectTop - new DOMMatrixReadOnly(transform).m42
}

function WayfindingArrow({ direction }: { direction: 'back' | 'top' }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="12"
      height="12"
      viewBox="0 0 12 12"
      aria-hidden
    >
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {direction === 'back' ? (
          <>
            <path
              d="m1.25,5.25h7c1.381,0,2.5,1.119,2.5,2.5h0c0,1.381-1.119,2.5-2.5,2.5h-1.25"
            />
            <polyline points="4.25 8.5 1 5.25 4.25 2" />
          </>
        ) : (
          <>
            <path
              d="M11.25 6C11.25 3.1005 8.89949 0.75 6 0.75C3.1005 0.75 0.75 3.10051 0.75 6"
            />
            <path d="M6 11.25L6 3.75" />
            <path d="M3.75 6L6 3.75L8.25 6" />
          </>
        )}
      </g>
    </svg>
  )
}

export function PostToc({ nodes, nodesEn }: { nodes: PostRailNode[]; nodesEn: PostRailNode[] }) {
  const locale = useLocale()
  const localizedNodes = locale === 'en' ? nodesEn : nodes
  const landmarks = useMemo(
    () =>
      localizedNodes.filter(
        (node): node is Extract<PostRailNode, { kind: 'landmark' }> => node.kind === 'landmark',
      ),
    [localizedNodes],
  )
  const phoneNodes = useMemo(() => {
    const firstHeading = localizedNodes.findIndex(
      (node) => node.kind === 'landmark' && node.variant === 'heading',
    )
    return firstHeading > 0 ? localizedNodes.slice(firstHeading) : localizedNodes
  }, [localizedNodes])
  const [open, setOpen] = useState(false)
  const [desktop, setDesktop] = useState(false)
  const [phone, setPhone] = useState(false)
  const [phoneQueryReady, setPhoneQueryReady] = useState(false)
  const [phoneIslandVisible, setPhoneIslandVisible] = useState(false)
  const [backToTopVisible, setBackToTopVisible] = useState(false)
  const [active, setActive] = useState(landmarks[0]?.id)
  const activeRef = useRef(active)
  const islandRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLElement>(null)
  const progressCircleRef = useRef<SVGCircleElement>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const toggleRef = useRef<HTMLButtonElement>(null)
  const islandAnimationRef = useRef<ReturnType<typeof animate> | null>(null)
  const nodeAnimationRef = useRef<ReturnType<typeof animate> | null>(null)
  const panelAnimationRef = useRef<ReturnType<typeof animate> | null>(null)
  const desktopEntrancePlayedRef = useRef(false)
  const phoneIslandInitializedRef = useRef(false)

  useEffect(() => {
    activeRef.current = active
  }, [active])

  useEffect(() => {
    const first = landmarks[0]?.id
    activeRef.current = first
    setActive(first)
  }, [landmarks])

  function animateOpenState(nextOpen: boolean) {
    if (nextOpen === open) return

    const items = rootRef.current?.querySelectorAll<HTMLElement>('.post-minimap-node')
    const panel = panelRef.current
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (reducedMotion) {
      nodeAnimationRef.current?.cancel()
      nodeAnimationRef.current = null
      panelAnimationRef.current?.cancel()
      panelAnimationRef.current = null
      for (const item of items ?? []) {
        item.style.removeProperty('filter')
        item.style.removeProperty('opacity')
        item.style.removeProperty('transform')
      }
      panel?.style.removeProperty('opacity')
      panel?.style.removeProperty('transform')
      panel?.style.removeProperty('will-change')
      setOpen(nextOpen)
      return
    }

    nodeAnimationRef.current?.stop()
    panelAnimationRef.current?.stop()
    if (!items?.length) {
      nodeAnimationRef.current = null
      panelAnimationRef.current = null
      setOpen(nextOpen)
      return
    }

    const closingDesktop = desktop && !nextOpen
    const furthestCenterIndex = Math.ceil((items.length - 1) / 2)
    const desktopExitStagger =
      furthestCenterIndex > 0
        ? Math.min(0.01, DESKTOP_EXIT_STAGGER_WINDOW / furthestCenterIndex)
        : 0
    const phoneStaggerWindow = nextOpen
      ? PHONE_ENTER_STAGGER_WINDOW
      : PHONE_EXIT_STAGGER_WINDOW
    const phoneFurthestIndex = items.length - 1
    const phoneStagger =
      phoneFurthestIndex > 0 ? phoneStaggerWindow / phoneFurthestIndex : 0

    // Motion otherwise resolves the first open against the incoming React
    // state, so phone items jump directly to their final styles. Pinning the
    // rendered frame also keeps rapid direction changes interruptible.
    for (const item of items) {
      const style = window.getComputedStyle(item)
      if (phone) item.style.filter = style.filter
      item.style.opacity = style.opacity
      item.style.transform = style.transform
    }
    if (phone && panel) {
      const style = window.getComputedStyle(panel)
      panel.style.opacity = style.opacity
      panel.style.transform = style.transform
      panel.style.willChange = 'transform, opacity'
    }

    flushSync(() => setOpen(nextOpen))

    if (phone && panel) {
      const panelAnimation = animate(
        panel,
        {
          opacity: nextOpen ? 1 : 0,
          transform: nextOpen ? PHONE_PANEL_VISIBLE_TRANSFORM : PHONE_PANEL_HIDDEN_TRANSFORM,
        },
        {
          duration: nextOpen ? PHONE_PANEL_ENTER_DURATION : PHONE_PANEL_EXIT_DURATION,
          ease: EASE_SWIFT,
        },
      )
      panelAnimationRef.current = panelAnimation
      void panelAnimation.finished
        .then(() => {
          if (panelAnimationRef.current !== panelAnimation) return
          panelAnimation.cancel()
          panelAnimationRef.current = null
          panel.style.removeProperty('opacity')
          panel.style.removeProperty('transform')
          panel.style.removeProperty('will-change')
        })
        .catch(() => undefined)
    }

    const itemTransform = nextOpen
      ? 'translateY(0) rotate(0deg)'
      : 'translateY(-8px) rotate(2deg)'
    const itemKeyframes = phone
      ? {
          filter: nextOpen ? 'blur(0px)' : PHONE_NODE_HIDDEN_FILTER,
          opacity: nextOpen ? 1 : 0,
          transform: itemTransform,
        }
      : {
          opacity: nextOpen ? 1 : 0,
          transform: itemTransform,
        }
    const animation = animate(
      items,
      itemKeyframes,
      {
        duration: closingDesktop
          ? DESKTOP_EXIT_DURATION
          : phone
            ? nextOpen
              ? PHONE_NODE_ENTER_DURATION
              : PHONE_NODE_EXIT_DURATION
            : nextOpen
              ? 0.26
              : 0.2,
        delay: stagger(
          closingDesktop ? desktopExitStagger : phone ? phoneStagger : nextOpen ? 0.012 : 0.01,
          { from: phone ? (nextOpen ? 'first' : 'last') : 'center' },
        ),
        ease: EASE_SWIFT,
      },
    )
    nodeAnimationRef.current = animation

    void animation.finished
      .then(() => {
        if (nodeAnimationRef.current !== animation) return
        animation.cancel()
        nodeAnimationRef.current = null
        for (const item of items) {
          item.style.removeProperty('filter')
          item.style.removeProperty('opacity')
          item.style.removeProperty('transform')
        }
      })
      .catch(() => undefined)
  }

  useEffect(
    () => () => {
      islandAnimationRef.current?.stop()
      nodeAnimationRef.current?.stop()
      panelAnimationRef.current?.stop()
    },
    [],
  )

  useEffect(() => {
    const query = window.matchMedia(DESKTOP_QUERY)
    let frame = 0
    const sync = () => {
      setDesktop(query.matches)

      if (query.matches && !desktopEntrancePlayedRef.current) {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          desktopEntrancePlayedRef.current = true
          setOpen(true)
          return
        }

        if (frame) window.cancelAnimationFrame(frame)
        frame = window.requestAnimationFrame(() => {
          frame = 0
          desktopEntrancePlayedRef.current = true
          animateOpenState(true)
        })
        return
      }

      setOpen(query.matches)
    }
    sync()
    query.addEventListener('change', sync)
    return () => {
      query.removeEventListener('change', sync)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [])

  useEffect(() => {
    const query = window.matchMedia(PHONE_QUERY)
    const sync = () => {
      setPhone(query.matches)
      setPhoneQueryReady(true)
    }
    sync()
    query.addEventListener('change', sync)
    return () => query.removeEventListener('change', sync)
  }, [])

  useEffect(() => {
    const island = islandRef.current
    if (!phoneQueryReady || !island) return

    if (!phone) {
      islandAnimationRef.current?.stop()
      islandAnimationRef.current = null
      phoneIslandInitializedRef.current = false
      island.style.removeProperty('opacity')
      island.style.removeProperty('transform')
      island.style.removeProperty('will-change')
      panelAnimationRef.current?.stop()
      panelAnimationRef.current = null
      panelRef.current?.style.removeProperty('opacity')
      panelRef.current?.style.removeProperty('transform')
      panelRef.current?.style.removeProperty('will-change')
      return
    }

    islandAnimationRef.current?.stop()
    const visible = phoneIslandVisible
    const targetOpacity = visible ? '1' : '0'
    const targetTransform = visible
      ? PHONE_ISLAND_VISIBLE_TRANSFORM
      : PHONE_ISLAND_HIDDEN_TRANSFORM
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (!phoneIslandInitializedRef.current) {
      phoneIslandInitializedRef.current = true
      island.style.opacity = '0'
      island.style.transform = PHONE_ISLAND_HIDDEN_TRANSFORM
      if (!visible && !reducedMotion) return
    } else {
      const style = window.getComputedStyle(island)
      island.style.opacity = style.opacity
      island.style.transform = style.transform
    }

    if (reducedMotion) {
      islandAnimationRef.current = null
      island.style.opacity = targetOpacity
      island.style.transform = targetTransform
      island.style.removeProperty('will-change')
      return
    }

    island.style.willChange = 'transform, opacity'
    const animation = animate(
      island,
      { opacity: visible ? 1 : 0, transform: targetTransform },
      {
        duration: visible
          ? PHONE_ISLAND_ENTER_DURATION
          : PHONE_ISLAND_EXIT_DURATION,
        ease: EASE_SWIFT,
      },
    )
    islandAnimationRef.current = animation
    void animation.finished
      .then(() => {
        if (islandAnimationRef.current !== animation) return
        animation.cancel()
        islandAnimationRef.current = null
        island.style.opacity = targetOpacity
        island.style.transform = targetTransform
        island.style.removeProperty('will-change')
      })
      .catch(() => undefined)
  }, [phone, phoneIslandVisible, phoneQueryReady])

  useEffect(() => {
    if (!open || desktop) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      animateOpenState(false)
      toggleRef.current?.focus()
    }
    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current?.contains(event.target as Node)) return
      animateOpenState(false)
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('pointerdown', onPointerDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('pointerdown', onPointerDown)
    }
  }, [desktop, open])

  useEffect(() => {
    if (!phone || phoneIslandVisible || !open) return
    animateOpenState(false)
  }, [open, phone, phoneIslandVisible])

  useEffect(() => {
    const targets = landmarks
      .map((node) => document.getElementById(node.id))
      .filter((element): element is HTMLElement => element !== null)
    if (targets.length === 0) return

    let frame = 0
    const measure = () => {
      frame = 0
      const scrollable = document.documentElement.scrollHeight - window.innerHeight
      const progress = scrollable > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 0
      progressCircleRef.current?.setAttribute('stroke-dasharray', `${progress} 1`)
      setBackToTopVisible(window.scrollY >= window.innerHeight * 0.75)
      const titleCard = document.querySelector('.post-title-card')
      setPhoneIslandVisible(
        titleCard ? titleCard.getBoundingClientRect().bottom <= TARGET_OFFSET : window.scrollY > 1,
      )

      let current = targets[0].id
      for (const target of targets) {
        if (getReadingTop(target) <= TARGET_OFFSET + 1) current = target.id
        else break
      }
      if (window.scrollY <= 1) current = targets[0].id
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) {
        current = targets[targets.length - 1].id
      }
      if (current !== activeRef.current) setActive(current)
    }
    const requestMeasure = () => {
      if (!frame) frame = window.requestAnimationFrame(measure)
    }

    measure()
    window.addEventListener('scroll', requestMeasure, { passive: true })
    window.addEventListener('resize', requestMeasure)
    return () => {
      window.removeEventListener('scroll', requestMeasure)
      window.removeEventListener('resize', requestMeasure)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [landmarks])

  function visitLandmark(event: React.MouseEvent<HTMLAnchorElement>, id: string) {
    event.preventDefault()
    const target = document.getElementById(id)
    if (!target) return

    setActive(id)
    if (!desktop) animateOpenState(false)

    window.requestAnimationFrame(() => {
      if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1')
      target.focus({ preventScroll: true })
      window.scrollTo({ top: window.scrollY + getReadingTop(target) - TARGET_OFFSET })
      history.replaceState(null, '', `#${id}`)
    })
  }

  function returnToTop() {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!desktop) animateOpenState(false)
    window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' })
  }

  if (landmarks.length < 2) return null

  const islandConcealed = !phoneQueryReady || (phone && !phoneIslandVisible)
  const displayedNodes = phone ? phoneNodes : localizedNodes

  return (
    <div
      ref={rootRef}
      className="post-minimap-root"
      data-island-visible={phoneIslandVisible || undefined}
      data-open={open || undefined}
    >
      <div className="post-minimap-backdrop backdrop-blur-[8px]" aria-hidden />
      <div
        ref={islandRef}
        className="post-minimap-island backdrop-blur-[12px]"
        aria-hidden={islandConcealed || undefined}
        inert={islandConcealed ? true : undefined}
      >
        <button
          ref={toggleRef}
          type="button"
          className="post-minimap-toggle"
          aria-label={
            open
              ? localize(locale, '收起文章地图', 'Close article map')
              : localize(locale, '展开文章地图', 'Open article map')
          }
          aria-expanded={open}
          aria-controls={RAIL_ID}
          onClick={() => animateOpenState(!open)}
        >
          <svg
            className="post-minimap-progress"
            width="20"
            height="20"
            viewBox="0 0 20 20"
            aria-hidden
          >
            <circle className="post-minimap-progress-track" cx="10" cy="10" r="8" />
            <circle
              ref={progressCircleRef}
              className="post-minimap-progress-value"
              cx="10"
              cy="10"
              r="8"
              pathLength="1"
              strokeDasharray="0 1"
            />
          </svg>
          <span className="post-minimap-toggle-label" aria-hidden>
            {landmarks[0].label}
          </span>
          <svg
            className="post-minimap-toggle-icon"
            width="12"
            height="12"
            viewBox="0 0 12 12"
            aria-hidden
          >
            <g
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9.25 10.25H2.75C1.64543 10.25 0.75 9.35457 0.75 8.25V3.75C0.75 2.64543 1.64543 1.75 2.75 1.75H9.25C10.3546 1.75 11.25 2.64543 11.25 3.75V8.25C11.25 9.35457 10.3546 10.25 9.25 10.25Z" />
              <path
                className="post-minimap-toggle-panel"
                d="M3.25 4.25H4.25V7.75H3.25V4.25Z"
                fill="currentColor"
              />
              <path className="post-minimap-toggle-chevron" d="M8.25 7.5 6.75 6 8.25 4.5" />
            </g>
          </svg>
          <svg
            className="post-minimap-island-chevron"
            width="12"
            height="12"
            viewBox="0 0 12 12"
            aria-hidden
          >
            <path d="M2.75 4.5 6 7.5 9.25 4.5" />
          </svg>
        </button>
        <nav
          ref={panelRef}
          id={RAIL_ID}
          className="post-minimap"
          aria-label={localize(locale, '文章地图', 'Article map')}
          aria-hidden={!open}
          inert={open ? undefined : true}
        >
          <div className="post-minimap-phone-surface backdrop-blur-[12px]" aria-hidden />
          <div className="post-minimap-utilities post-minimap-utilities-top">
            <Link
              href={localePath(locale, '/blog')}
              className="post-minimap-utility"
              aria-label={localize(locale, '返回写作', 'Back to writing')}
            >
              <WayfindingArrow direction="back" />
              <span>{localize(locale, '写作', 'Writing')}</span>
            </Link>
          </div>
          <div className="post-minimap-clip">
            <div className="post-minimap-nodes">
              {displayedNodes.map((node) => (
                <div key={node.key} className="post-minimap-node" data-kind={node.kind}>
                  {node.kind === 'tick' ? (
                    <span className="post-minimap-tick" aria-hidden />
                  ) : (
                    <a
                      href={`#${node.id}`}
                      data-variant={node.variant}
                      aria-current={active === node.id ? 'location' : undefined}
                      aria-label={node.label}
                      title={node.label}
                      onClick={(event) => visitLandmark(event, node.id)}
                    >
                      <span className="post-minimap-tick" aria-hidden />
                      <span className="post-minimap-label">{node.label}</span>
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="post-minimap-utilities post-minimap-utilities-bottom">
            <button
              type="button"
              className="post-minimap-utility post-minimap-back-to-top"
              aria-label={localize(locale, '返回顶部', 'Back to top')}
              aria-hidden={!backToTopVisible}
              tabIndex={backToTopVisible ? 0 : -1}
              data-visible={backToTopVisible || undefined}
              onClick={returnToTop}
            >
              <WayfindingArrow direction="top" />
              <span>{localize(locale, '顶部', 'Top')}</span>
            </button>
          </div>
        </nav>
      </div>
    </div>
  )
}
