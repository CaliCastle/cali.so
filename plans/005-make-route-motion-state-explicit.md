# 005 - Make route motion state explicit

- **Status**: TODO
- **Commit**: 59a39bc
- **Severity**: LOW
- **Category**: Cohesion and tokens
- **Estimated scope**: 9 files, about 90 lines

## Problem

The route-motion contract currently has one named disabled value and one
implicit enabled value. The server renders `none`, while a pointer-opened post
removes the attribute entirely:

```tsx
// app/_components/site-document.tsx:78-84 - current
<html
  lang={english ? 'en' : 'zh-CN'}
  data-locale={english ? 'en' : undefined}
  data-route-motion="none"
  suppressHydrationWarning
  className={cn('font-sans', fontVariables, 'public-site')}
>
```

```tsx
// components/post-transition-link.tsx:31-41 - current
const root = document.documentElement
if (event.detail === 0) {
  root.setAttribute('data-route-motion', 'none')
  root.style.removeProperty('--post-cover-transition-name')
  root.style.removeProperty('--post-title-transition-name')
  return
}

root.removeAttribute('data-route-motion')
root.style.setProperty('--post-cover-transition-name', coverTransitionName)
root.style.setProperty('--post-title-transition-name', titleTransitionName)
```

The stylesheet therefore treats every missing or misspelled value as an opt-in
to motion:

```css
/* app/globals.css:1450-1456 - current */
html[data-route-motion='none']::view-transition-group(*),
html[data-route-motion='none']::view-transition-image-pair(*),
html[data-route-motion='none']::view-transition-old(*),
html[data-route-motion='none']::view-transition-new(*) {
  animation-duration: 0s !important;
  animation-delay: 0s !important;
}
```

This makes the initial document, routine navigation, and the only permitted
View Transition hard to distinguish in code and tests. It also makes a missing
attribute permissive for View Transition pseudo-elements, even though
`docs/design-language.md:51-63` says only a validated primary pointer or touch
activation on a post may enable that route transition.

## Target

Use exactly three explicit route-motion states:

```ts
// lib/route-motion.ts - target
export const ROUTE_MOTION = {
  initial: 'initial',
  none: 'none',
  post: 'post',
} as const

export type RouteMotion = (typeof ROUTE_MOTION)[keyof typeof ROUTE_MOTION]

export function setRouteMotion(root: HTMLElement, motion: RouteMotion) {
  root.dataset.routeMotion = motion
}
```

Their meanings are fixed:

- `initial`: server-rendered public document before any navigation input. It
  disables View Transition pseudo-elements but does not suppress the existing
  cold-load `.enter`, `.enter-polaroid`, or `.enter-swing` choreography.
- `none`: routine navigation, keyboard input, browser history, and the settled
  state after a post transition.
- `post`: the temporary opt-in set only by a validated unmodified primary
  pointer/touch click on `PostTransitionLink`.

Only `post` may have non-zero View Transition timing. Make the CSS fail closed:

```css
/* target: a missing or unknown value is also instant */
html:not([data-route-motion='post'])::view-transition-group(*),
html:not([data-route-motion='post'])::view-transition-image-pair(*),
html:not([data-route-motion='post'])::view-transition-old(*),
html:not([data-route-motion='post'])::view-transition-new(*) {
  animation-duration: 0s !important;
  animation-delay: 0s !important;
}
```

Do not change any route-motion duration, easing, shared-element identity, input
eligibility rule, or ordinary destination entrance keyframe.

## Repo conventions to follow

- `docs/design-language.md:15-36` owns motion tokens and route timings. Keep
  `--ease-swift`, 250ms defocus, 300ms focus, and the existing shared morph.
- `docs/design-language.md:51-63` is the input-modality authority. Keyboard,
  dock, settings, ordinary links, history, and reduced motion remain instant.
- `components/post-transition-link.tsx:19-29` is the native-link guard. Do not
  intercept navigation or change modified-click behavior.
- `components/route-motion-controller.tsx:49-62` owns the two-stage loading
  shell cleanup. The `post` state must survive list-to-shell and reset only
  after shell-to-article completes.
- Small cross-runtime constants live in `lib/`; keep `lib/route-motion.ts`
  browser-global-free so the server-owned `SiteDocument` can import it.

## Steps

1. Add `lib/route-motion.ts` with the exact three values, exported union type,
   and typed setter shown above. Do not add timers, React state, or browser
   reads to this module.
2. In `app/_components/site-document.tsx`, render public `<html>` with
   `data-route-motion={ROUTE_MOTION.initial}`. Keep admin `<html>` free of the
   public route-motion attribute and controller. Preserve the owner-admin
   warm-paper shell, ambient background, column geometry, and protected-layout
   ownership introduced in PR #171.
3. In `components/route-motion-controller.tsx`, replace raw string writes with
   `setRouteMotion`. Routine pointer input, any keydown, `popstate`, and the
   final article handoff set `none`. An eligible post `pointerdown` still does
   not opt in by itself because a canceled gesture must not arm later motion.
4. In `components/post-transition-link.tsx`, set `post` only in the existing
   validated pointer-click branch. Set `none` in the keyboard-generated click
   branch. Never remove `data-route-motion`.
5. Replace the `[data-route-motion='none']` CSS gate with the exact fail-closed
   `:not([data-route-motion='post'])` gate above.
6. Update `components/route-motion-controller.test.tsx` and
   `components/post-transition-link.test.tsx` to assert exact `initial`,
   `none`, and `post` values. Remove assertions that absence means enabled.
   Keep coverage for keyboard, history, modified clicks, canceled pointer
   gestures, loading shell handoff, final cleanup, and listener removal.
7. Extend `app/site-document.test.tsx` to assert that public markup starts at
   `data-route-motion="initial"` in both locales and admin markup has no
   `data-route-motion` attribute. Keep its current admin assertions for the
   `public-site` class, absence of public chrome/analytics, and absence of
   social reads. Add one sentence to
   `docs/design-language.md` naming the three states and stating that only
   `post` is permissive.

## Boundaries

- Do NOT change the eligible pointer/touch predicate.
- Do NOT arm motion on `pointerdown`; the validated `click` remains the opt-in.
- Do NOT change View Transition names, React boundaries, loading shells,
  prefetch behavior, route timings, easing, blur, or shared cover/title CSS.
- Do NOT add a root-state gate for `.enter`, `.enter-polaroid`,
  `.post-title-meta`, `.post-body-stage`, or `.enter-swing`. Those keyframes are
  outside this defensive View Transition state refactor. In particular, the
  post state resets after the 320ms shell-to-article handoff while metadata and
  body choreography can still be running through 870ms; gating them on the
  root state would truncate the approved pointer-post sequence.
- Do NOT claim this plan makes every destination entrance keyframe instant.
  A persistent per-navigation entrance marker would be a separate plan.
- Do NOT add a fourth state or use attribute absence as a state.
- Do NOT put `document`, `window`, React hooks, or client-only directives in
  `lib/route-motion.ts`.
- Do NOT change the PR #171 admin rendering, its `public-site` class, ambient
  background, or protected-layout chrome ownership; do not add route motion to
  admin.
- Do NOT add dependencies.
- If React/Next no longer exposes the two-stage `onUpdate` lifecycle shown in
  `components/route-motion-controller.tsx:49-62`, STOP and report instead of
  replacing it with timers.
- If the input contract in `docs/design-language.md:51-63` has changed since
  commit `59a39bc`, STOP and report before editing.

## Verification

- **Mechanical**: run
  `pnpm vitest run components/route-motion-controller.test.tsx components/post-transition-link.test.tsx app/site-document.test.tsx`,
  `pnpm typecheck`, and `git diff --check`; all must exit 0.
- **Static checks**:
  - `! rg -n "removeAttribute\('data-route-motion'\)|removeAttribute\(ROUTE_MOTION_ATTRIBUTE\)" app components lib --glob '!**/*.test.*' --glob '!**/*.spec.*'`
    prints no matches and exits 0.
  - `! rg -n "data-route-motion=\"none\"" app components lib --glob '!**/*.test.*' --glob '!**/*.spec.*'`
    prints no production-source matches and exits 0.
  - `rg -n "data-route-motion='post'" app/globals.css` finds the single
    fail-closed selector group.
- **Feel check**: run a production build in a browser and confirm:
  - A cold load starts with `data-route-motion="initial"` and does not run a
    route View Transition. Existing cold-load content entrance keyframes may
    still run.
  - Pointer-click or touch-tap a covered post. The attribute becomes `post`,
    both list-to-shell and shell-to-article morphs run, then it becomes `none`.
  - Keyboard-open the same post, use the dock, change locale/theme, follow an
    ordinary link, and use Back/Forward. Every path remains `none`; inspect the
    View Transition pseudo-groups and confirm their duration/delay are `0s`.
    Generic destination `.enter` keyframes are not part of this assertion.
  - Remove or misspell the attribute in DevTools, then navigate normally. The
    CSS allow-list keeps the transition instant.
  - With `prefers-reduced-motion: reduce`, even `post` remains instant.
- **Done when**: every public View Transition is represented by one of the
  three named states, only `post` can give View Transition pseudo-elements
  non-zero timing, no code removes the attribute, the two-stage post morph and
  existing destination keyframes are unchanged, and all focused tests pass.
