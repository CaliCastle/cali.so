'use client'

import Image from 'next/image'
import { useReducedMotion } from 'framer-motion'
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

import { ExternalLabel } from '~/components/external-mark'
import { localize, useLocale } from '~/lib/locale-client'
import { books } from '~/lib/personal'

const DEFAULT_COVER_W = 148
const BOOK_H = 210
const CLAMP = 3.4
const DURATION = 650
const MIN_HIT = 44
const SHELF_GAP = 1

function waitForImageLoad(image: HTMLImageElement) {
  if (image.complete) return Promise.resolve()

  return new Promise<void>((resolve) => {
    const finish = () => {
      image.removeEventListener('load', finish)
      image.removeEventListener('error', finish)
      resolve()
    }

    image.addEventListener('load', finish)
    image.addEventListener('error', finish)
    if (image.complete) finish()
  })
}

async function prepareImage(image: HTMLImageElement) {
  image.loading = 'eager'
  await waitForImageLoad(image)
  if (image.naturalWidth > 0) await image.decode().catch(() => undefined)
}

// deterministic base lean 0.65–1.55°, alternating direction
function baseLean(i: number, title: string): number {
  let h = 0
  for (let c = 0; c < title.length; c++) h = (h * 31 + title.charCodeAt(c)) | 0
  const mag = 0.65 + (Math.abs(h) % 90) / 100
  return i % 2 ? -mag : mag
}

function targetTilt(i: number, open: number): number {
  if (i === open) return 0
  const d = Math.abs(i - open)
  const toward = i < open ? -1 : 1
  const lean =
    Math.abs(baseLean(i, books[i].title)) * Math.max(0.7, 1 - 0.04 * d) +
    Math.max(0, 1.85 - 0.26 * d)
  return Math.max(-CLAMP, Math.min(CLAMP, toward * lean))
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

// Project the visible 3D book (front cover + spine) onto the shelf's X axis.
// Static spine-width frames are translated to these bounds so the accordion
// retains its spacing without animating layout.
function coverWidth(book: (typeof books)[number]) {
  if (!book.coverWidth || !book.coverHeight) return DEFAULT_COVER_W
  return (BOOK_H * book.coverWidth) / book.coverHeight
}

const BOOK_COVER_WIDTHS = books.map(coverWidth)

function projectBookBounds(
  spine: number,
  nativeCoverWidth: number,
  rotateY: number,
  tilt: number,
) {
  const y = rotateY * (Math.PI / 180)
  const z = tilt * (Math.PI / 180)
  const cosY = Math.cos(y)
  const sinY = Math.sin(y)
  const cosZ = Math.cos(z)
  const sinZ = Math.sin(z)
  const centerY = BOOK_H / 2
  const projected: number[] = []
  const faces = [
    { depth: 0, xs: [0, spine] },
    { depth: spine, xs: [0, nativeCoverWidth] },
  ]

  for (const face of faces) {
    for (const x of face.xs) {
      for (const yPos of [0, BOOK_H]) {
        const localY = yPos - centerY
        projected.push((x * cosY + face.depth * sinY) * cosZ - localY * sinZ)
      }
    }
  }

  const left = Math.min(...projected)
  return {
    width: Math.max(...projected) - left,
    offsetX: -left,
  }
}

function pose(progress: number, tilt: number, spine: number, nativeCoverWidth: number) {
  const clamped = Math.max(0, Math.min(1, progress))
  const closed = 1 - clamped
  const rotateY = 90 * closed
  const visibleTilt = tilt * closed
  return {
    ...projectBookBounds(spine, nativeCoverWidth, rotateY, visibleTilt),
    rotateY,
    tilt: visibleTilt,
  }
}

function shelfPoses(progress: number[], tilts: number[]) {
  let baseX = 0
  let projectedX = 0

  return books.map((book, i) => {
    const spine = book.spine ?? 24
    const next = pose(progress[i], tilts[i], spine, BOOK_COVER_WIDTHS[i])
    const frameX = projectedX - baseX

    baseX += spine + SHELF_GAP
    projectedX += next.width + SHELF_GAP

    return { ...next, frameX }
  })
}

function projectedShelfWidth(progress: number[], tilts: number[]) {
  return shelfPoses(progress, tilts).reduce(
    (width, next, index) => width + next.width + (index === books.length - 1 ? 0 : SHELF_GAP),
    0,
  )
}

const MAX_PROJECTED_SHELF_WIDTH = Math.max(
  ...books.map((_, open) =>
    projectedShelfWidth(
      books.map((__, index) => (index === open ? 1 : 0)),
      books.map((__, index) => targetTilt(index, open)),
    ),
  ),
)

// Accordion bookshelf: one book open at a time showing its cover; the
// others stand as spines and lean toward the open book (harder when
// adjacent, decaying with distance). Clicking a closed spine swaps which
// book is open — everything settles together over 650ms. A new tap takes
// over from the current frame instead of restarting the previous motion.
// The books themselves are selection controls. The selected book's external
// destination lives in the persistent annotation below the plank.
export function Bookshelf() {
  const locale = useLocale()
  const shouldReduceMotion = useReducedMotion()
  const [open, setOpen] = useState(0)
  const targetRef = useRef(0)
  const frameRef = useRef(0)
  const viewportRef = useRef<HTMLDivElement | null>(null)
  const shelfRef = useRef<HTMLUListElement | null>(null)
  const bookRefs = useRef<Array<HTMLLIElement | null>>([])
  const controlRefs = useRef<Array<HTMLButtonElement | null>>([])
  const innerRefs = useRef<Array<HTMLSpanElement | null>>([])
  const coverRefs = useRef<Array<HTMLImageElement | null>>([])
  const coverReadyRef = useRef(books.map((book) => !book.art))
  const coverPreparationRef = useRef<Array<Promise<void> | undefined>>([])
  const selectionRequestRef = useRef(0)
  const boundsRef = useRef<Array<{ left: number; right: number }>>([])
  const pointerXRef = useRef<number | null>(null)
  const hoverRef = useRef<number | null>(null)
  const progressRef = useRef<number[]>(books.map((_, i) => (i === 0 ? 1 : 0)))
  const tiltRef = useRef(books.map((_, i) => targetTilt(i, 0)))

  const nearestBook = useCallback((pointerX: number, fallback = 0) => {
    let nearest = fallback
    let nearestDistance = Number.POSITIVE_INFINITY

    boundsRef.current.forEach((bounds, i) => {
      if (!bounds) return
      const distance =
        pointerX < bounds.left
          ? bounds.left - pointerX
          : pointerX > bounds.right
            ? pointerX - bounds.right
            : 0
      if (distance < nearestDistance) {
        nearest = i
        nearestDistance = distance
      }
    })

    return nearest
  }, [])

  const hoveredBook = useCallback(
    (pointerX: number) => {
      const first = boundsRef.current[0]
      const last = boundsRef.current.at(-1)
      if (
        !first ||
        !last ||
        pointerX < first.left - MIN_HIT / 2 ||
        pointerX > last.right + MIN_HIT / 2
      ) {
        return null
      }
      return nearestBook(pointerX)
    },
    [nearestBook],
  )

  const setHoverOwner = useCallback((next: number | null) => {
    const closed = next === targetRef.current ? null : next
    if (hoverRef.current === closed) return
    hoverRef.current = closed
    controlRefs.current.forEach((control, i) => {
      control?.toggleAttribute('data-hover', i === closed)
    })
  }, [])

  const pointerXInShelf = useCallback((clientX: number) => {
    const shelf = shelfRef.current
    if (!shelf) return null
    const bounds = shelf.getBoundingClientRect()
    const scale = bounds.width / shelf.offsetWidth || 1
    return (clientX - bounds.left) / scale
  }, [])

  const updateShelfScale = useCallback(() => {
    const viewport = viewportRef.current
    const shelf = shelfRef.current
    if (!viewport || !shelf) return
    const scale = Math.min(1, viewport.clientWidth / MAX_PROJECTED_SHELF_WIDTH)
    shelf.style.setProperty('--bookshelf-scale', scale.toFixed(4))
  }, [])

  const applyPoses = useCallback((progress: number[], tilts: number[]) => {
    let projectedX = 0

    shelfPoses(progress, tilts).forEach((next, i) => {
      const frame = bookRefs.current[i]
      const inner = innerRefs.current[i]
      boundsRef.current[i] = { left: projectedX, right: projectedX + next.width }
      projectedX += next.width + SHELF_GAP
      if (!frame || !inner) return

      frame.style.zIndex = progress[i] > 0.01 ? '2' : '1'
      frame.style.transform = `translateX(${next.frameX.toFixed(2)}px)`
      frame.style.setProperty(
        '--book-contact-scale',
        (next.width / BOOK_COVER_WIDTHS[i]).toFixed(4),
      )
      inner.style.transform = `translateX(${next.offsetX.toFixed(2)}px) rotate(${next.tilt.toFixed(3)}deg) rotateY(${next.rotateY.toFixed(3)}deg)`
    })

    if (pointerXRef.current !== null) {
      setHoverOwner(hoveredBook(pointerXRef.current))
    }
  }, [hoveredBook, setHoverOwner])

  const prepareBookCover = useCallback((index: number) => {
    if (coverReadyRef.current[index]) return Promise.resolve()

    const image = coverRefs.current[index]
    if (!image) return Promise.resolve()

    const pending = coverPreparationRef.current[index]
    if (pending) return pending

    const preparation = prepareImage(image).finally(() => {
      coverReadyRef.current[index] = true
      if (coverPreparationRef.current[index] === preparation) {
        coverPreparationRef.current[index] = undefined
      }
    })
    coverPreparationRef.current[index] = preparation
    return preparation
  }, [])

  const settleOn = useCallback(
    (nextOpen: number, mode: 'animated' | 'instant' = 'animated') => {
      if (nextOpen === targetRef.current && frameRef.current) return
      if (nextOpen === targetRef.current && progressRef.current[nextOpen] > 0.999) return
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
      targetRef.current = nextOpen
      setHoverOwner(pointerXRef.current === null ? null : hoveredBook(pointerXRef.current))
      setOpen(nextOpen)

      const fromProgress = progressRef.current.slice()
      const fromTilts = tiltRef.current.slice()
      const toProgress = books.map((_, i) => (i === nextOpen ? 1 : 0))
      const toTilts = books.map((_, i) => targetTilt(i, nextOpen))

      const finish = () => {
        progressRef.current = toProgress
        tiltRef.current = toTilts
        applyPoses(toProgress, toTilts)
        frameRef.current = 0
      }

      if (shouldReduceMotion || mode === 'instant') {
        finish()
        return
      }

      const started = performance.now()
      const tick = (now: number) => {
        const elapsed = Math.min(1, (now - started) / DURATION)
        const eased = easeInOutCubic(elapsed)
        const progress = fromProgress.map(
          (value, i) => value + (toProgress[i] - value) * eased,
        )
        const tilts = fromTilts.map(
          (value, i) => value + (toTilts[i] - value) * eased,
        )
        progressRef.current = progress
        tiltRef.current = tilts
        applyPoses(progress, tilts)

        if (elapsed < 1) {
          frameRef.current = requestAnimationFrame(tick)
          return
        }
        finish()
      }

      frameRef.current = requestAnimationFrame(tick)
    },
    [applyPoses, hoveredBook, setHoverOwner, shouldReduceMotion],
  )

  const selectBook = useCallback(
    (nextOpen: number, mode: 'animated' | 'instant' = 'animated') => {
      const request = ++selectionRequestRef.current
      if (coverReadyRef.current[nextOpen]) {
        settleOn(nextOpen, mode)
        return
      }

      void prepareBookCover(nextOpen).then(() => {
        if (selectionRequestRef.current === request) settleOn(nextOpen, mode)
      })
    },
    [prepareBookCover, settleOn],
  )

  useLayoutEffect(() => {
    applyPoses(progressRef.current, tiltRef.current)
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
    }
  }, [applyPoses])

  useLayoutEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return
    updateShelfScale()
    const observer = new ResizeObserver(updateShelfScale)
    observer.observe(viewport)
    return () => observer.disconnect()
  }, [updateShelfScale])

  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport || !('IntersectionObserver' in window)) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return
        books.forEach((_, index) => void prepareBookCover(index))
        observer.disconnect()
      },
      { rootMargin: '320px 0px' },
    )
    observer.observe(viewport)
    return () => observer.disconnect()
  }, [prepareBookCover])

  useEffect(() => {
    return () => {
      selectionRequestRef.current += 1
    }
  }, [])

  useEffect(() => {
    if (!shouldReduceMotion || !frameRef.current) return
    cancelAnimationFrame(frameRef.current)
    frameRef.current = 0
    const nextOpen = targetRef.current
    const progress = books.map((_, i) => (i === nextOpen ? 1 : 0))
    const tilts = books.map((_, i) => targetTilt(i, nextOpen))
    progressRef.current = progress
    tiltRef.current = tilts
    applyPoses(progress, tilts)
  }, [applyPoses, shouldReduceMotion])

  const handleShelfClickCapture = useCallback(
    (event: React.MouseEvent<HTMLUListElement>) => {
      // Native keyboard activation already targets the focused control.
      if (event.detail === 0 || !(event.target instanceof Element)) return
      const control = event.target.closest<HTMLElement>('.book3')
      if (!control) return
      const clicked = bookRefs.current.findIndex((frame) => frame?.contains(control))
      if (clicked < 0) return

      const pointerX = pointerXInShelf(event.clientX)
      if (pointerX === null) return
      const nearest = nearestBook(pointerX, clicked)

      // Expanded hit areas can overlap; always give the tap to the nearest
      // visible spine rather than whichever pseudo-element happens to paint last.
      if (nearest === clicked) return
      event.preventDefault()
      event.stopPropagation()
      selectBook(nearest)
      controlRefs.current[nearest]?.focus()
    },
    [nearestBook, pointerXInShelf, selectBook],
  )

  const handleShelfPointerMove = useCallback(
    (event: React.PointerEvent<HTMLUListElement>) => {
      if (event.pointerType === 'touch') {
        pointerXRef.current = null
        setHoverOwner(null)
        return
      }
      if (!(event.target instanceof Element) || !event.target.closest('.book3')) {
        pointerXRef.current = null
        setHoverOwner(null)
        return
      }
      const pointerX = pointerXInShelf(event.clientX)
      if (pointerX === null) return
      const hovered = hoveredBook(pointerX)
      if (hovered === null) {
        pointerXRef.current = null
        setHoverOwner(null)
        return
      }
      pointerXRef.current = pointerX
      setHoverOwner(hovered)
    },
    [hoveredBook, pointerXInShelf, setHoverOwner],
  )

  const handleBookKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
      let next: number | null = null
      if (event.key === 'ArrowLeft') next = (index - 1 + books.length) % books.length
      if (event.key === 'ArrowRight') next = (index + 1) % books.length
      if (event.key === 'Home') next = 0
      if (event.key === 'End') next = books.length - 1
      if (next === null) return
      event.preventDefault()
      selectBook(next, 'instant')
      controlRefs.current[next]?.focus()
    },
    [selectBook],
  )

  const handleShelfPointerLeave = useCallback(() => {
    pointerXRef.current = null
    setHoverOwner(null)
  }, [setHoverOwner])

  if (books.length === 0) return null
  const renderedPoses = shelfPoses(progressRef.current, tiltRef.current)
  const selectedBook = books[open]

  return (
    <div className="room-shelf bookshelf-room">
      <div ref={viewportRef} className="bookshelf-viewport">
        <ul
          ref={shelfRef}
          className="shelf3"
          aria-label={localize(locale, '书架', 'Bookshelf')}
          onClickCapture={handleShelfClickCapture}
          onPointerMove={handleShelfPointerMove}
          onPointerLeave={handleShelfPointerLeave}
          style={
            {
              '--bookshelf-layout-width': `${MAX_PROJECTED_SHELF_WIDTH.toFixed(2)}px`,
              '--bookshelf-scale': 1,
            } as React.CSSProperties
          }
        >
        {books.map((book, i) => {
          const isOpen = i === open
          const spine = book.spine ?? 24
          const nativeCoverWidth = BOOK_COVER_WIDTHS[i]
          const initialPose = renderedPoses[i]
          const content = (
            <span
              ref={(node) => {
                innerRefs.current[i] = node
              }}
              className="book3-inner"
              style={{
                width: `${nativeCoverWidth.toFixed(2)}px`,
                transform: `translateX(${initialPose.offsetX.toFixed(2)}px) rotate(${initialPose.tilt.toFixed(3)}deg) rotateY(${initialPose.rotateY.toFixed(3)}deg)`,
              }}
            >
              <span className="book3-cover" style={{ transform: `translateZ(${spine}px)` }}>
                {book.art ? (
                  <Image
                    ref={(node) => {
                      coverRefs.current[i] = node
                    }}
                    src={book.art}
                    alt=""
                    width={book.coverWidth ?? Math.round(nativeCoverWidth)}
                    height={book.coverHeight ?? BOOK_H}
                    sizes={`${Math.ceil(nativeCoverWidth)}px`}
                  />
                ) : (
                  <span className="book3-cover-blank">
                    <b>{book.title}</b>
                    {book.author}
                  </span>
                )}
              </span>
              <span
                className="book3-spine"
                style={
                  {
                    width: spine,
                    '--book-spine': book.spineColor,
                    '--book-ink': book.spineInk,
                  } as React.CSSProperties
                }
              >
                <span className="book3-spine-title">{book.spineTitle ?? book.title}</span>
                <span className="book3-spine-author">{book.spineAuthor ?? book.author}</span>
              </span>
            </span>
          )

          return (
            <li
              key={book.title}
              ref={(node) => {
                bookRefs.current[i] = node
              }}
              className="book3-frame"
              style={
                {
                  width: spine,
                  zIndex: progressRef.current[i] > 0.01 ? 2 : 1,
                  transform: `translateX(${initialPose.frameX.toFixed(2)}px)`,
                  '--book-contact-width': `${nativeCoverWidth.toFixed(2)}px`,
                  '--book-contact-scale': (initialPose.width / nativeCoverWidth).toFixed(4),
                } as React.CSSProperties
              }
            >
              <span className="book3-contact-shadow" aria-hidden />
              <button
                ref={(node) => {
                  controlRefs.current[i] = node
                }}
                type="button"
                className="book3"
                data-open={isOpen || undefined}
                aria-current={isOpen ? 'true' : undefined}
                aria-pressed={isOpen}
                tabIndex={isOpen ? 0 : -1}
                aria-label={`${book.title} by ${book.author} ${
                  isOpen
                    ? localize(locale, '（当前展示）', '(currently shown)')
                    : localize(locale, '（选择）', '(select)')
                }`}
                onKeyDown={(event) => handleBookKeyDown(event, i)}
                onPointerDown={() => void prepareBookCover(i)}
                onFocus={() => void prepareBookCover(i)}
                onClick={(event) => selectBook(i, event.detail === 0 ? 'instant' : 'animated')}
              >
                {content}
              </button>
            </li>
          )
        })}
        </ul>
      </div>
      <span className="room-shelf-plank" aria-hidden />
      {selectedBook.url && (
        <a
          className="shelf-annotation"
          href={selectedBook.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${selectedBook.title} by ${selectedBook.author} ${localize(
            locale,
            '（在新标签页中打开）',
            '(opens in a new tab)',
          )}`}
        >
          <ExternalLabel>{selectedBook.title}</ExternalLabel>
        </a>
      )}
    </div>
  )
}
