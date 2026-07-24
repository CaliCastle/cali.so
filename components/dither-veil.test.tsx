// @vitest-environment jsdom

import { cleanup, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { DitheredImage } from './dither-veil'

vi.mock('next/image', async () => {
  const { forwardRef } = await import('react')

  return {
    default: forwardRef<
      HTMLImageElement,
      React.ImgHTMLAttributes<HTMLImageElement> & {
        src: string | { src: string }
      }
    >(function MockImage({ src, ...props }, ref) {
      return (
        <img
          {...props}
          ref={ref}
          src={typeof src === 'string' ? src : src.src}
        />
      )
    }),
  }
})

class ResizeObserverStub {
  observe() {}
  disconnect() {}
}

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', ResizeObserverStub)
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
    {} as CanvasRenderingContext2D,
  )
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

function stubLoadedImage() {
  const originals = {
    complete: Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'complete'),
    naturalWidth: Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'naturalWidth'),
    decode: Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'decode'),
  }
  Object.defineProperty(HTMLImageElement.prototype, 'complete', {
    configurable: true,
    get: () => true,
  })
  Object.defineProperty(HTMLImageElement.prototype, 'naturalWidth', {
    configurable: true,
    get: () => 1,
  })
  Object.defineProperty(HTMLImageElement.prototype, 'decode', {
    configurable: true,
    value: () => Promise.resolve(),
  })
  return () => {
    for (const [key, desc] of Object.entries(originals)) {
      if (desc) Object.defineProperty(HTMLImageElement.prototype, key, desc)
      else delete (HTMLImageElement.prototype as unknown as Record<string, unknown>)[key]
    }
  }
}

function mockVeilContext(alpha: number) {
  const fillRect = vi.fn()
  const ctx = {
    setTransform: vi.fn(),
    clearRect: vi.fn(),
    drawImage: vi.fn(),
    fillRect,
    fillText: vi.fn(),
    fillStyle: '',
    font: '',
    textBaseline: 'top',
    getImageData: (_x: number, _y: number, w: number, h: number) => {
      const data = new Uint8ClampedArray(w * h * 4)
      for (let i = 3; i < data.length; i += 4) data[i] = alpha
      return { data }
    },
  }
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
    ctx as unknown as CanvasRenderingContext2D,
  )
  vi.spyOn(HTMLCanvasElement.prototype, 'getBoundingClientRect').mockReturnValue({
    width: 64,
    height: 44,
    top: 0,
    left: 0,
    right: 64,
    bottom: 44,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  } as DOMRect)
  return fillRect
}

describe('DitheredImage', () => {
  it('samples the rendered optimized image without creating another request', () => {
    const imageConstructor = vi.fn()
    vi.stubGlobal('Image', imageConstructor)

    const { container } = render(
      <DitheredImage
        src="/_next/image?url=%2Fcover.png&w=128&q=75"
        alt=""
        width={64}
        height={44}
      />,
    )

    expect(container.querySelectorAll('img')).toHaveLength(1)
    expect(imageConstructor).not.toHaveBeenCalled()
  })

  // iOS Safari can report the image loaded before its pixels decode —
  // sampling then reads fully transparent, which used to dither every
  // cell to solid ink (the "black grid" mobile bug)
  it('does not print ink when the image samples blank', async () => {
    const restoreImage = stubLoadedImage()
    const fillRect = mockVeilContext(0)
    try {
      render(<DitheredImage src="/cover.png" alt="" width={64} height={44} />)
      await vi.waitFor(() => {
        expect(HTMLCanvasElement.prototype.getContext).toHaveBeenCalled()
      })
      await new Promise((resolve) => setTimeout(resolve, 0))
      expect(fillRect).not.toHaveBeenCalled()
    } finally {
      restoreImage()
    }
  })

  it('prints the dither once the image has decodable pixels', async () => {
    const restoreImage = stubLoadedImage()
    const fillRect = mockVeilContext(255)
    try {
      render(<DitheredImage src="/cover.png" alt="" width={64} height={44} />)
      await vi.waitFor(() => {
        expect(fillRect).toHaveBeenCalled()
      })
    } finally {
      restoreImage()
    }
  })
})
