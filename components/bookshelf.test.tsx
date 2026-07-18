/** @vitest-environment jsdom */

import { forwardRef } from 'react'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { books } from '~/lib/personal'

import { Bookshelf } from './bookshelf'

vi.mock('next/image', () => ({
  default: forwardRef<HTMLImageElement, React.ImgHTMLAttributes<HTMLImageElement>>(
    function MockImage(props, ref) {
      // eslint-disable-next-line @next/next/no-img-element
      return <img ref={ref} {...props} />
    },
  ),
}))

vi.mock('framer-motion', () => ({
  useReducedMotion: () => false,
}))

vi.mock('~/lib/locale-client', () => ({
  localize: (_locale: string, _zh: string, en: string) => en,
  useLocale: () => 'en',
}))

class ResizeObserverStub {
  observe() {}
  disconnect() {}
}

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', ResizeObserverStub)
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('Bookshelf', () => {
  it('grounds every book on one decorative wooden shelf', () => {
    const { container } = render(<Bookshelf />)
    const room = container.querySelector<HTMLElement>('.bookshelf-room')
    const viewport = container.querySelector<HTMLElement>('.bookshelf-viewport')
    const plank = container.querySelector<HTMLElement>('.room-shelf-plank')
    const frames = [...container.querySelectorAll<HTMLElement>('.book3-frame')]
    const shadows = [...container.querySelectorAll<HTMLElement>('.book3-contact-shadow')]

    expect(frames).toHaveLength(books.length)
    expect(shadows).toHaveLength(books.length)
    expect(viewport?.parentElement).toBe(room)
    expect(plank?.parentElement).toBe(room)
    expect(shadows.every((shadow) => shadow.getAttribute('aria-hidden') === 'true')).toBe(true)
    expect(shadows.every((shadow) => !shadow.matches('a, button, [tabindex]'))).toBe(true)
    expect(
      frames.every(
        (frame) =>
          frame.style.getPropertyValue('--book-contact-width') !== '' &&
          frame.style.getPropertyValue('--book-contact-scale') !== '',
      ),
    ).toBe(true)
  })

  it('waits for the selected cover to decode before opening it', async () => {
    let finishDecode: (() => void) | undefined
    const decode = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finishDecode = resolve
        }),
    )
    render(<Bookshelf />)

    const initial = screen.getByRole('button', { name: /Grid Systems in Graphic Design/ })
    const target = screen.getByRole('button', { name: /Refactoring UI/ })
    const image = target.querySelector('img')!
    let loaded = false

    Object.defineProperty(image, 'complete', {
      configurable: true,
      get: () => loaded,
    })
    Object.defineProperty(image, 'naturalWidth', {
      configurable: true,
      get: () => (loaded ? 100 : 0),
    })
    image.decode = decode

    fireEvent.click(target, { detail: 0 })

    expect(initial.getAttribute('aria-current')).toBe('true')
    expect(target.getAttribute('aria-current')).toBeNull()
    expect(image.loading).toBe('eager')

    loaded = true
    fireEvent.load(image)
    await act(async () => Promise.resolve())

    expect(decode).toHaveBeenCalledOnce()
    expect(target.getAttribute('aria-current')).toBeNull()

    await act(async () => {
      finishDecode?.()
      await Promise.resolve()
    })

    expect(initial.getAttribute('aria-current')).toBeNull()
    expect(target.getAttribute('aria-current')).toBe('true')
  })
})
