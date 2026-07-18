// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { PortraitHiddenStage } from './portrait-hidden-stage'

vi.mock('next/dynamic', () => ({
  default: () => function ShaderFieldBoundary() {
    return <span data-shader-stage />
  },
}))

function setMediaPreference(initialReducedMotion: boolean) {
  let reducedMotion = initialReducedMotion
  const listeners = new Set<() => void>()

  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      get matches() {
        return query === '(prefers-reduced-motion: reduce)' && reducedMotion
      },
      media: query,
      onchange: null,
      addEventListener: vi.fn((_type: string, listener: () => void) => listeners.add(listener)),
      removeEventListener: vi.fn((_type: string, listener: () => void) =>
        listeners.delete(listener),
      ),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  )

  return {
    setReducedMotion(value: boolean) {
      reducedMotion = value
      listeners.forEach((listener) => listener())
    },
  }
}

function enableWebGpu(adapter: unknown | null = {}) {
  const requestAdapter = vi.fn().mockResolvedValue(adapter)
  Object.defineProperty(navigator, 'gpu', {
    configurable: true,
    value: {
      requestAdapter,
    },
  })
  return requestAdapter
}

afterEach(() => {
  cleanup()
  vi.useRealTimers()
  vi.unstubAllGlobals()
  Reflect.deleteProperty(navigator, 'gpu')
})

describe('PortraitHiddenStage', () => {
  it('mounts lazily and waits for the exit fade before unmounting', async () => {
    vi.useFakeTimers()
    setMediaPreference(false)
    enableWebGpu()

    render(
      <PortraitHiddenStage label="Reveal hidden topographic field">
        <span>Portrait</span>
      </PortraitHiddenStage>,
    )

    const trigger = screen.getByRole('button', { name: 'Reveal hidden topographic field' })
    expect(document.querySelector('[data-shader-stage]')).toBeNull()

    await act(async () => {
      fireEvent.pointerEnter(trigger, { pointerType: 'mouse' })
    })

    expect(trigger.closest('[data-portrait-stage]')?.getAttribute('data-active')).toBe('true')
    expect(document.querySelector('[data-shader-stage]')).not.toBeNull()

    fireEvent.pointerLeave(trigger, { pointerType: 'mouse' })
    fireEvent.blur(trigger)
    expect(document.querySelector('[data-shader-stage]')).not.toBeNull()

    act(() => vi.advanceTimersByTime(319))
    expect(document.querySelector('[data-shader-stage]')).not.toBeNull()

    act(() => vi.advanceTimersByTime(1))
    expect(document.querySelector('[data-shader-stage]')).toBeNull()
  })

  it('keeps reduced-motion reveals static even when WebGPU is available', () => {
    setMediaPreference(true)
    const requestAdapter = enableWebGpu()

    render(
      <PortraitHiddenStage label="Reveal hidden topographic field">
        <span>Portrait</span>
      </PortraitHiddenStage>,
    )

    const trigger = screen.getByRole('button', { name: 'Reveal hidden topographic field' })
    fireEvent.pointerEnter(trigger, { pointerType: 'mouse' })

    expect(trigger.closest('[data-portrait-stage]')?.getAttribute('data-active')).toBe('true')
    expect(trigger.closest('[data-portrait-stage]')?.getAttribute('data-motion')).toBe('false')
    expect(requestAdapter).not.toHaveBeenCalled()
    expect(document.querySelector('[data-shader-stage]')).toBeNull()
  })

  it('keeps the first touch reveal open when touch focus arrives before pointerup', async () => {
    vi.useFakeTimers()
    setMediaPreference(false)
    enableWebGpu()

    render(
      <PortraitHiddenStage label="Reveal hidden topographic field">
        <span>Portrait</span>
      </PortraitHiddenStage>,
    )

    const trigger = screen.getByRole('button', { name: 'Reveal hidden topographic field' })
    fireEvent.pointerDown(trigger, { pointerType: 'touch' })
    fireEvent.focus(trigger)
    await act(async () => {
      fireEvent.pointerUp(trigger, { pointerType: 'touch' })
    })

    expect(trigger.closest('[data-portrait-stage]')?.getAttribute('data-active')).toBe('true')
    expect(document.querySelector('[data-shader-stage]')).not.toBeNull()

    act(() => vi.advanceTimersByTime(3000))

    expect(trigger.closest('[data-portrait-stage]')?.getAttribute('data-active')).toBe('false')
    expect(document.querySelector('[data-shader-stage]')).toBeNull()
  })

  it('does not mistake focus after touch pointerup for keyboard focus', async () => {
    vi.useFakeTimers()
    setMediaPreference(false)
    enableWebGpu()

    render(
      <PortraitHiddenStage label="Reveal hidden topographic field">
        <span>Portrait</span>
      </PortraitHiddenStage>,
    )

    const trigger = screen.getByRole('button', { name: 'Reveal hidden topographic field' })
    fireEvent.pointerDown(trigger, { pointerType: 'touch' })
    await act(async () => {
      fireEvent.pointerUp(trigger, { pointerType: 'touch' })
    })
    fireEvent.focus(trigger)

    expect(trigger.closest('[data-portrait-stage]')?.getAttribute('data-active')).toBe('true')

    act(() => vi.advanceTimersByTime(3000))

    expect(trigger.closest('[data-portrait-stage]')?.getAttribute('data-active')).toBe('false')
    expect(document.querySelector('[data-shader-stage]')).toBeNull()
  })

  it('keeps keyboard focus static and composed with pointer hover', async () => {
    setMediaPreference(false)
    enableWebGpu()

    render(
      <PortraitHiddenStage label="Reveal hidden topographic field">
        <span>Portrait</span>
      </PortraitHiddenStage>,
    )

    const trigger = screen.getByRole('button', { name: 'Reveal hidden topographic field' })
    fireEvent.focus(trigger)

    expect(trigger.closest('[data-portrait-stage]')?.getAttribute('data-active')).toBe('true')
    expect(trigger.closest('[data-portrait-stage]')?.getAttribute('data-motion')).toBe('false')
    expect(document.querySelector('[data-shader-stage]')).toBeNull()

    await act(async () => {
      fireEvent.pointerEnter(trigger, { pointerType: 'mouse' })
    })
    expect(document.querySelector('[data-shader-stage]')).not.toBeNull()

    fireEvent.pointerLeave(trigger, { pointerType: 'mouse' })
    expect(trigger.closest('[data-portrait-stage]')?.getAttribute('data-active')).toBe('true')
    expect(document.querySelector('[data-shader-stage]')).toBeNull()
  })

  it('falls back when WebGPU exposes no adapter', async () => {
    setMediaPreference(false)
    const requestAdapter = enableWebGpu(null)

    render(
      <PortraitHiddenStage label="Reveal hidden topographic field">
        <span>Portrait</span>
      </PortraitHiddenStage>,
    )

    const trigger = screen.getByRole('button', { name: 'Reveal hidden topographic field' })
    await act(async () => {
      fireEvent.pointerEnter(trigger, { pointerType: 'mouse' })
    })

    expect(trigger.closest('[data-portrait-stage]')?.getAttribute('data-active')).toBe('true')
    expect(trigger.closest('[data-portrait-stage]')?.getAttribute('data-motion')).toBe('false')
    expect(requestAdapter).toHaveBeenCalledOnce()
    expect(document.querySelector('[data-shader-stage]')).toBeNull()
  })

  it('removes an active shader when reduced motion turns on', async () => {
    const preference = setMediaPreference(false)
    enableWebGpu()

    render(
      <PortraitHiddenStage label="Reveal hidden topographic field">
        <span>Portrait</span>
      </PortraitHiddenStage>,
    )

    const trigger = screen.getByRole('button', { name: 'Reveal hidden topographic field' })
    await act(async () => {
      fireEvent.pointerEnter(trigger, { pointerType: 'mouse' })
    })
    expect(document.querySelector('[data-shader-stage]')).not.toBeNull()

    act(() => preference.setReducedMotion(true))

    expect(trigger.closest('[data-portrait-stage]')?.getAttribute('data-active')).toBe('true')
    expect(trigger.closest('[data-portrait-stage]')?.getAttribute('data-motion')).toBe('false')
    expect(document.querySelector('[data-shader-stage]')).toBeNull()
  })
})
