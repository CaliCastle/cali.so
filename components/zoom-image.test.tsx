/** @vitest-environment jsdom */

import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ZoomImage } from './zoom-image'

type MockImageProps = React.ImgHTMLAttributes<HTMLImageElement> & {
  loader?: unknown
  unoptimized?: boolean
}

vi.mock('next/image', () => ({
  default: ({
    loader: _loader,
    unoptimized: _unoptimized,
    ...props
  }: MockImageProps) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img {...props} />
  ),
}))

vi.mock('~/lib/locale-client', () => ({
  localize: (_locale: string, _zh: string, en: string) => en,
  useLocale: () => 'en',
}))

let reducedMotion = false

beforeEach(() => {
  reducedMotion = false
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({ matches: reducedMotion }) as MediaQueryList),
  )
  vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1))
  vi.stubGlobal('cancelAnimationFrame', vi.fn())

  Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1200 })
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: 900 })
  Object.defineProperty(window, 'scrollX', { configurable: true, value: 0 })
  Object.defineProperty(window, 'scrollY', { configurable: true, value: 0 })
  document.documentElement.style.fontSize = ''
  vi.spyOn(HTMLImageElement.prototype, 'getBoundingClientRect').mockReturnValue({
    bottom: 300,
    height: 200,
    left: 100,
    right: 400,
    top: 100,
    width: 300,
    x: 100,
    y: 100,
    toJSON: () => ({}),
  })
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  document.documentElement.style.fontSize = ''
})

describe('ZoomImage', () => {
  it('preloads the largest rendition only once across hover and focus', () => {
    render(
      <ZoomImage
        src="/photo-640.jpg"
        alt="Taipei"
        width={800}
        height={600}
        renditions={[
          { src: '/photo-640.jpg', width: 640 },
          { src: '/photo-2560.jpg', width: 2560 },
        ]}
      />,
    )
    const createElement = vi.spyOn(document, 'createElement')
    const trigger = screen.getByRole('button', { name: 'Zoom image: Taipei' })

    fireEvent.pointerEnter(trigger)
    fireEvent.pointerEnter(trigger)
    fireEvent.focus(trigger)

    expect(
      createElement.mock.calls.filter(([tagName]) => tagName === 'img'),
    ).toHaveLength(1)
  })

  it('scales the detail reservation and mobile breakpoint with rem', () => {
    document.documentElement.style.fontSize = '20px'
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 700 })
    render(
      <ZoomImage
        src="/photo.jpg"
        alt="Taipei"
        width={800}
        height={1600}
        expandedContent={<p>Details</p>}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Zoom image: Taipei' }), {
      detail: 0,
    })

    const expandedImage = screen
      .getByRole('dialog', { name: 'Taipei' })
      .querySelector('img')!
    expect(expandedImage.style.height).toBe('696px')
    expect(expandedImage.style.top).toBe('32px')
  })

  it('opens keyboard activation in its settled state without scheduling motion', () => {
    render(<ZoomImage src="/photo.jpg" alt="Taipei" width={800} height={600} />)

    fireEvent.click(screen.getByRole('button', { name: 'Zoom image: Taipei' }), {
      detail: 0,
    })

    const dialog = screen.getByRole('dialog', { name: 'Taipei' })
    expect(dialog.getAttribute('data-state')).toBe('open')
    expect(dialog.getAttribute('data-motion')).toBe('instant')
    expect(requestAnimationFrame).not.toHaveBeenCalled()
  })

  it('ignores stale scroll events until the viewport position changes', () => {
    Object.defineProperty(window, 'scrollX', { configurable: true, value: 0 })
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 100 })
    render(<ZoomImage src="/photo.jpg" alt="Taipei" width={800} height={600} />)
    fireEvent.click(screen.getByRole('button', { name: 'Zoom image: Taipei' }), {
      detail: 0,
    })

    fireEvent.scroll(window)
    expect(screen.getByRole('dialog', { name: 'Taipei' })).not.toBeNull()

    Object.defineProperty(window, 'scrollY', { configurable: true, value: 101 })
    fireEvent.scroll(window)
    expect(screen.queryByRole('dialog', { name: 'Taipei' })).toBeNull()
  })

  it('closes on Escape immediately and restores trigger focus', () => {
    render(<ZoomImage src="/photo.jpg" alt="Taipei" width={800} height={600} />)
    const trigger = screen.getByRole('button', { name: 'Zoom image: Taipei' })
    trigger.focus()
    fireEvent.click(trigger, { detail: 0 })

    const escape = new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      key: 'Escape',
    })
    act(() => {
      window.dispatchEvent(escape)
    })

    expect(escape.defaultPrevented).toBe(true)
    expect(screen.queryByRole('dialog', { name: 'Taipei' })).toBeNull()
    expect(document.activeElement).toBe(trigger)
  })

  it('preserves the two-frame pointer opening transition', () => {
    const frames: FrameRequestCallback[] = []
    vi.stubGlobal(
      'requestAnimationFrame',
      vi.fn((callback: FrameRequestCallback) => {
        frames.push(callback)
        return frames.length
      }),
    )
    render(<ZoomImage src="/photo.jpg" alt="Taipei" width={800} height={600} />)

    fireEvent.click(screen.getByRole('button', { name: 'Zoom image: Taipei' }), {
      detail: 1,
    })

    const dialog = screen.getByRole('dialog', { name: 'Taipei' })
    expect(dialog.getAttribute('data-state')).toBe('opening')
    expect(dialog.getAttribute('data-motion')).toBe('animated')
    expect(frames).toHaveLength(1)

    act(() => frames.shift()?.(0))
    expect(dialog.getAttribute('data-state')).toBe('opening')
    expect(frames).toHaveLength(1)

    act(() => frames.shift()?.(16))
    expect(dialog.getAttribute('data-state')).toBe('open')
  })

  it('keeps pointer overlay closing animated until the image settles', () => {
    const frames: FrameRequestCallback[] = []
    vi.stubGlobal(
      'requestAnimationFrame',
      vi.fn((callback: FrameRequestCallback) => {
        frames.push(callback)
        return frames.length
      }),
    )
    render(<ZoomImage src="/photo.jpg" alt="Taipei" width={800} height={600} />)
    const trigger = screen.getByRole('button', { name: 'Zoom image: Taipei' })
    trigger.focus()
    fireEvent.click(trigger, { detail: 1 })
    act(() => frames.shift()?.(0))
    act(() => frames.shift()?.(16))

    const dialog = screen.getByRole('dialog', { name: 'Taipei' })
    fireEvent.click(dialog, { detail: 1 })

    expect(dialog.getAttribute('data-state')).toBe('closing')
    fireEvent.transitionEnd(dialog.querySelector('img')!)
    expect(screen.queryByRole('dialog', { name: 'Taipei' })).toBeNull()
    expect(document.activeElement).toBe(trigger)
  })

  it('bypasses pointer closing motion when Escape is pressed', () => {
    const frames: FrameRequestCallback[] = []
    vi.stubGlobal(
      'requestAnimationFrame',
      vi.fn((callback: FrameRequestCallback) => {
        frames.push(callback)
        return frames.length
      }),
    )
    render(<ZoomImage src="/photo.jpg" alt="Taipei" width={800} height={600} />)
    const trigger = screen.getByRole('button', { name: 'Zoom image: Taipei' })
    fireEvent.click(trigger, { detail: 1 })
    act(() => frames.shift()?.(0))
    act(() => frames.shift()?.(16))

    fireEvent.keyDown(window, { key: 'Escape' })

    expect(screen.queryByRole('dialog', { name: 'Taipei' })).toBeNull()
    expect(document.activeElement).toBe(trigger)
  })

  it('settles reduced-motion pointer activation and dismissal immediately', () => {
    reducedMotion = true
    render(<ZoomImage src="/photo.jpg" alt="Taipei" width={800} height={600} />)
    const trigger = screen.getByRole('button', { name: 'Zoom image: Taipei' })
    trigger.focus()

    fireEvent.click(trigger, { detail: 1 })

    const dialog = screen.getByRole('dialog', { name: 'Taipei' })
    expect(dialog.getAttribute('data-state')).toBe('open')
    expect(requestAnimationFrame).not.toHaveBeenCalled()

    fireEvent.click(dialog, { detail: 1 })
    expect(screen.queryByRole('dialog', { name: 'Taipei' })).toBeNull()
    expect(document.activeElement).toBe(trigger)
  })

  it('removes every viewport and keyboard listener when unmounted', () => {
    const removeListener = vi.spyOn(window, 'removeEventListener')
    const { unmount } = render(
      <ZoomImage src="/photo.jpg" alt="Taipei" width={800} height={600} />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Zoom image: Taipei' }), {
      detail: 0,
    })

    unmount()

    for (const type of ['keydown', 'wheel', 'touchmove', 'scroll', 'resize']) {
      expect(removeListener.mock.calls.some(([removedType]) => removedType === type)).toBe(
        true,
      )
    }
  })
})
