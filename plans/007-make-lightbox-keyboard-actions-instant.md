# 007 - Make lightbox keyboard actions instant

- **Status**: TODO
- **Commit**: dc24eb3
- **Severity**: HIGH
- **Category**: Purpose and frequency
- **Estimated scope**: 2 files, about 100 lines

## Problem

The image lightbox uses the same 300ms physical pick-up and settle motion for
pointer and keyboard activation. The trigger does not inspect click modality:

```tsx
// components/zoom-image.tsx:147-160 - current
<button
  ref={triggerRef}
  type="button"
  className="zoom-trigger"
  style={style}
  aria-label={
    alt
      ? localize(locale, `放大图片：${alt}`, `Zoom image: ${alt}`)
      : localize(locale, '放大图片', 'Zoom image')
  }
  data-zoomed={zoom ? '' : undefined}
  onClick={open}
>
```

Every open starts at `opening` and waits two animation frames before settling:

```tsx
// components/zoom-image.tsx:83-89, 105-110 - current
setZoom({
  currentSrc: img.currentSrc || src,
  target,
  from: `translate(${tx}px, ${ty}px) scale(${s})`,
})
setState('opening')

useEffect(() => {
  if (!zoom || state !== 'opening') return
  const raf = requestAnimationFrame(() =>
    requestAnimationFrame(() => setState('open')),
  )
  return () => cancelAnimationFrame(raf)
}, [zoom, state])
```

Escape also takes the animated close path once the dialog is open:

```tsx
// components/zoom-image.tsx:97-103, 121-127 - current
const close = useCallback(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduced || stateRef.current === 'opening') unmount()
  else if (stateRef.current === 'open') setState('closing')
}, [unmount])

const onKey = (e: KeyboardEvent) => {
  if (e.key === 'Escape') close()
  if (e.key === 'Tab') e.preventDefault()
}
```

This conflicts with the hard rule in `docs/design-language.md:51-53` and the
motion audit frequency principle: keyboard-initiated actions are immediate.
The physical FLIP remains appropriate for pointer/touch pick-up, but it does
not explain a keyboard action.

## Target

Use the native click event's `detail` to distinguish activation:

- `event.detail === 0`: keyboard-generated click. Mount the overlay directly
  in `open` state, at its final transform and opacity. Do not schedule either
  opening animation frame.
- `event.detail > 0`: pointer/touch-generated click. Preserve the current
  `opening -> open` double-frame FLIP and all 300ms CSS values unless reduced
  motion is active.
- Any activation under `prefers-reduced-motion: reduce`: mount directly in
  `open`, regardless of click detail, and schedule no opening frame. Merely
  disabling CSS transitions is insufficient because an `opening` mount still
  exposes the transparent backdrop and `zoom.from` transform for two frames.
- Escape: call `preventDefault()`, unmount synchronously, and return focus to
  the trigger without entering `closing`.
- Overlay pointer click, wheel, touchmove, and resize: preserve their current
  close behavior. An open pointer-created photo still settles back over 300ms;
  a close during `opening` or reduced motion still unmounts directly.

Use an explicit close reason rather than reading the last global input:

```tsx
// components/zoom-image.tsx - target shape
type CloseReason = 'escape' | 'overlay' | 'viewport'

const open = useCallback(
  (event: React.MouseEvent<HTMLButtonElement>) => {
    // keep current measurement and zoom payload construction
    const keyboard = event.detail === 0
    const reduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches
    setZoom(/* current payload */)
    setState(keyboard || reduced ? 'open' : 'opening')
  },
  [/* current dependencies */],
)

const close = useCallback(
  (reason: CloseReason) => {
    const reduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches
    if (
      reason === 'escape' ||
      reduced ||
      stateRef.current === 'opening'
    ) {
      unmount()
    } else if (stateRef.current === 'open') {
      setState('closing')
    }
  },
  [unmount],
)
```

The existing CSS already renders a newly mounted `data-state="open"` overlay
at final opacity/transform without a starting-style rule, so no stylesheet
change is required. Pointer motion remains:

```css
/* app/globals.css:1276-1297 - unchanged */
.zoom-overlay-backdrop {
  opacity: 0;
  transition: opacity 300ms var(--ease-swift);
}

.zoom-overlay[data-state='open'] .zoom-overlay-backdrop {
  opacity: 1;
}

.zoom-overlay img {
  transition:
    transform 300ms var(--ease-swift),
    box-shadow 300ms var(--ease-swift);
}
```

## Repo conventions to follow

- `docs/design-language.md:23-36` reserves 300-350ms physical motion for
  picked-up photos and uses `--ease-swift` for the existing FLIP.
- `docs/design-language.md:51-53` makes all keyboard-initiated actions instant.
- `components/zoom-image.tsx:58-87` owns viewport fitting and the exact FLIP
  transform. Reuse it unchanged for both input modes so geometry and intrinsic
  size limits stay identical.
- `components/zoom-image.tsx:91-95` is the one cleanup path. Keep synchronous
  focus restoration there.
- jsdom interaction tests in `components/bookshelf.test.tsx` use
  `fireEvent.click(..., { detail: 0 })` to represent keyboard-generated clicks;
  follow that convention.

## Steps

1. In `components/zoom-image.tsx`, import the React mouse-event type if needed
   and change `open` to accept the trigger click event. Keep all measurement,
   intrinsic-size, and `zoom` payload logic unchanged. Set initial state to
   `open` for `detail === 0` or reduced motion, otherwise `opening`.
2. Add the exact close-reason union above. Change Escape to
   `preventDefault()` and `close('escape')`; wrap overlay click with
   `close('overlay')`; use `close('viewport')` for wheel, touchmove, and resize.
   Keep Tab trapping unchanged.
3. Confirm the double-requestAnimationFrame effect only sees non-reduced
   pointer-created `opening` state. Do not create a timer or synthetic
   transition for keyboard or reduced-motion opening.
4. Add `components/zoom-image.test.tsx` under jsdom. Mock `next/image` as a
   plain image, mock locale helpers, stub `matchMedia`, image geometry, and
   requestAnimationFrame. Cover every case listed in the test plan below.

## Test plan

Model setup after `components/bookshelf.test.tsx` and
`components/vinyl-shelf.test.tsx`:

1. Keyboard click (`detail: 0`) mounts a dialog whose `data-state` is already
   `open`; no requestAnimationFrame callback is scheduled.
2. Pressing Escape on that dialog prevents default, removes the portal in the
   same act, and restores focus to the trigger.
3. Pointer click (`detail: 1`) mounts `data-state="opening"`, schedules the
   existing two-frame promotion, and reaches `open` only after both callbacks.
4. Pointer click on an open overlay changes it to `closing`; the portal remains
   until image `transitionend`, then unmounts and restores focus.
5. Escape from a pointer-created open dialog bypasses `closing` and unmounts
   immediately.
6. Reduced motion still opens/closes without waiting for `transitionend` and
   does not schedule requestAnimationFrame or regress focus restoration. Cover
   a pointer click with `detail: 1`, not only the already-instant keyboard case.
7. Listener cleanup removes keydown, wheel, touchmove, and resize listeners on
   unmount.

## Boundaries

- Do NOT change viewport padding, intrinsic-size limits, expanded-content
  allowance, image source selection, portal target, ARIA, focus trap, or focus
  restoration.
- Do NOT change non-reduced pointer/touch FLIP geometry, 300ms timings, easing,
  backdrop, border radius, or shadow.
- Do NOT make overlay pointer click instant; only keyboard activation and
  Escape are newly instant in this plan.
- Do NOT replace the custom lightbox or add a dependency.
- Do NOT use global keydown history to infer how the trigger was activated;
  use the trigger click's `detail` and the explicit Escape reason.
- Do NOT add CSS `!important` overrides; the final-state mount is sufficient.
- If React/Testing Library no longer reports keyboard-generated clicks with
  `detail === 0`, STOP and report with a minimal reproduction instead of
  guessing from pointer type.
- If a newly mounted `data-state="open"` overlay animates in a supported
  browser despite having no starting style, STOP and report before adding CSS
  state machinery.

## Verification

- **Mechanical**: run `pnpm vitest run components/zoom-image.test.tsx`,
  `pnpm typecheck`, and `git diff --check`; all must exit 0.
- **Static check**: `git diff --quiet -- app/globals.css` exits 0 with no output.
- **Feel check**: on a post with a zoomable image:
  - Focus the image button and press Enter, then Space. The dialog is fully
    open on the first painted frame with no pick-up motion.
  - Press Escape. The dialog disappears immediately and focus returns to the
    exact image trigger.
  - With reduced motion off, pointer-click or touch-tap the same image. It still
    lifts from its inline geometry into the centered target over 300ms.
  - Pointer-click the open overlay. It still settles back to the inline image;
    Escape during that open state remains immediate.
  - At 10% DevTools playback, keyboard paths show no intermediate transform or
    opacity frame, while pointer paths preserve the existing FLIP.
  - Emulate `prefers-reduced-motion: reduce`; both input modes mount directly
    in their settled state with no opening requestAnimationFrame.
- **Done when**: keyboard opening, reduced-motion opening, and Escape closing are
  synchronous; non-reduced pointer pick-up/settle is unchanged; focus and
  listeners are correct; and all focused tests pass.
