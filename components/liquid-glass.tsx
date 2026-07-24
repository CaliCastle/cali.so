'use client'

import { useEffect, useRef, useState } from 'react'

// Liquid glass: an SVG feDisplacementMap driven by a displacement map we
// draw on the fly from the element's shape. The map is a rounded rect —
// four-fold symmetric, so we compute the top-left quadrant and mirror it
// into all four (flipping the bend direction with each axis). Red/green
// channels say how far each backdrop pixel bends horizontally/vertically:
// 128 is neutral, the edge band ramps outward along the shape's normal so
// the backdrop refracts like light entering the thick rim of a lens.
//
// Applied as an inline-style backdrop-filter (never in the stylesheet —
// LightningCSS strips raw backdrop-filter declarations). Chromium renders
// the refraction; Safari/Firefox can't do SVG filters in backdrop-filter
// and quietly ignore the layer, leaving the host's own translucency.

const TAU = { depth: 16, curve: 1.6, scale: 32, chroma: 0.05, frost: 7 }

function makeDisplacementMap(w: number, h: number, radius: number): string {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) return ''
  const img = ctx.createImageData(w, h)
  const data = img.data

  const bx = w / 2
  const by = h / 2
  const r = Math.min(radius, bx, by)
  const depth = Math.min(TAU.depth, r)

  const put = (x: number, y: number, rc: number, gc: number) => {
    const i = (y * w + x) * 4
    data[i] = rc
    data[i + 1] = gc
    data[i + 2] = 128
    data[i + 3] = 255
  }

  for (let y = 0; y < Math.ceil(h / 2); y++) {
    for (let x = 0; x < Math.ceil(w / 2); x++) {
      // signed distance to the rounded rect, sampled at the pixel center
      // (top-left quadrant: px, py are both negative)
      const px = x + 0.5 - bx
      const py = y + 0.5 - by
      const qx = Math.abs(px) - (bx - r)
      const qy = Math.abs(py) - (by - r)
      const ox = Math.max(qx, 0)
      const oy = Math.max(qy, 0)
      const sd = Math.min(Math.max(qx, qy), 0) + Math.hypot(ox, oy) - r

      // bend magnitude: flat in the interior, ramping through the edge band
      const t = Math.max(0, Math.min(1, 1 + sd / depth))
      const mag = Math.pow(t, TAU.curve)

      // outward normal of the SDF (quadrant-local: points up-left)
      let nx = 0
      let ny = 0
      if (ox > 0 || oy > 0) {
        const len = Math.hypot(ox, oy)
        nx = -ox / len
        ny = -oy / len
      } else if (qx > qy) {
        nx = -1
      } else {
        ny = -1
      }

      const rc = Math.round(128 + nx * mag * 127)
      const gc = Math.round(128 + ny * mag * 127)

      // mirror into all four quadrants, flipping the bend with each axis
      put(x, y, rc, gc)
      put(w - 1 - x, y, 255 - rc, gc)
      put(x, h - 1 - y, rc, 255 - gc)
      put(w - 1 - x, h - 1 - y, 255 - rc, 255 - gc)
    }
  }

  ctx.putImageData(img, 0, 0)
  return canvas.toDataURL()
}

let generation = 0

export function LiquidGlass({ blur = 4, saturate = 1.25 }: { blur?: number; saturate?: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [glass, setGlass] = useState<{ id: string; w: number; h: number; map: string } | null>(null)
  // Safari/Firefox drop the whole declaration when it references an SVG
  // filter, so they get a plain frosted pane instead of refraction
  const [chromium, setChromium] = useState(false)

  useEffect(() => {
    setChromium(/Chrom(e|ium)/.test(navigator.userAgent))
    const el = ref.current
    if (!el) return
    const observer = new ResizeObserver(() => {
      const w = Math.round(el.offsetWidth)
      const h = Math.round(el.offsetHeight)
      if (!w || !h) return
      const radius = Math.min(w, h) / 2 // pill
      const map = makeDisplacementMap(w, h, radius)
      // a fresh id every update — Safari (and Chromium's feImage cache)
      // otherwise keep rendering the stale map
      setGlass(map ? { id: `lg-${++generation}`, w, h, map } : null)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const channel = (row: number) =>
    [0, 1, 2, 3]
      .map((r) => (r === 3 ? '0 0 0 1 0' : r === row ? `${+(row === 0)} ${+(row === 1)} ${+(row === 2)} 0 0` : '0 0 0 0 0'))
      .join('  ')

  return (
    <span
      ref={ref}
      className="liquid-glass"
      aria-hidden
      style={
        glass
          ? {
              backdropFilter: chromium
                ? `url(#${glass.id}) blur(${blur}px) saturate(${saturate})`
                : `blur(${blur * 3}px) saturate(${saturate})`,
            }
          : undefined
      }
    >
      {glass && chromium && (
        <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden>
          <filter
            id={glass.id}
            x="0"
            y="0"
            width={glass.w}
            height={glass.h}
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feImage
              href={glass.map}
              x="0"
              y="0"
              width={glass.w}
              height={glass.h}
              preserveAspectRatio="none"
              result="map"
            />
            {/* frost before the lens: the displacement bends diffused
                light, not raw glyphs — refracting sharp text smears it
                into legible-but-warped ghosts that read as grime */}
            <feGaussianBlur in="SourceGraphic" stdDeviation={TAU.frost} result="frost" />
            {/* chromatic fringe: each channel refracts at a slightly
                different strength, recombined additively */}
            <feDisplacementMap
              in="frost"
              in2="map"
              scale={TAU.scale * (1 - TAU.chroma)}
              xChannelSelector="R"
              yChannelSelector="G"
              result="dr"
            />
            <feColorMatrix in="dr" type="matrix" values={channel(0)} result="r" />
            <feDisplacementMap
              in="frost"
              in2="map"
              scale={TAU.scale}
              xChannelSelector="R"
              yChannelSelector="G"
              result="dg"
            />
            <feColorMatrix in="dg" type="matrix" values={channel(1)} result="g" />
            <feDisplacementMap
              in="frost"
              in2="map"
              scale={TAU.scale * (1 + TAU.chroma)}
              xChannelSelector="R"
              yChannelSelector="G"
              result="db"
            />
            <feColorMatrix in="db" type="matrix" values={channel(2)} result="b" />
            <feBlend in="r" in2="g" mode="screen" result="rg" />
            <feBlend in="rg" in2="b" mode="screen" />
          </filter>
        </svg>
      )}
    </span>
  )
}
