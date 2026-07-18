'use client'

import { useLayoutEffect, useRef } from 'react'

/**
 * The sliding dot under a dock's active item, shared by the public dock and
 * the owner dock. Pointer navigation slides the marker (220ms --ease-swift
 * in CSS); keyboard navigation and dock resizes reposition it instantly per
 * the "keyboard actions are never animated" rule.
 */
export function useDockActiveIndicator(activeKey: string | undefined) {
  const dockRef = useRef<HTMLElement | null>(null)
  const indicatorRef = useRef<HTMLSpanElement | null>(null)
  const itemRefs = useRef(new Map<string, HTMLAnchorElement>())
  const activeKeyRef = useRef(activeKey)
  const keyboardNavigationRef = useRef(false)
  const indicatorFrameRef = useRef<number | null>(null)

  function registerItem(key: string, element: HTMLAnchorElement | null) {
    if (element) itemRefs.current.set(key, element)
    else itemRefs.current.delete(key)
  }

  function clearIndicatorFrame() {
    if (indicatorFrameRef.current === null) return
    window.cancelAnimationFrame(indicatorFrameRef.current)
    indicatorFrameRef.current = null
  }

  function positionIndicator(instant: boolean) {
    const dock = dockRef.current
    const indicator = indicatorRef.current
    const key = activeKeyRef.current
    const activeItem = key ? itemRefs.current.get(key) : undefined

    if (!dock || !indicator || !activeItem) {
      indicator?.removeAttribute('data-ready')
      return
    }

    const dockRect = dock.getBoundingClientRect()
    const itemRect = activeItem.getBoundingClientRect()
    const center = itemRect.left - dockRect.left + itemRect.width / 2
    const shouldSnap = instant || !indicator.hasAttribute('data-ready')

    clearIndicatorFrame()
    if (shouldSnap) indicator.setAttribute('data-instant', '')

    indicator.style.setProperty('--dock-indicator-x', `${center}px`)
    indicator.setAttribute('data-ready', '')

    if (shouldSnap) {
      // Keep transitions disabled for one painted frame. Keyboard navigation
      // and dock resizing should reposition the marker without movement.
      indicatorFrameRef.current = window.requestAnimationFrame(() => {
        indicatorFrameRef.current = window.requestAnimationFrame(() => {
          indicatorFrameRef.current = null
          indicator.removeAttribute('data-instant')
        })
      })
    }
  }

  function handleNavigate(href: string, keyboardInitiated: boolean) {
    keyboardNavigationRef.current =
      href !== activeKeyRef.current && keyboardInitiated
  }

  useLayoutEffect(() => {
    activeKeyRef.current = activeKey
    positionIndicator(keyboardNavigationRef.current)
    keyboardNavigationRef.current = false
  }, [activeKey])

  useLayoutEffect(() => {
    const dock = dockRef.current
    if (!dock || typeof ResizeObserver === 'undefined') return

    const observer = new ResizeObserver(() => positionIndicator(true))
    observer.observe(dock)

    return () => observer.disconnect()
  }, [])

  useLayoutEffect(() => () => clearIndicatorFrame(), [])

  return { dockRef, indicatorRef, registerItem, handleNavigate }
}
