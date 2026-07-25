'use client'

import Image, { type ImageProps } from 'next/image'
import { useEffect, useRef } from 'react'

import { playCoverSound } from '~/lib/sound'

const PIXEL = 2.5 // CSS px per dither cell
const ASCII_CELL = 7 // CSS px per ascii character cell
// density ramp signed with the site's own letters: only characters from
// "cali castle" plus - and + (no @/% blocks), light → dark by ink coverage
const RAMP = ' -li+tcsea'
const BAYER_ORDER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
]
const BAYER = BAYER_ORDER.map((row) => row.map((v) => (v + 0.5) / 16))

const PAPER = 'oklch(0.98 0.004 95)'
const INK = 'oklch(0.28 0.012 95)'

const SEEDS = 33
// thirteen voronoi patches (~3% each); alternating print styles
const PATCH_STYLES: Array<1 | 2> = [1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1]
// glitch rhythm: · — · · –  — a sharp full-coverage flash up front,
// then settling taps (≈9% → 39% → 12% → 12% → 12%)
const DOT = 70
const DASH = 160
const LONG = 260
const BEAT_GAP = 60
const BEATS: Array<[number, number[]]> = [
  [DOT, [0, 1, 2]],
  [LONG, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]],
  [DOT, [8, 9, 10, 11]],
  [DOT, [0, 2, 4, 6]],
  [DASH, [3, 5, 7, 9]],
]

// the Bayer dissolve: 16 discrete steps, one per threshold in the matrix
const DISSOLVE_STEP_MS = 38

function mulberry(seed: number): () => number {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function hashOf(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

export function DitheredImage({
  ditherMode = 'dither',
  src,
  ...imageProps
}: Omit<ImageProps, 'src'> & {
  ditherMode?: 'dither' | 'collage'
  src: string
}) {
  const imageRef = useRef<HTMLImageElement>(null)

  return (
    <>
      <Image {...imageProps} ref={imageRef} src={src} />
      <DitherVeil imageRef={imageRef} seed={src} mode={ditherMode} />
    </>
  )
}

// Physical print veil for covers, theme-invariant (paper + ink — the
// print is an object, not an interface).
// mode="dither": a full ordered-dither print that develops into the
// photo on the parent .group's hover/focus (CSS-driven opacity).
// mode="collage": an ENTRY glitch — scattered voronoi patches of dither
// and ascii flash to a morse-like rhythm (· — · · –), then the photo
// settles clean. Afterwards, CLICKING toggles photo ⇄ full dither print
// through a BAYER DISSOLVE: cells materialize in the order of the
// matrix's own 16 thresholds — the image passes through its own screen.
// Works on touch too. Reduced motion swaps instantly; glitch is skipped.
function DitherVeil({
  imageRef,
  seed,
  mode,
}: {
  imageRef: React.RefObject<HTMLImageElement | null>
  seed: string
  mode: 'dither' | 'collage'
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvasEl = canvasRef.current
    if (!canvasEl) return
    const sourceImage = imageRef.current
    if (!sourceImage) return
    const img: HTMLImageElement = sourceImage
    const canvas: HTMLCanvasElement = canvasEl
    const maybeCtx = canvas.getContext('2d')
    if (!maybeCtx) return
    const ctx: CanvasRenderingContext2D = maybeCtx

    let playing = false
    let prepared: { rect: DOMRect; dither: Grid; ascii: Grid; full: FullGrid } | null = null
    const timers: ReturnType<typeof setTimeout>[] = []

    function levels(cols: number, rows: number) {
      const off = document.createElement('canvas')
      off.width = cols
      off.height = rows
      const octx = off.getContext('2d', { willReadFrequently: true })
      if (!octx) return null
      octx.drawImage(img, 0, 0, cols, rows)
      const data = octx.getImageData(0, 0, cols, rows).data
      // iOS Safari can report the image loaded before its pixels are
      // decodable (or after evicting them under memory pressure) — the
      // draw then lands fully transparent, which would dither to solid
      // ink. Report failure so the caller retries instead of printing it.
      let sampled = false
      for (let i = 3; i < data.length; i += 4) {
        if (data[i] > 0) {
          sampled = true
          break
        }
      }
      if (!sampled) return null
      const lums = new Float32Array(cols * rows)
      for (let i = 0; i < lums.length; i++) {
        const j = i * 4
        lums[i] = (0.2126 * data[j] + 0.7152 * data[j + 1] + 0.0722 * data[j + 2]) / 255
      }
      const sorted = Float32Array.from(lums).sort()
      const lo = sorted[Math.floor(sorted.length * 0.05)]
      const hi = sorted[Math.floor(sorted.length * 0.95)]
      const range = Math.max(0.05, hi - lo)
      return { lums, norm: (v: number) => Math.min(1, Math.max(0, (v - lo) / range)) }
    }

    function sizeCanvas(rect: DOMRect) {
      const dpr = window.devicePixelRatio || 1
      canvas.width = Math.round(rect.width * dpr)
      canvas.height = Math.round(rect.height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, rect.width, rect.height)
    }

    function drawDitherFull(rect: DOMRect): boolean {
      const cols = Math.max(1, Math.round(rect.width / PIXEL))
      const rows = Math.max(1, Math.round(rect.height / PIXEL))
      const sample = levels(cols, rows)
      if (!sample) return false
      const cw = rect.width / cols
      const ch = rect.height / rows
      ctx.fillStyle = PAPER
      ctx.fillRect(0, 0, rect.width, rect.height)
      ctx.fillStyle = INK
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const lum = sample.norm(sample.lums[r * cols + c])
          if (1 - lum > BAYER[r % 4][c % 4]) ctx.fillRect(c * cw, r * ch, cw, ch)
        }
      }
      return true
    }

    // — collage glitch machinery —

    interface Grid {
      cols: number
      rows: number
      cell: number
      assign: Int16Array // patch id per cell, -1 = photo
      sample: NonNullable<ReturnType<typeof levels>>
    }

    // full-frame dither data for the click toggle (no voronoi involved)
    interface FullGrid {
      cols: number
      rows: number
      sample: NonNullable<ReturnType<typeof levels>>
    }

    function buildGrid(
      rect: DOMRect,
      cell: number,
      patchOf: (x: number, y: number) => number,
    ): Grid | null {
      const cols = Math.max(1, Math.round(rect.width / cell))
      const rows = Math.max(1, Math.round(rect.height / cell))
      const sample = levels(cols, rows)
      if (!sample) return null
      const assign = new Int16Array(cols * rows)
      for (let r = 0; r < rows; r++)
        for (let c = 0; c < cols; c++)
          assign[r * cols + c] = patchOf((c + 0.5) * cell, (r + 0.5) * cell)
      return { cols, rows, cell, assign, sample }
    }

    function drawPatches(rect: DOMRect, dither: Grid, ascii: Grid, visible: boolean[]) {
      ctx.clearRect(0, 0, rect.width, rect.height)
      for (let r = 0; r < dither.rows; r++) {
        for (let c = 0; c < dither.cols; c++) {
          const id = dither.assign[r * dither.cols + c]
          if (id < 0 || !visible[id] || PATCH_STYLES[id] !== 1) continue
          const x = c * dither.cell
          const y = r * dither.cell
          ctx.fillStyle = PAPER
          ctx.fillRect(x, y, dither.cell + 0.5, dither.cell + 0.5)
          const lum = dither.sample.norm(dither.sample.lums[r * dither.cols + c])
          if (1 - lum > BAYER[r % 4][c % 4]) {
            ctx.fillStyle = INK
            ctx.fillRect(x, y, dither.cell, dither.cell)
          }
        }
      }
      ctx.font = `${ASCII_CELL + 1}px ui-monospace, monospace`
      ctx.textBaseline = 'top'
      for (let r = 0; r < ascii.rows; r++) {
        for (let c = 0; c < ascii.cols; c++) {
          const id = ascii.assign[r * ascii.cols + c]
          if (id < 0 || !visible[id] || PATCH_STYLES[id] !== 2) continue
          const x = c * ascii.cell
          const y = r * ascii.cell
          ctx.fillStyle = PAPER
          ctx.fillRect(x, y, ascii.cell + 0.5, ascii.cell + 0.5)
          const lum = ascii.sample.norm(ascii.sample.lums[r * ascii.cols + c])
          const chr = RAMP[Math.min(RAMP.length - 1, Math.round((1 - lum) * (RAMP.length - 1)))]
          if (chr !== ' ') {
            ctx.fillStyle = INK
            ctx.fillText(chr, x, y)
          }
        }
      }
    }

    function prepare(rect: DOMRect) {
      const rand = mulberry(hashOf(seed))
      const seeds: Array<{ x: number; y: number }> = []
      for (let i = 0; i < SEEDS; i++)
        seeds.push({ x: rand() * rect.width, y: rand() * rect.height })
      // thirteen distinct seed cells become the flashing patches
      const patchSeeds: number[] = []
      while (patchSeeds.length < PATCH_STYLES.length) {
        const pick = Math.floor(rand() * SEEDS)
        if (!patchSeeds.includes(pick)) patchSeeds.push(pick)
      }
      const patchOf = (x: number, y: number): number => {
        let best = 0
        let bestD = Infinity
        for (let i = 0; i < seeds.length; i++) {
          const dx = x - seeds[i].x
          const dy = y - seeds[i].y
          const d = dx * dx + dy * dy
          if (d < bestD) {
            bestD = d
            best = i
          }
        }
        return patchSeeds.indexOf(best)
      }
      const dither = buildGrid(rect, PIXEL, patchOf)
      const ascii = buildGrid(rect, ASCII_CELL, patchOf)
      const cols = Math.max(1, Math.round(rect.width / PIXEL))
      const rows = Math.max(1, Math.round(rect.height / PIXEL))
      const fullSample = levels(cols, rows)
      prepared =
        dither && ascii && fullSample
          ? { rect, dither, ascii, full: { cols, rows, sample: fullSample } }
          : null
    }

    function play() {
      if (playing || !prepared) return
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
      playing = true
      const { rect, dither, ascii } = prepared
      let t = 0
      for (const [dur, patches] of BEATS) {
        const visible = PATCH_STYLES.map((_, i) => patches.includes(i))
        const at = t
        timers.push(setTimeout(() => drawPatches(rect, dither, ascii, visible), at))
        timers.push(setTimeout(() => ctx.clearRect(0, 0, rect.width, rect.height), at + dur))
        t += dur + BEAT_GAP
      }
      timers.push(
        setTimeout(() => {
          playing = false
        }, t),
      )
    }

    // — Bayer dissolve toggle: click turns the photo into the dither print —
    //
    // Fully interruptible: `level` counts how many of the 16 thresholds are
    // materialized, and a walker chases `target` one threshold per tick.
    // A click mid-dissolve just flips the target and the walker turns
    // around from wherever it is — each step is idempotent per slice.

    let level = 0
    let target = 0
    let stepTimer: ReturnType<typeof setTimeout> | null = null

    // paint (or clear) every cell whose position in the Bayer matrix holds
    // the given threshold order — one dissolve step
    function dissolveStep(order: number, toArt: boolean) {
      if (!prepared) return
      const { rect, full } = prepared
      const { cols, rows, sample } = full
      const cw = rect.width / cols
      const ch = rect.height / rows
      for (let r = 0; r < rows; r++) {
        const rowOrder = BAYER_ORDER[r % 4]
        for (let c = 0; c < cols; c++) {
          if (rowOrder[c % 4] !== order) continue
          const x = c * cw
          const y = r * ch
          if (!toArt) {
            ctx.clearRect(x, y, cw + 0.5, ch + 0.5)
            continue
          }
          const lum = sample.norm(sample.lums[r * cols + c])
          ctx.fillStyle = 1 - lum > BAYER[r % 4][c % 4] ? INK : PAPER
          ctx.fillRect(x, y, cw + 0.5, ch + 0.5)
        }
      }
    }

    function tick() {
      stepTimer = null
      if (level === target) return
      if (level < target) {
        dissolveStep(level, true)
        level++
      } else {
        dissolveStep(level - 1, false)
        level--
      }
      if (level !== target) {
        stepTimer = setTimeout(tick, DISSOLVE_STEP_MS)
      } else if (level === 0 && prepared) {
        // per-cell clearRect leaves antialiased grid residue on fractional
        // cell boundaries — one full clear snaps the photo truly clean
        ctx.clearRect(0, 0, prepared.rect.width, prepared.rect.height)
      }
    }

    const onToggle = () => {
      if (playing || !prepared) return
      const nextTarget = target === 16 ? 0 : 16
      playCoverSound(nextTarget === 16)
      target = nextTarget
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        const { rect } = prepared
        if (stepTimer) clearTimeout(stepTimer)
        stepTimer = null
        if (target === 16) drawDitherFull(rect)
        else ctx.clearRect(0, 0, rect.width, rect.height)
        level = target
        return
      }
      // first step lands immediately — the tap answers on contact
      if (!stepTimer) tick()
    }

    function render(): boolean {
      const rect = canvas.getBoundingClientRect()
      if (rect.width < 4) return true
      if (mode === 'dither') {
        sizeCanvas(rect)
        // a failed sample leaves the canvas clear — the plain photo is
        // the graceful fallback while the retries chase the decode
        return drawDitherFull(rect)
      }
      // collage glitch: prepare grids, play the entry rhythm once
      const first = !prepared
      sizeCanvas(rect)
      prepare(rect)
      if (!prepared) return false
      if (first) play()
      // resize: the canvas was cleared, so snap to wherever the walker
      // was headed
      else if (target === 16) {
        drawDitherFull(rect)
        level = 16
      } else {
        level = 0
      }
      return true
    }

    let cancelled = false
    let retries = 0

    function attemptRender() {
      if (cancelled) return
      if (!render() && retries < 4) {
        retries += 1
        timers.push(setTimeout(attemptRender, 150 * retries))
      }
    }

    // load/complete only promise the bytes, not decoded pixels — iOS
    // Safari samples blank in that gap. Render right away (a blank
    // sample retries instead of printing), and treat decode() purely as
    // an extra retry signal: it can stay pending forever in hidden
    // documents, so it must never gate the print.
    const startRender = () => {
      attemptRender()
      if (typeof img.decode === 'function') img.decode().then(attemptRender, () => {})
    }

    if (img.complete && img.naturalWidth > 0) startRender()
    else img.addEventListener('load', startRender, { once: true })

    const ro = new ResizeObserver(() => {
      if (img.complete && img.naturalWidth > 0) attemptRender()
    })
    ro.observe(canvas)

    const host = canvas.closest('.polaroid') as HTMLElement | null
    if (mode === 'collage' && host) {
      host.addEventListener('click', onToggle)
      host.style.cursor = 'pointer'
    }

    return () => {
      cancelled = true
      img.removeEventListener('load', startRender)
      ro.disconnect()
      if (host) {
        host.removeEventListener('click', onToggle)
        host.style.cursor = ''
      }
      if (stepTimer) clearTimeout(stepTimer)
      for (const t of timers) clearTimeout(t)
    }
  }, [imageRef, seed, mode])

  return <canvas ref={canvasRef} aria-hidden className="dither-veil" />
}
