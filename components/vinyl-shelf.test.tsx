/** @vitest-environment jsdom */

import { act, cleanup, fireEvent, render } from '@testing-library/react'
import { Profiler } from 'react'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { records } from '~/lib/personal'

import { sleeveFinish, VinylShelf } from './vinyl-shelf'

vi.mock('next/image', () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img {...props} />
  ),
}))

vi.mock('~/lib/locale-client', () => ({
  localize: (_locale: string, _zh: string, en: string) => en,
  useLocale: () => 'en',
}))

const originalPointerCapture = {
  has: HTMLElement.prototype.hasPointerCapture,
  release: HTMLElement.prototype.releasePointerCapture,
  set: HTMLElement.prototype.setPointerCapture,
}

beforeAll(() => {
  const capturedPointers = new WeakMap<HTMLElement, Set<number>>()

  HTMLElement.prototype.setPointerCapture = vi.fn(function (this: HTMLElement, pointerId: number) {
    const captured = capturedPointers.get(this) ?? new Set<number>()
    captured.add(pointerId)
    capturedPointers.set(this, captured)
  })
  HTMLElement.prototype.hasPointerCapture = vi.fn(function (this: HTMLElement, pointerId: number) {
    return capturedPointers.get(this)?.has(pointerId) ?? false
  })
  HTMLElement.prototype.releasePointerCapture = vi.fn(function (this: HTMLElement, pointerId: number) {
    capturedPointers.get(this)?.delete(pointerId)
  })
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

afterAll(() => {
  HTMLElement.prototype.setPointerCapture = originalPointerCapture.set
  HTMLElement.prototype.hasPointerCapture = originalPointerCapture.has
  HTMLElement.prototype.releasePointerCapture = originalPointerCapture.release
})

describe('VinylShelf', () => {
  it('keeps every physical finish deterministic and decorative', () => {
    const finishSeeds = records.map(
      (record) => `${record.artist}, ${record.album} (${record.year})`,
    )
    const finishes = finishSeeds.map(sleeveFinish)
    const creaseImages = finishes.map(
      (finish) =>
        (finish.creaseStyle as unknown as Record<string, string>)[
          '--vinyl-crease-image'
        ],
    )

    expect(finishes).toEqual(finishSeeds.map(sleeveFinish))
    expect(creaseImages).toContain('none')
    expect(creaseImages.some((image) => image !== 'none')).toBe(true)

    const { container, rerender } = render(<VinylShelf />)
    const room = container.querySelector<HTMLElement>('.vinyl-room')
    const viewport = container.querySelector<HTMLElement>('.vinyl-viewport')
    const plank = container.querySelector<HTMLElement>('.room-shelf-plank')
    const sleeves = [...container.querySelectorAll<HTMLElement>('.vinyl')]
    const shadows = [...container.querySelectorAll<HTMLElement>('.vinyl-contact-shadow')]

    expect(sleeves).toHaveLength(records.length)
    expect(shadows).toHaveLength(records.length)
    expect(room?.contains(viewport)).toBe(true)
    expect(room?.contains(plank)).toBe(true)
    expect(viewport?.parentElement).toBe(room)
    expect(plank?.parentElement).toBe(room)
    expect(shadows.every((shadow) => shadow.getAttribute('aria-hidden') === 'true')).toBe(true)
    expect(shadows.every((shadow) => !shadow.matches('a, button, [tabindex]'))).toBe(true)
    expect(shadows.every((shadow) => shadow.querySelector('a, button, [tabindex]') === null)).toBe(true)
    expect(shadows.every((shadow) => shadow.tabIndex === -1)).toBe(true)

    const finishTuple = (sleeve: HTMLElement) => {
      const crease = sleeve.querySelector<HTMLElement>('.vinyl-creases')
      const trigger = sleeve.querySelector<HTMLElement>('.vinyl-trigger')
      const fields = [
        trigger?.style.getPropertyValue('--vinyl-contact-scale') ?? '',
        sleeve.style.getPropertyValue('--vinyl-paper-size'),
        sleeve.style.getPropertyValue('--vinyl-paper-x'),
        sleeve.style.getPropertyValue('--vinyl-paper-y'),
        trigger?.style.getPropertyValue('--vinyl-rest-offset') ?? '',
        trigger?.style.getPropertyValue('--vinyl-rest-tilt') ?? '',
        sleeve.style.getPropertyValue('--vinyl-wear-opacity'),
        sleeve.style.getPropertyValue('--vinyl-wear-x'),
        sleeve.style.getPropertyValue('--vinyl-wear-y'),
        crease?.style.getPropertyValue('--vinyl-crease-image') ?? '',
        crease?.style.getPropertyValue('--vinyl-crease-position') ?? '',
        crease?.style.getPropertyValue('--vinyl-crease-size') ?? '',
      ]

      expect(fields.every((field) => field !== '')).toBe(true)
      return fields.join('|')
    }
    const initialFinishes = sleeves.map(finishTuple)

    expect(new Set(initialFinishes).size).toBeGreaterThan(1)

    rerender(<VinylShelf />)

    expect([...container.querySelectorAll<HTMLElement>('.vinyl')].map(finishTuple)).toEqual(initialFinishes)
  })

  it('preserves roving keyboard selection through the decorative layers', () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({ matches: false }) as MediaQueryList),
    )
    const { container } = render(<VinylShelf />)
    const shelf = container.querySelector<HTMLElement>('.vinyl-shelf')
    const triggers = [...container.querySelectorAll<HTMLButtonElement>('.vinyl-trigger')]
    const initialIndex = Math.floor(records.length / 2)
    const nextIndex = (initialIndex + 1) % records.length

    expect(shelf?.dataset.activeIndex).toBe(String(initialIndex))
    expect(triggers[initialIndex].ariaPressed).toBe('true')
    expect(triggers[initialIndex].tabIndex).toBe(0)

    fireEvent.keyDown(triggers[initialIndex], { key: 'ArrowRight' })

    expect(shelf?.dataset.activeIndex).toBe(String(nextIndex))
    expect(triggers[initialIndex].ariaPressed).toBe('false')
    expect(triggers[initialIndex].hasAttribute('aria-current')).toBe(false)
    expect(triggers[initialIndex].tabIndex).toBe(-1)
    expect(triggers[nextIndex].ariaPressed).toBe('true')
    expect(triggers[nextIndex].getAttribute('aria-current')).toBe('true')
    expect(triggers[nextIndex].tabIndex).toBe(0)
    expect(document.activeElement).toBe(triggers[nextIndex])

    const annotation = container.querySelector<HTMLAnchorElement>('.vinyl-annotation')
    expect(annotation?.getAttribute('href')).toBe(records[nextIndex].url)
    expect(annotation?.textContent).toContain(records[nextIndex].album)
  })

  it('keeps the centered sleeve on top during a held mouse drag', async () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({ matches: false }) as MediaQueryList),
    )
    const { container } = render(<VinylShelf />)
    const viewport = container.querySelector<HTMLElement>('.vinyl-viewport')
    const shelf = container.querySelector<HTMLElement>('.vinyl-shelf')
    const sleeves = [...container.querySelectorAll<HTMLElement>('.vinyl')]
    const annotation = container.querySelector<HTMLAnchorElement>('.vinyl-annotation')
    const initialIndex = Math.floor(records.length / 2)
    const centeredIndex = Math.min(records.length - 1, initialIndex + 2)
    const stackOrder = (index: number) =>
      Number(sleeves[index].style.getPropertyValue('--vinyl-stack-order'))

    fireEvent.pointerDown(viewport!, {
      button: 0,
      clientX: 300,
      clientY: 100,
      isPrimary: true,
      pointerId: 1,
      pointerType: 'mouse',
    })
    fireEvent.pointerMove(viewport!, {
      clientX: 172,
      clientY: 100,
      isPrimary: true,
      pointerId: 1,
      pointerType: 'mouse',
    })

    await act(
      () => new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve())),
    )

    expect(shelf?.dataset.activeIndex).toBe(String(initialIndex))
    expect(annotation?.textContent).toContain(records[initialIndex].album)
    expect(stackOrder(centeredIndex)).toBeGreaterThan(stackOrder(initialIndex))

    fireEvent.pointerUp(viewport!, {
      clientX: 172,
      clientY: 100,
      isPrimary: true,
      pointerId: 1,
      pointerType: 'mouse',
    })

    expect(shelf?.dataset.activeIndex).toBe(String(centeredIndex))
  })

  it('keeps the sleeve pivot continuous while a held drag crosses center', async () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({ matches: false }) as MediaQueryList),
    )
    const { container } = render(<VinylShelf />)
    const viewport = container.querySelector<HTMLElement>('.vinyl-viewport')
    const initialIndex = Math.floor(records.length / 2)
    const crossingIndex = Math.min(records.length - 1, initialIndex + 1)
    const crossingSleeve = container.querySelector<HTMLElement>(
      `.vinyl[data-index="${crossingIndex}"]`,
    )
    const pivots: number[] = []

    fireEvent.pointerDown(viewport!, {
      button: 0,
      clientX: 300,
      clientY: 100,
      isPrimary: true,
      pointerId: 1,
      pointerType: 'mouse',
    })

    for (const clientX of [237, 236, 235]) {
      fireEvent.pointerMove(viewport!, {
        clientX,
        clientY: 100,
        isPrimary: true,
        pointerId: 1,
        pointerType: 'mouse',
      })

      await act(
        () => new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve())),
      )

      pivots.push(
        Number.parseFloat(
          crossingSleeve
            ?.querySelector<HTMLElement>('.vinyl-trigger')
            ?.style.getPropertyValue('--vinyl-origin-x') ?? '',
        ),
      )
    }

    expect(pivots.every(Number.isFinite)).toBe(true)
    expect(Math.max(...pivots) - Math.min(...pivots)).toBeLessThan(2)

    fireEvent.pointerUp(viewport!, {
      clientX: 235,
      clientY: 100,
      isPrimary: true,
      pointerId: 1,
      pointerType: 'mouse',
    })
  })

  it('keeps continuous panning outside the React render loop', async () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({ matches: false }) as MediaQueryList),
    )
    const onRender = vi.fn()
    const { container } = render(
      <Profiler id="vinyl-shelf" onRender={onRender}>
        <VinylShelf />
      </Profiler>,
    )
    const viewport = container.querySelector<HTMLElement>('.vinyl-viewport')
    const initialRenderCount = onRender.mock.calls.length

    fireEvent.pointerDown(viewport!, {
      button: 0,
      clientX: 300,
      clientY: 100,
      isPrimary: true,
      pointerId: 1,
      pointerType: 'mouse',
    })

    for (const clientX of [280, 260, 240, 220]) {
      fireEvent.pointerMove(viewport!, {
        clientX,
        clientY: 100,
        isPrimary: true,
        pointerId: 1,
        pointerType: 'mouse',
      })
      await act(
        () => new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve())),
      )
    }

    expect(onRender.mock.calls.length - initialRenderCount).toBeLessThanOrEqual(2)

    fireEvent.pointerUp(viewport!, {
      clientX: 220,
      clientY: 100,
      isPrimary: true,
      pointerId: 1,
      pointerType: 'mouse',
    })
  })

  it('keeps a mobile horizontal swipe and snaps to the next sleeve', () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({ matches: false }) as MediaQueryList),
    )
    const { container } = render(<VinylShelf />)
    const viewport = container.querySelector<HTMLElement>('.vinyl-viewport')
    const shelf = container.querySelector<HTMLElement>('.vinyl-shelf')
    const initialIndex = Math.floor(records.length / 2)
    const nextIndex = Math.min(records.length - 1, initialIndex + 1)
    const triggers = [...container.querySelectorAll<HTMLButtonElement>('.vinyl-trigger')]
    const annotation = container.querySelector<HTMLAnchorElement>('.vinyl-annotation')

    expect(viewport).not.toBeNull()
    expect(shelf?.dataset.activeIndex).toBe(String(initialIndex))
    expect(viewport?.style.touchAction).toBe('pan-y')
    expect(annotation?.getAttribute('href')).toBe(records[initialIndex].url)

    triggers[initialIndex].focus()
    expect(document.activeElement).toBe(triggers[initialIndex])

    fireEvent.pointerDown(viewport!, {
      button: 0,
      clientX: 300,
      clientY: 100,
      isPrimary: true,
      pointerId: 1,
      pointerType: 'touch',
    })

    expect(viewport?.setPointerCapture).toHaveBeenCalledWith(1)

    fireEvent.pointerMove(viewport!, {
      clientX: 236,
      clientY: 100,
      isPrimary: true,
      pointerId: 1,
      pointerType: 'touch',
    })

    expect(shelf?.dataset.activeIndex).toBe(String(initialIndex))
    expect(triggers[initialIndex].ariaPressed).toBe('true')
    expect(triggers[initialIndex].getAttribute('aria-current')).toBe('true')
    expect(triggers[initialIndex].tabIndex).toBe(0)
    expect(triggers[nextIndex].ariaPressed).toBe('false')
    expect(triggers[nextIndex].hasAttribute('aria-current')).toBe(false)
    expect(triggers[nextIndex].tabIndex).toBe(-1)
    expect(annotation?.getAttribute('href')).toBe(records[initialIndex].url)
    expect(annotation?.textContent).toContain(records[initialIndex].album)
    expect(document.activeElement).toBe(triggers[initialIndex])

    fireEvent.pointerUp(viewport!, {
      clientX: 236,
      clientY: 100,
      isPrimary: true,
      pointerId: 1,
      pointerType: 'touch',
    })

    expect(shelf?.dataset.activeIndex).toBe(String(nextIndex))
    expect(triggers[initialIndex].ariaPressed).toBe('false')
    expect(triggers[initialIndex].hasAttribute('aria-current')).toBe(false)
    expect(triggers[initialIndex].tabIndex).toBe(-1)
    expect(triggers[nextIndex].ariaPressed).toBe('true')
    expect(triggers[nextIndex].getAttribute('aria-current')).toBe('true')
    expect(triggers[nextIndex].tabIndex).toBe(0)
    expect(annotation?.getAttribute('href')).toBe(records[nextIndex].url)
    expect(annotation?.textContent).toContain(records[nextIndex].album)
    expect(document.activeElement).toBe(triggers[nextIndex])
  })
})
