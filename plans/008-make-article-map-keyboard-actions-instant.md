# 008 - Make article-map keyboard actions instant

- **Status**: TODO
- **Commit**: dc24eb3
- **Severity**: HIGH
- **Category**: Purpose and frequency
- **Estimated scope**: 3 files, about 220 lines

## Problem

The article map has one open/close function for every input. Unless reduced
motion is active, it always runs Motion node animation:

```tsx
// components/post-toc.tsx:89-103 - current
function animateOpenState(nextOpen: boolean) {
  if (nextOpen === open) return

  const items = rootRef.current?.querySelectorAll<HTMLElement>('.post-minimap-node')
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  if (reducedMotion) {
    nodeAnimationRef.current?.cancel()
    nodeAnimationRef.current = null
    setOpen(nextOpen)
    return
  }
```

The later non-reduced branch always constructs Motion work:

```tsx
// components/post-toc.tsx:132-158 - current
const animation = animate(
  items,
  {
    opacity: nextOpen ? 1 : 0,
    transform: nextOpen
      ? 'translateY(0) rotate(0deg)'
      : 'translateY(-8px) rotate(2deg)',
  },
  {
    duration: closingDesktop
      ? DESKTOP_EXIT_DURATION
      : phone
        ? nextOpen
          ? PHONE_ENTER_DURATION
          : PHONE_EXIT_DURATION
        : nextOpen
          ? 0.26
          : 0.2,
    delay: stagger(
      closingDesktop ? desktopExitStagger : phone ? phoneStagger : nextOpen ? 0.012 : 0.01,
      { from: 'center' },
    ),
    ease: EASE_SWIFT,
  },
)
nodeAnimationRef.current = animation
flushSync(() => setOpen(nextOpen))
```

Escape uses that animated path:

```tsx
// components/post-toc.tsx:219-225 - current
if (!open || desktop) return
const onKeyDown = (event: KeyboardEvent) => {
  if (event.key !== 'Escape') return
  animateOpenState(false)
  toggleRef.current?.focus()
}
```

The click handlers discard native click modality. As a result, keyboard
toggle, landmark, and Back-to-top actions animate, and keyboard Back to top
also smooth-scrolls:

```tsx
// components/post-toc.tsx:291-292 - current landmark state/close
setActive(id)
if (!desktop) animateOpenState(false)
```

```tsx
// components/post-toc.tsx:302-306 - current Back-to-top action
function returnToTop() {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (!desktop) animateOpenState(false)
  window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' })
}
```

The three current JSX handlers at
`components/post-toc.tsx:337,424,442` are:

```tsx
onClick={() => animateOpenState(!open)}
onClick={(event) => visitLandmark(event, node.id)}
onClick={returnToTop}
```

Bypassing Motion alone is insufficient because the map surface, backdrop, and
icons also use CSS transitions in `app/globals.css:3256-3331`,
`3544-3562`, `3613-3644`, and `3752-3768`. This violates the keyboard hard
rule in `docs/design-language.md:51-53`.

## Target

Give open/close one explicit mode:

```tsx
// components/post-toc.tsx - target shape
type OpenMotion = 'animated' | 'instant'

function animateOpenState(
  nextOpen: boolean,
  motion: OpenMotion = 'animated',
) {
  if (motion === 'instant') {
    rootRef.current?.setAttribute('data-toggle-motion', 'instant')
  } else {
    rootRef.current?.removeAttribute('data-toggle-motion')
  }

  const reducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)',
  ).matches

  if (motion === 'instant' || reducedMotion) {
    nodeAnimationRef.current?.cancel()
    nodeAnimationRef.current = null
    if (nextOpen !== open) flushSync(() => setOpen(nextOpen))
    return
  }

  if (nextOpen === open) return

  // existing animated branch, unchanged
}
```

Keep the gate until pointer movement inside the map or the next explicit
animated map action removes it before changing state. This avoids a timer while
guaranteeing the keyboard state change is computed with CSS transitions
disabled and later pointer hover/click motion is restored.

Add this exact CSS gate beside the existing reduced-motion override:

```css
/* app/globals.css - target */
.post-minimap-root[data-toggle-motion='instant'] .post-minimap-backdrop,
.post-minimap-root[data-toggle-motion='instant'] .post-minimap,
.post-minimap-root[data-toggle-motion='instant'] .post-minimap-toggle-panel,
.post-minimap-root[data-toggle-motion='instant'] .post-minimap-toggle-chevron,
.post-minimap-root[data-toggle-motion='instant'] .post-minimap-island-chevron,
.post-minimap-root[data-toggle-motion='instant'] .post-minimap-node > a,
.post-minimap-root[data-toggle-motion='instant'] .post-minimap-tick,
.post-minimap-root[data-toggle-motion='instant'] .post-minimap-label {
  transition: none;
}
```

This persistent action gate deliberately excludes scroll-driven visibility.
Add a separate one-shot gate for visibility changes caused by a keyboard
landmark jump or keyboard Back-to-top action:

```css
/* app/globals.css - target */
.post-minimap-root[data-scroll-motion='instant'] .post-minimap-island,
.post-minimap-root[data-scroll-motion='instant'] .post-minimap-back-to-top {
  transition: none;
}
```

Ordinary scroll and resize measurement must keep the current island and
Back-to-top transitions. Before a `detail === 0` programmatic scroll, set
`data-scroll-motion="instant"` and an `instantScrollVisibilityRef`. Expose the
existing frame-deduplicated `requestMeasure` through a ref so the action can
request measurement even when `scrollTo` does not emit a scroll event. In the
measurement callback:

1. compute the next island and Back-to-top booleans once;
2. when the one-shot ref is set, `flushSync` both visibility states while the
   CSS gate is present;
3. call `rootRef.current?.getBoundingClientRect()` once so the no-transition
   result is committed;
4. remove only `data-scroll-motion` and clear the ref;
5. otherwise use the existing ordinary state updates unchanged.

This is not a timer and must not persist beyond that one measurement. It makes
the visibility consequences of keyboard scrolling immediate without flattening
later scroll-driven arrivals.

Because the instant gate persists until another map action, clear it on pointer
movement inside `.post-minimap-root` before hover or pointer-driven active-state
styles are computed. This keeps later pointer motion unchanged while ensuring a
keyboard-selected desktop landmark's label/tick state settles instantly.

Input behavior is exact:

- Toggle click with `event.detail === 0`: instant.
- Landmark click with `event.detail === 0`: set the instant gate before active
  state; compact maps close before the existing focus/hash/scroll work, while
  desktop stays open and its active label/tick settles instantly. Arm the
  one-shot scroll-visibility gate inside the existing scheduled callback,
  immediately before the programmatic scroll, so no unrelated measurement can
  consume it early.
- Back-to-top click with `event.detail === 0`: compact maps close instantly and
  desktop runs the same-state instant setter and stays open, followed by
  `scrollTo({ top: 0, behavior: 'auto' })`. The one-shot gate makes the phone
  island and Back-to-top visibility settle immediately.
- Escape: prevent default, close instant, restore toggle focus.
- Pointer movement clears a prior instant gate. Pointer/touch click
  (`detail > 0`), outside pointerdown, active landmark treatment, and the
  existing desktop first entrance preserve current animation and timing.
- Ordinary scroll/resize never sets the one-shot gate and keeps current island
  and Back-to-top timing.
- Pointer Back to top remains smooth unless reduced motion is active.

## Repo conventions to follow

- `docs/design-language.md:23-36` owns the current 150-260ms article-map UI
  motion and `--ease-swift`; do not retune pointer paths.
- `docs/design-language.md:51-53` makes keyboard actions instant.
- `components/post-toc.tsx:123-166` already pins the rendered frame and stops
  prior Motion work so pointer reversals remain interruptible. Keep that
  animated branch intact.
- `components/post-toc.tsx:95-100` is the reduced-motion cancellation
  exemplar. The instant branch uses the same cancellation, plus `flushSync` so
  follow-up focus/scroll observes closed semantics.
- `components/post-transition-link.tsx:31-37` and
  `components/bookshelf.test.tsx:68` establish `event.detail === 0` as the
  native keyboard-click convention.
- `components/post-toc.tsx:249-284` owns one frame-deduplicated scroll/resize
  measurement. Extend that path for the one-shot visibility flush instead of
  adding a second scroll listener or timer.
- `app/globals.css:3383-3409` and `3582-3611` own the Back-to-top and phone-island
  visibility transitions. Keyboard programmatic scroll suppresses only that one
  state change; ordinary scroll keeps these rules unchanged.
- The current reduced-motion CSS at `app/globals.css:3786-3800` stays the global
  fallback for all map motion.

## Steps

1. Add the exact `OpenMotion` union and optional second parameter to
   `animateOpenState`. Set or clear `data-toggle-motion` before the same-state
   return, reading items, or mutating open state so desktop callers can change
   modality without collapsing the map.
2. Merge `motion === 'instant'` into the current reduced-motion early branch.
   Cancel the active node animation, null its ref, and use
   `flushSync(() => setOpen(nextOpen))` only when state changes. A same-state
   desktop keyboard action must still cancel prior node Motion before returning.
   Do not run `motion.animate`, stagger, or any requestAnimationFrame for this
   branch.
3. Change the mobile/tablet Escape handler to prevent default, call
   `animateOpenState(false, 'instant')`, and then focus the toggle.
4. Pass the click event through the map toggle. Use `detail === 0` to select
   `instant`; pointer/touch keeps the default animated mode.
5. In `visitLandmark`, select instant mode for a keyboard click and animated
   mode for pointer/touch. For keyboard, call the instant same-state desktop
   setter or compact close before `setActive`, then arm one-shot visibility
   suppression inside the existing scheduled callback immediately before
   `scrollTo`. For pointer/touch, first clear a stale action gate through a
   same-state animated call, then preserve the current compact ordering exactly:
   `setActive` before animated close. Desktop pointer/touch remains open. Keep
   `preventDefault`, target focus, scroll offset, and `history.replaceState`
   unchanged; request the shared measurement after the programmatic scroll.
6. Change `returnToTop` to accept its React mouse event. Use instant mode and
   `behavior: 'auto'` for `detail === 0`; on desktop, explicitly call the
   same-state mode setter instead of skipping `animateOpenState`. Compact input
   keeps the close guard. Arm one-shot visibility suppression only for keyboard,
   keep smooth pointer scroll unless reduced motion is active, and request the
   shared measurement after `scrollTo`.
7. Add refs for the frame-deduplicated `requestMeasure` callback and the
   one-shot visibility mode. Refactor the existing measurement to compute both
   booleans before setting them. For a keyboard-requested measurement, follow
   the exact `flushSync` -> root layout read -> remove attribute/clear ref order
   from Target. Clear the callback ref during effect cleanup. Ordinary
   scroll/resize keeps the current asynchronous state path.
8. Add the exact eight-selector persistent action gate plus the exact
   two-selector one-shot scroll gate after the phone rules and before or beside
   the reduced-motion block. Add a root pointer-move handler that removes only
   `data-toggle-motion` before pointer hover/click state is painted.
9. Add `components/post-toc.test.tsx` under jsdom. Mock locale helpers,
   `next/link`, `motion.animate`, `motion.stagger`, `matchMedia`,
   requestAnimationFrame, and `scrollTo`. Use at least two landmark nodes so
   the map renders. Cover every case in the test plan below.

## Test plan

1. A toggle click with `detail: 0` updates `aria-expanded` immediately, sets
   `data-toggle-motion="instant"`, and never calls mocked `animate`.
2. Escape closes an open non-desktop map without Motion, calls
   `preventDefault`, and restores focus to the toggle.
3. A toggle click with `detail: 1` removes a prior instant gate and calls the
   existing Motion path.
4. Compact keyboard landmark activation closes before its scheduled
   focus/scroll, does not call Motion, keeps the 100px offset, and writes the
   same hash. Crossing the Back-to-top threshold uses and clears the one-shot
   gate in the measurement frame.
5. Compact keyboard Back to top observes `aria-expanded="false"` when
   `scrollTo` runs, receives `{ top: 0, behavior: 'auto' }`, and settles both
   island and Back-to-top visibility while the one-shot gate is present before
   clearing it.
6. Compact pointer Back to top receives `{ top: 0, behavior: 'smooth' }` and
   retains animated close without setting `data-scroll-motion`.
7. Outside pointerdown still uses animated close.
8. Reduced motion stays instant for pointer input even when the explicit gate
   is absent.
9. On desktop, keyboard landmark and Back-to-top actions leave
   `aria-expanded="true"`; the landmark's active label/tick sees the instant
   gate, Back to top uses `auto`, any existing node animation is canceled, and
   neither path starts node Motion.
10. Pointer movement after a keyboard action removes the instant gate; a
    desktop pointer landmark remains open and receives the current animated
    active treatment.
11. A compact pointer landmark preserves the existing order: active state is
    set before animated close, with current Motion timing intact.
12. An ordinary scroll/resize measurement never sets either instant attribute;
    island and Back-to-top visibility still use their current CSS transitions.

Use explicit `detail: 1` for pointer tests. `HTMLElement.click()` and the
Testing Library default produce `detail === 0`, which now correctly represents
a non-pointer activation.

## Boundaries

- Do NOT change map markup, landmark filtering, active tracking, 100px reading
  offset, hash replacement, focus semantics, inert/ARIA ownership, or locale
  labels.
- Do NOT change pointer/touch durations, easing, transforms, stagger windows,
  center-out ordering, outside dismissal, or interruptibility.
- Do NOT change the desktop first entrance or ordinary phone-island/Back-to-top
  scroll arrival. Only the one measurement caused by a keyboard programmatic
  scroll uses `data-scroll-motion="instant"`.
- Do NOT put `.post-minimap-island`, Back-to-top visibility, or unrelated
  utility transitions in the persistent `data-toggle-motion` gate. Their exact
  two selectors belong only to the self-clearing one-shot gate.
- Do NOT add a timer just to remove `data-toggle-motion`; pointer movement inside
  the map or the next explicit animated action clears it.
- Do NOT clear `data-scroll-motion` with a timer. The shared measurement must
  flush visibility, force the root style/layout read, and clear it immediately.
- Do NOT add a dependency or reintroduce the retired Playwright suite.
- If `animate.cancel()` leaves stale inline opacity or transform values in the
  installed Motion version, STOP and report the focused test/browser evidence
  instead of clearing arbitrary inline styles.
- If `data-open`, `.post-minimap-node`, or the cited CSS state selectors have
  structurally changed since `dc24eb3`, STOP and report instead of improvising.

## Verification

- **Mechanical**: run `pnpm vitest run components/post-toc.test.tsx`,
  `pnpm typecheck`, and `git diff --check`; all must exit 0.
- **Static check**:
  `rg -n "data-(toggle|scroll)-motion|type OpenMotion" components/post-toc.tsx app/globals.css`
  finds the state type, both narrowly-owned root attributes, one eight-selector
  persistent gate, and one two-selector self-clearing gate only.
- **Feel check**: test at phone, tablet, and desktop widths:
  - Real pointer/touch opening and closing preserves the current surface,
    160-260ms node motion, center-out stagger, icon motion, and reversal.
  - Focus the toggle and press Enter/Space. Surface, nodes, and icon finish in
    one frame with no running animation at 10% DevTools playback.
  - Escape from a pointer-opened map snaps closed and returns focus to toggle.
  - Keyboard-select a landmark. The map closes before focus/hash/scroll moves.
    At desktop width it stays open, while the new active label/tick settles
    without a transition. If the jump crosses the Back-to-top threshold, that
    control also settles in one frame.
  - Keyboard Back to top snaps closed before an instant scroll. Pointer Back to
    top remains smooth. At desktop width both actions leave the map open. On
    phone, the island and Back-to-top control disappear in the same frame as the
    keyboard jump; later ordinary scroll still animates their arrival.
  - After either desktop keyboard action, move a fine pointer inside the map;
    the instant gate clears before pointer hover/active motion resumes.
  - Pointer-down outside remains animated.
  - Reduced motion remains instant and keeps the existing semantics.
- **Done when**: every keyboard map action and Escape is immediate, only real
  pointer/touch map actions and ordinary scroll-driven visibility animate,
  smooth scrolling is pointer-only, and all focused tests pass without changing
  map structure or accessibility.
