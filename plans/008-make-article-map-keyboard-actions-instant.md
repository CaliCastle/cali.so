# 008 - Make article-map keyboard actions instant

- **Status**: TODO
- **Commit**: 59a39bc
- **Severity**: HIGH
- **Category**: Purpose and frequency
- **Estimated scope**: 4 files, about 400 lines

## Problem

The article map still has one open/close path for every input. Its reduced-motion
branch cancels both node and phone-panel Motion controls and clears their inline
state, but keyboard input does not select that settled path:

```tsx
// components/post-toc.tsx:125-155 - current
function animateOpenState(nextOpen: boolean) {
  if (nextOpen === open) return

  const items = rootRef.current?.querySelectorAll<HTMLElement>('.post-minimap-node')
  const panel = panelRef.current
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  if (reducedMotion) {
    nodeAnimationRef.current?.cancel()
    nodeAnimationRef.current = null
    panelAnimationRef.current?.cancel()
    panelAnimationRef.current = null
    for (const item of items ?? []) {
      item.style.removeProperty('filter')
      item.style.removeProperty('opacity')
      item.style.removeProperty('transform')
    }
    panel?.style.removeProperty('opacity')
    panel?.style.removeProperty('transform')
    panel?.style.removeProperty('will-change')
    setOpen(nextOpen)
    return
  }
```

The non-reduced phone path now has two independently interruptible animations.
PRs #170 and #172 made the panel a 280/260ms Motion surface and the nodes a
180/160ms first-in/last-out cascade over a 100ms stagger window, including the
accepted 2px develop blur:

```tsx
// components/post-toc.tsx:171-260 - current, abbreviated
flushSync(() => setOpen(nextOpen))

if (phone && panel) {
  const panelAnimation = animate(
    panel,
    {
      opacity: nextOpen ? 1 : 0,
      transform: nextOpen ? PHONE_PANEL_VISIBLE_TRANSFORM : PHONE_PANEL_HIDDEN_TRANSFORM,
    },
    {
      duration: nextOpen ? PHONE_PANEL_ENTER_DURATION : PHONE_PANEL_EXIT_DURATION,
      ease: EASE_SWIFT,
    },
  )
  panelAnimationRef.current = panelAnimation
}

const itemKeyframes = phone
  ? {
      filter: nextOpen ? 'blur(0px)' : PHONE_NODE_HIDDEN_FILTER,
      opacity: nextOpen ? 1 : 0,
      transform: itemTransform,
    }
  : { opacity: nextOpen ? 1 : 0, transform: itemTransform }

const animation = animate(items, itemKeyframes, {
  duration: closingDesktop
    ? DESKTOP_EXIT_DURATION
    : phone
      ? nextOpen
        ? PHONE_NODE_ENTER_DURATION
        : PHONE_NODE_EXIT_DURATION
      : nextOpen
        ? 0.26
        : 0.2,
  delay: stagger(
    closingDesktop ? desktopExitStagger : phone ? phoneStagger : nextOpen ? 0.012 : 0.01,
    { from: phone ? (nextOpen ? 'first' : 'last') : 'center' },
  ),
  ease: EASE_SWIFT,
})
```

Phone-island arrival and retreat are a third Motion control, separate from
open/close. The effect pins the rendered frame, then always starts Motion when
`phoneIslandVisible` changes outside reduced motion:

```tsx
// components/post-toc.tsx:315-383 - current, abbreviated
islandAnimationRef.current?.stop()
const visible = phoneIslandVisible

// initialize or pin current opacity/transform

if (reducedMotion) {
  islandAnimationRef.current = null
  island.style.opacity = targetOpacity
  island.style.transform = targetTransform
  island.style.removeProperty('will-change')
  return
}

const animation = animate(
  island,
  { opacity: visible ? 1 : 0, transform: targetTransform },
  {
    duration: visible ? PHONE_ISLAND_ENTER_DURATION : PHONE_ISLAND_EXIT_DURATION,
    ease: EASE_SWIFT,
  },
)
islandAnimationRef.current = animation
```

The click handlers still discard native click modality, and Escape still takes
the animated path:

```tsx
// components/post-toc.tsx:385-471, 504, 592, 610 - current
if (event.key !== 'Escape') return
animateOpenState(false)

setActive(id)
if (!desktop) animateOpenState(false)

function returnToTop() {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (!desktop) animateOpenState(false)
  window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' })
}

onClick={() => animateOpenState(!open)}
onClick={(event) => visitLandmark(event, node.id)}
onClick={returnToTop}
```

Keyboard Back to top therefore smooth-scrolls and starts the scroll-driven
island retreat. Keyboard landmark jumps can also cross the Back-to-top
threshold. CSS suppression alone cannot settle the island because
`.post-minimap-island` has no transition at `app/globals.css:3628-3654`; its
opacity and transform are owned by the effect above. This conflicts with the
keyboard hard rule in `docs/design-language.md:51-53`.

## Target

### Explicit open/close modality

Give open/close one explicit mode and merge instant input into the current
reduced-motion settlement branch:

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

  const items = rootRef.current?.querySelectorAll<HTMLElement>('.post-minimap-node')
  const panel = panelRef.current
  const reducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)',
  ).matches

  if (motion === 'instant' || reducedMotion) {
    nodeAnimationRef.current?.cancel()
    nodeAnimationRef.current = null
    panelAnimationRef.current?.cancel()
    panelAnimationRef.current = null

    for (const item of items ?? []) {
      item.style.removeProperty('filter')
      item.style.removeProperty('opacity')
      item.style.removeProperty('transform')
    }
    panel?.style.removeProperty('opacity')
    panel?.style.removeProperty('transform')
    panel?.style.removeProperty('will-change')

    if (nextOpen !== open) flushSync(() => setOpen(nextOpen))
    return
  }

  if (nextOpen === open) return

  // Current non-reduced animated branch remains behaviorally unchanged.
}
```

The modality gate must be written before the same-state return, DOM reads, or
state change. A same-state desktop keyboard landmark or Back-to-top action must
still cancel an active node control. A same-state animated call must clear a
stale gate without interrupting the current pointer animation.

The initially open desktop map also needs a keyboard entry path before any
click handler runs. Add a root-local `pointerFocusPendingRef`. Set it in
`onPointerDownCapture` and queue a same-task microtask fallback that clears it
if no focus event consumes it. In `onFocusCapture`, read and clear the ref
first. If that focus was pointer-created, return even when the descendant
matches `:focus-visible`; otherwise, a `:focus-visible` descendant calls
`animateOpenState(open, 'instant')`. This writes the persistent gate and
settles any in-flight desktop entrance before the focus-visible label/tick
styles paint. On phone, the same keyboard-focus path also directly cancels and
settles an in-flight island arrival at the current `phoneIslandVisible` target
without arming an effect-skip ref because the state value is unchanged.

The local pointer guard is required because a user's focus-indicator preference
may make pointer focus match `:focus-visible`; pointer/touch focus must never
cancel an active reversal before its `detail > 0` click clears the gate. Do not
infer focus modality from global input history.

Keep the persistent gate until pointer movement inside the map or the next
explicit animated map action removes it. It owns CSS transitions that remain
outside Motion:

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

On phone, JavaScript cancellation settles panel opacity/transform while the
`.post-minimap` selector above removes its delayed visibility transition. On
tablet and desktop, the same selector removes the CSS rail transition.

### One-shot programmatic-scroll and reduced-motion settlement

Use a separate one-shot path for the visibility consequences of a keyboard
landmark jump or keyboard Back-to-top action. CSS owns only the Back-to-top
fade:

```css
/* app/globals.css - target */
.post-minimap-root[data-scroll-motion='instant'] .post-minimap-back-to-top {
  transition: none;
}
```

Do not add `.post-minimap-island` to that selector. Add `measureNowRef` for the
shared immediate measurement callback, plus refs for the pending instant
measurement, the phone-query value, and the one island target whose replacement
effect must be skipped. Keep the existing frame-deduplicated wrapper for
ordinary scroll and resize.

For a keyboard or reduced-motion programmatic scroll:

1. when `detail === 0`, set `data-scroll-motion="instant"` and arm the instant
   measurement ref; a reduced-motion pointer/touch action sets neither because
   the media query already suppresses CSS transitions;
2. perform the existing `scrollTo`;
3. invoke `measureNowRef.current` synchronously in the same click callback or
   existing landmark animation frame, even if the browser emits no `scroll`
   event. Do not schedule a second animation frame for either settled path.

The shared measurement computes the next Back-to-top and island booleans once.
It uses the settled path when either the keyboard one-shot is armed or reduced
motion is active. For reduced ordinary scroll/resize, the global media query
already disables Back-to-top CSS transition and no root attribute is needed;
the JavaScript settle is still required to remove an in-flight island frame
before paint. The settled measurement must:

1. cancel and null any current `islandAnimationRef`;
2. remove the island's inline `opacity`, `transform`, and `will-change` so the
   current CSS state can settle rather than preserving an in-flight frame;
3. when a phone island visibility value will change, store that exact boolean
   in `instantIslandTargetRef`; when it will not change, leave the skip ref
   clear because no replacement effect will run;
4. `flushSync` both visibility state writes while either the keyboard
   Back-to-top CSS gate or the reduced-motion media override is active;
5. synchronously restore the island's exact final inline opacity/transform and
   clear `will-change`, preserving the settled inline baseline that later
   ordinary island reversals use;
6. force one root style/layout read, then remove only `data-scroll-motion` and
   clear the pending measurement ref.

Factor cancel/null, the exact final opacity/transform write, and `will-change`
removal into one local island-settlement helper. The measurement path calls it
after its required pre-flush inline clearing; focus-visible entry may call it
directly with the unchanged `phoneIslandVisible` value. Direct same-value
settlement marks the island initialized but never arms
`instantIslandTargetRef`, because no effect will run for an unchanged state
value.

At the start of the existing phone-island effect, consume a matching
`instantIslandTargetRef`: write the same final inline values, clear the ref, and
mark `phoneIslandInitializedRef` true, then return before `stop`,
`getComputedStyle`, or `animate`. The initialization write preserves later
ordinary reversal; without it, the next retreat could take the first-hidden
shortcut and snap. The direct measurement settle prevents a stale painted
frame, and the effect guard prevents replacement Motion after the CSS gate is
gone. If the visibility value did not change, the measurement itself settles an
in-flight island control and no skip ref remains.
Ordinary non-reduced scroll and resize never arm either ref and keep the current
interruptible island Motion. Reduced scroll and resize use the same direct
settle without setting either instant attribute.

Expose an immediate wrapper around the same measurement body. It cancels any
already queued measurement frame before measuring, while the existing scroll
and resize listeners continue to use the frame-deduplicated request wrapper.
This one-shot path is shared-measurement-owned, not timer- or extra-frame-owned.
Clear its callback and pending refs during effect cleanup.

### Exact input behavior

- Toggle click with `event.detail === 0`: settle node and panel controls,
  update open state instantly, and disable icon/surface CSS transitions.
- Focus entering any map control through `:focus-visible` without a pending
  root pointerdown: run the instant same-state setter before paint. The
  initially open desktop map stays open, cancels any in-flight entrance, and
  applies label/tick focus styles without a transition. Phone focus also
  settles an in-flight island arrival. Pointer/touch focus remains on the
  animated path even when it matches `:focus-visible`.
- Landmark click with `event.detail === 0`: run the instant same-state desktop
  setter or compact close before `setActive`. Arm the one-shot scroll path
  inside the existing scheduled callback, immediately before `scrollTo`.
- Back-to-top click with `event.detail === 0`: compact maps close instantly;
  desktop runs the same-state instant setter and stays open. Then use
  `scrollTo({ top: 0, behavior: 'auto' })` and the one-shot visibility settle.
- Escape: prevent default, close instantly, then restore toggle focus.
- Pointer/touch click (`detail > 0`): clear a stale persistent gate, preserve
  current panel/node/island controls, pointer ordering, timings, easing,
  transforms, blur, reversal, and touch behavior. Reduced motion still selects
  the settled branch before paint; after a programmatic scroll it invokes the
  immediate measurement without setting an instant attribute.
- Pointer Back to top remains smooth unless reduced motion is active.
- Outside pointerdown remains an animated close. Ordinary scroll/resize keeps
  current island and Back-to-top behavior.

## Repo conventions to follow

- `docs/design-language.md:51-53` makes keyboard actions instant.
- `docs/design-language.md:49-53, 72-74` owns the property, frequency, and
  reduced-motion hard rules. This plan records the already accepted 2px phone
  develop-blur exception and makes keyboard/reduced state settle before paint.
- `components/post-toc.tsx:16-28` owns the accepted PR #170/#172 phone
  durations, hidden transforms, and 2px node blur.
- `components/post-toc.tsx:125-260` owns node/panel cancellation, inline style
  cleanup, frame pinning, and interruptible reversal. Reuse that cleanup and
  keep the animated branch behaviorally unchanged.
- `components/post-toc.tsx:315-383` owns interruptible phone-island arrival.
  The keyboard/reduced settled path must bypass it without weakening later
  ordinary scroll reversal.
- `components/post-toc.tsx:409-450` owns one frame-deduplicated scroll/resize
  measurement. Extend it instead of adding a second listener or timer.
- `components/post-transition-link.tsx:31-37` and
  `components/bookshelf.test.tsx:68` establish `event.detail === 0` as the
  native non-pointer click convention.
- `app/globals.css:3257-3332`, `3590-3608`, `3656-3685`, and `3776-3793` own
  the remaining rail, visibility, and icon CSS transitions.
- `app/globals.css:3384-3409` owns Back-to-top opacity. The one-shot CSS gate
  suppresses only the keyboard-requested threshold change.
- `app/globals.css:3811-3824` remains the global reduced-motion CSS fallback;
  JavaScript still has to settle Motion-owned node, panel, and island values.
- `docs/design-language.md:400-435` predates the accepted directional phone
  sequence and must be reconciled as part of this plan.

## Steps

1. Add the exact `OpenMotion` union and optional second parameter to
   `animateOpenState`. Write or clear `data-toggle-motion` before any same-state
   return or mutation.
2. Merge `motion === 'instant'` into the current reduced-motion early branch.
   Cancel and null both node and panel controls, remove every current inline
   filter/opacity/transform/will-change value listed in Target, and use
   `flushSync` only when open state changes. Do not start Motion, stagger, or a
   requestAnimationFrame from this branch.
3. Change compact Escape to prevent default, call
   `animateOpenState(false, 'instant')`, and then focus the toggle.
4. Add `pointerFocusPendingRef` plus root capture handlers. Set it on
   pointerdown and queue a same-task microtask fallback that clears it when no
   focus event occurs. `onFocusCapture` consumes and clears the ref first. Run
   the instant same-state setter before focus styles paint only for a
   non-pointer `:focus-visible` descendant. On phone, also directly cancel/null
   the island control and write its exact current visible/hidden target without
   an effect-skip ref. Then pass the click event through the map toggle and use
   `detail === 0` to select instant mode. Pointer/touch focus and clicks keep
   animated mode.
5. In `visitLandmark`, select mode from click detail. Keyboard calls the
   instant same-state desktop setter or compact close before `setActive`.
   Pointer/touch first clears a stale gate through a same-state animated call,
   then preserves the current compact order exactly: `setActive` before the
   animated close. Desktop pointer/touch stays open.
6. Inside the existing landmark requestAnimationFrame, arm keyboard visibility
   settlement immediately before the current programmatic scroll. After
   `scrollTo`, invoke the immediate shared measurement in that same frame when
   `detail === 0` or reduced motion is active. A reduced pointer/touch action
   sets no instant attribute. Preserve target focus, 100px offset, hash, and
   `history.replaceState`.
7. Change `returnToTop` to accept its React mouse event. On desktop explicitly
   call the same-state mode setter; compact input keeps the close guard. Use
   `auto` plus the one-shot CSS gate only for `detail === 0`. Preserve smooth
   non-reduced pointer scrolling. Invoke the immediate shared measurement
   synchronously after `scrollTo` when `detail === 0` or reduced motion is
   active; reduced pointer/touch sets no instant attribute.
8. Expose an immediate wrapper around the existing measurement body through
   `measureNowRef` and add the pending measurement, phone-query, and exact
   island-target refs described in Target. Ordinary scroll/resize keeps the
   existing frame-deduplicated requester; the immediate wrapper cancels a
   queued frame before calling the same body. Compute both visibility booleans
   and reduced-motion state once. Use the exact cancel -> clear inline state ->
   flush visibility -> restore final island state -> root layout read -> clear
   measurement gate sequence for an armed keyboard scroll or any reduced-motion
   measurement. Clear callback and pending refs in cleanup.
9. Add the matching-target early return to the phone-island effect before it
   pins a frame or starts Motion. Mark the island initialized before returning
   so the next ordinary reversal still animates. Keep ordinary initialization,
   reduced motion, interruptibility, completion cleanup, and viewport-change
   cleanup unchanged.
10. Add the exact eight-selector persistent gate and one-selector Back-to-top
    scroll gate after the phone rules and before or beside reduced motion. Add
    a root pointer-move handler that removes only `data-toggle-motion`.
11. Update `docs/design-language.md:400-435` to distinguish the accepted
    desktop/tablet center-out node sequence from the phone 100ms first-in,
    last-out cascade. Record the current 280/260ms island/panel, 180/160ms node,
    and 2px phone develop-blur contract. Reaffirm that keyboard and reduced
    motion settle every control before paint, touch behavior stays unchanged,
    and no map motion changes width, height, or layout geometry.
12. Add `components/post-toc.test.tsx` under jsdom. Mock locale helpers,
    `next/link`, `motion.animate`, `motion.stagger`, `matchMedia`,
    requestAnimationFrame, geometry/style reads, and `scrollTo`. Return distinct
    controllable Motion objects for node, panel, and island targets. Use at
    least two landmarks so the map renders.

## Test plan

1. A keyboard toggle (`detail: 0`) updates `aria-expanded` in the same act,
   sets `data-toggle-motion="instant"`, cancels existing node and panel
   controls, clears their exact inline state, and starts no replacement Motion.
2. A phone keyboard toggle settles both panel and node final styles. A pointer
   toggle (`detail: 1`) removes a prior gate and preserves separate panel/node
   Motion calls with current durations, first/last order, 100ms window, and 2px
   hidden blur.
3. Escape closes an open compact map without Motion, calls `preventDefault`,
   and restores focus to the toggle.
4. Tabbing into the initially open desktop map triggers `:focus-visible`,
   settles an in-flight entrance, leaves `aria-expanded="true"`, and applies
   label/tick focus state under the persistent gate. Tabbing into a phone toggle
   during island arrival cancels/nulls that control and writes the visible final
   target with no `will-change` or effect-skip ref. A pointer-created focus
   forced to match `:focus-visible` keeps active node, panel, and island controls
   untouched. An
   aborted pointerdown with no focus clears in the queued microtask, so the next
   real Tab focus still selects the instant path.
5. Compact keyboard landmark activation closes before scheduled focus/scroll,
   keeps the 100px offset and hash, and starts no node or panel Motion.
6. A keyboard landmark jump that crosses the Back-to-top threshold sets and
   clears the one-shot CSS gate inside the existing programmatic-scroll frame,
   without scheduling a second animation frame.
7. Phone keyboard Back to top observes `aria-expanded="false"` when `scrollTo`
   runs, receives `{ top: 0, behavior: 'auto' }`, cancels an in-flight island
   control, invokes the shared measurement before returning from the click,
   settles final island/back-to-top state before the layout read, and clears
   `data-scroll-motion` afterward.
8. The island effect consumes the exact instant target without calling
   `animate`, marks initialization complete, and leaves the settled inline
   baseline; a later ordinary visibility reversal still starts the current
   280/260ms interruptible island Motion.
9. An instant measurement whose island boolean is unchanged still cancels and
   settles an in-flight island control without leaving a stale effect-skip ref.
10. Compact pointer Back to top stays smooth, retains animated node/panel close,
   and never sets `data-scroll-motion`.
11. Outside pointerdown still uses animated close. Reduced motion settles node,
    panel, island, and visibility state before paint for pointer/touch input
    without explicit instant attributes or replacement Motion.
12. On desktop, keyboard landmark and Back-to-top actions leave
    `aria-expanded="true"`; the landmark active treatment sees the persistent
    gate, Back to top uses `auto`, and any active node control is canceled.
13. Pointer movement after a keyboard action removes only the persistent gate;
    a desktop pointer landmark stays open and receives current CSS active-state
    transitions.
14. A compact pointer landmark preserves current ordering: active state is set
    before animated close, with the accepted panel/node animation arguments.
15. A reduced-motion pointer landmark and Back to top (`detail: 1`) call the
    immediate measurement in the same programmatic-scroll frame, set no instant
    attribute, and schedule no second animation frame.
16. Ordinary non-reduced scroll/resize never sets either instant attribute and
    preserves current island and Back-to-top behavior. Ordinary reduced-motion
    measurement sets no instant attribute, settles an in-flight island before
    paint, and starts no replacement Motion. Cleanup cancels scheduled measure
    work and clears callback/pending refs.

Use explicit `detail: 1` for pointer tests. `HTMLElement.click()` and the
Testing Library default produce `detail === 0`, which represents non-pointer
activation. Reset or snapshot the `animate` mock after initial viewport effects
so each assertion distinguishes node, panel, and island calls by its target.

## Boundaries

- Do NOT change map markup, landmark filtering, progress calculation, active
  tracking, 100px reading offset, hash replacement, focus semantics,
  inert/ARIA ownership, utility icons, or locale labels.
- Do NOT change the PR #170/#172 pointer contract: phone island/panel 280ms in
  and 260ms out; phone nodes 180ms in and 160ms out; 100ms first-to-last open
  and last-to-first close; 2px node blur; current transforms, easing, frame
  pinning, inline cleanup, and reversal. Tablet/desktop nodes remain center-out,
  and touch behavior remains unchanged.
- Do NOT animate width, height, margin, padding, or other layout properties;
  introduce layout shift; or add visual properties beyond transform, opacity,
  and the already accepted 2px phone node blur.
- Do NOT change desktop first entrance, ordinary phone-island scroll arrival,
  or Back-to-top threshold behavior.
- Do NOT put `.post-minimap-island` in a CSS instant gate. Its keyboard or
  reduced-motion settle must cancel and settle the Motion control. A
  state-changing measurement suppresses exactly one replacement effect; a
  same-value focus settle arms no skip ref.
- Do NOT treat `:focus-visible` alone as proof of keyboard input or add global
  input history. The root-local pointerdown/focus guard must leave pointer/touch
  Motion intact under always-visible focus-indicator preferences. Its only
  fallback cleanup is the same-task microtask for a pointerdown that produces
  no focus; do not use a timer.
- Do NOT clear either gate with a timer. `data-toggle-motion` clears on pointer
  movement or an explicit animated map action. `data-scroll-motion` clears in
  the shared measurement after a forced style/layout read.
- Do NOT leave `instantIslandTargetRef` armed when its state value did not
  change, and do not let the matching effect start Motion.
- Do NOT defer a keyboard or reduced-motion state settlement until after paint
  or into a second animation frame after programmatic scrolling.
- Do NOT add a second scroll/resize listener, a dependency, or the retired
  Playwright suite.
- If `cancel()` plus the current explicit inline cleanup leaves stale node,
  panel, or island values in the installed Motion version, STOP and report the
  focused test/browser evidence instead of clearing unrelated styles.
- If `panelRef`, `islandRef`, `nodeAnimationRef`, `panelAnimationRef`,
  `islandAnimationRef`, the phone constants, or the cited CSS state selectors
  have structurally changed since `59a39bc`, STOP and report instead of
  improvising.

## Verification

- **Mechanical**: run `pnpm vitest run components/post-toc.test.tsx`,
  `pnpm typecheck`, and `git diff --check`; all must exit 0.
- **Static checks**:
  - `rg -n "data-(toggle|scroll)-motion|pointerFocusPendingRef|measureNowRef|instantIslandTargetRef|type OpenMotion" components/post-toc.tsx app/globals.css`
    finds both root attributes, the island effect guard, one eight-selector
    persistent gate, and one one-selector scroll gate.
  - `! rg -n "data-scroll-motion='instant'] \.post-minimap-island" app/globals.css`
    prints no matches and exits 0.
  - The focused Vitest cases return distinct controllable objects for node,
    panel, and island targets and assert cancellation/no-replacement behavior
    by target; tests do not reach into private component refs.
- **Feel check**: test at phone, tablet, and desktop widths:
  - On phone, pointer/touch scroll arrival keeps the 280/260ms island motion.
    Pointer toggle keeps the 280/260ms panel plus 180/160ms nodes, with the
    100ms first-in/last-out sequence, 2px blur, and clean reversal.
  - Tablet/desktop pointer nodes remain center-out with their current timing;
    the desktop first entrance and progress control are unchanged.
  - Tab into the initially open desktop map. Focus label/tick styles settle in
    one frame and any entrance Motion stops. Tab into a phone toggle during
    island arrival; the island settles immediately. Pointer/touch focus, even
    with always-visible focus indicators, leaves pointer Motion intact. On
    compact layouts, focus the toggle and press Enter/Space; surface, panel,
    nodes, blur, and icon settle in one frame with no running Motion at 10%
    DevTools playback.
  - Escape from a pointer-opened compact map snaps closed and restores focus.
  - Keyboard-select a landmark. Compact maps close before focus/hash/scroll;
    desktop stays open and its active label/tick settles without a transition.
    A crossed Back-to-top threshold also settles in one frame.
  - Keyboard Back to top closes compact maps before an instant scroll. On phone,
    any in-flight island motion is canceled and the island disappears in the
    same frame. Later ordinary scrolling still animates its arrival.
  - Pointer Back to top remains smooth, outside pointerdown remains animated,
    and pointer movement restores hover/active transitions.
  - Reduced motion settles node, panel, island, icon, and visibility state
    before paint with no Motion replacement or layout shift.
- **Done when**: every keyboard map action and Escape is immediate; node,
  panel, and island Motion controls settle without replacement; only real
  pointer/touch actions and ordinary scroll-driven visibility animate; the
  accepted PR #170/#172 pointer sequence and accessibility remain unchanged;
  touch behavior and layout geometry remain unchanged; design-language
  documentation matches the implementation; and all focused tests pass.
