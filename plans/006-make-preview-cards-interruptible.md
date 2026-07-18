# 006 - Make preview cards interruptible and share their warm window

- **Status**: TODO
- **Commit**: dc24eb3
- **Severity**: MEDIUM
- **Category**: Interruptibility
- **Estimated scope**: 7 files, about 190 lines

## Problem

All preview-card containers use restart-from-zero keyframes. Rapidly leaving
and re-entering a trigger can restart the popup instead of retargeting from its
current frame:

```css
/* app/globals.css:1869-1881, 1977-1983 - current */
@keyframes link-card-in {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
}

@keyframes link-card-out {
  to {
    opacity: 0;
    transform: scale(0.97);
  }
}

.link-card[data-open] {
  animation: link-card-in 200ms var(--ease-swift);
}

.link-card[data-ending-style] {
  animation: link-card-out 130ms var(--ease-swift);
}
```

Service cards add another entry keyframe:

```css
/* app/globals.css:2942-2960 - current */
.service-card[data-open] {
  animation: service-pop 200ms var(--ease-swift);
}

@keyframes service-pop {
  from {
    opacity: 0;
    transform: scale(0.92) translateY(4px);
  }
}
```

Every trigger also owns an isolated Base UI root and always waits 300ms:

```tsx
// components/external-link.tsx:83-99 - current
<PreviewCard.Root>
  <PreviewCard.Trigger
    href={href}
    target="_blank"
    rel="noreferrer"
    className="external-link"
    delay={300}
    closeDelay={100}
  >
```

```tsx
// components/social-cards.tsx:78-93 - current
<PreviewCard.Root>
  <PreviewCard.Trigger
    href={href}
    target="_blank"
    rel="noreferrer"
    className={triggerClassName}
    delay={300}
    closeDelay={120}
  >
```

Independent roots cannot implement `docs/design-language.md:180-186`: the
first hover waits 300ms, movement between adjacent triggers is instant, one
surface follows the active trigger, and pointer reversal stays interruptible.
A delay-only context is insufficient because two independent roots can remain
open through their close delays and overlap.

## Target

### One public preview-card root

Add `components/preview-card-timing.tsx` with two exports:

```tsx
export function PreviewCardTimingProvider({
  children,
}: {
  children: React.ReactNode
})

export function SitePreviewCard(props: {
  children: React.ReactNode
  href: string
  target?: string
  rel?: string
  triggerClassName: string
  popup: React.ReactNode
  popupClassName: string
  side?: 'top' | 'bottom' | 'left' | 'right'
  closeDelay: number
})
```

The provider creates one stable
`PreviewCard.createHandle<PreviewCardPayload>()` and renders one
`PreviewCard.Root` using that handle. `SitePreviewCard` renders detached
`PreviewCard.Trigger` elements with the shared handle and a payload:

```ts
type PreviewCardPayload = {
  id: string
  popup: React.ReactNode
  popupClassName: string
  side?: 'top' | 'bottom' | 'left' | 'right'
}
```

`SitePreviewCard` creates the `id` with `useId()` so it is stable for that
trigger. The Root render function receives `payload | undefined`; it returns
`null` before a trigger is active and otherwise renders exactly one keyed,
settled surface:

```tsx
{({ payload }) =>
  payload ? (
    <PreviewCard.Portal>
      <PreviewCard.Positioner
        side={payload.side}
        sideOffset={8}
        collisionPadding={16}
        className="pointer-events-none z-[var(--z-card)]"
      >
        <PreviewCard.Popup
          key={payload.id}
          className={(state) =>
            `${payload.popupClassName}${state.instant ? ' preview-card-instant' : ''}`
          }
        >
          {payload.popup}
        </PreviewCard.Popup>
      </PreviewCard.Positioner>
    </PreviewCard.Portal>
  ) : null
}
```

This uses Base UI 1.6's public detached-trigger interface. One store knows all
triggers and opens an inactive trigger immediately while the root is open or
in its hover-driven closing transition. It also guarantees one popup surface,
so moving A to B cannot leave two independent cards mounted.

The keyed Popup is deliberate: switching between differently sized payloads
replaces the settled popup node instead of reusing one DOM node and making it
resize while open. There is still exactly one mounted popup, and no width or
height transition is added.

Outside the provider, `SitePreviewCard` falls back to one local Root with the
same surface and a 300ms delay. Standalone tests and reuse remain functional.

### Shared timing

Use exact constants:

```ts
const PREVIEW_OPEN_DELAY_MS = 300
const PREVIEW_WARM_WINDOW_MS = 300
```

The single Root owns this state machine:

1. Cold: detached and fallback triggers use `delay: 300`.
2. Root opens: clear any cooldown and expose `delay: 0` to every detached
   trigger.
3. Root closes: keep `delay: 0` for 300ms, then return to 300ms.
4. Reopen during cooldown: cancel the timer and remain warm.
5. Provider unmount: clear the timer.

Keep current close delays in each caller: 100ms for prose previews and 120ms
for service/email cards.

### Interruptible CSS transitions

Replace container keyframes with Base UI lifecycle transitions:

```css
/* app/globals.css - target */
.link-card {
  opacity: 1;
  transform: scale(1);
  transition:
    opacity 200ms var(--ease-swift),
    transform 200ms var(--ease-swift);
}

.link-card[data-starting-style] {
  opacity: 0;
  transform: scale(0.95);
}

.service-card[data-starting-style] {
  transform: scale(0.92) translateY(4px);
}

.link-card[data-ending-style] {
  opacity: 0;
  transform: scale(0.97);
  transition-duration: 130ms;
}

.link-card.preview-card-instant,
.link-card.preview-card-instant[data-starting-style],
.link-card.preview-card-instant[data-ending-style] {
  opacity: 1;
  transform: none;
  transition: none;
}

.link-card.preview-card-instant .contrib-grid i {
  animation: none;
}

@media (prefers-reduced-motion: reduce) {
  .link-card,
  .link-card[data-starting-style],
  .link-card[data-ending-style],
  .service-card[data-starting-style] {
    opacity: 1;
    transform: none;
    transition: none;
  }
}
```

The service-card starting override preserves its current
`scale(0.92) translateY(4px)` geometry while making it interruptible. Preserve
the internal GitHub contribution-cell cascade for pointer opens, but suppress it
under `preview-card-instant`. Base UI exposes `Popup.State.instant` as `focus`
for keyboard entry and `dismiss` for immediate keyboard dismissal; the instant
class makes the container and every contribution cell settle without motion.

## Repo conventions to follow

- `docs/design-language.md:23-35` assigns hover-card chrome 150-200ms
  `--ease-swift`, with exit around two-thirds of enter. Preserve 200ms/130ms.
- `docs/design-language.md:180-186` assigns a 300ms cold intent delay, 0ms
  adjacent movement, trigger-relative origin, and interruptible reversal.
- `components/ui/tooltip.tsx:38-73` is the local ownership exemplar for one
  app-level timing group plus a safe standalone fallback.
- Installed Base UI contracts are in
  `node_modules/@base-ui/react/preview-card/root/PreviewCardRoot.d.ts` and
  `trigger/PreviewCardTrigger.d.ts`: Root accepts `handle` and render-function
  payload; detached Trigger accepts the same `handle` and a `payload`.
- `app/globals.css:1883-1898` already sets trigger-relative
  `transform-origin: var(--transform-origin)` and
  `backface-visibility: hidden`. Preserve both.

## Steps

1. Add `components/preview-card-timing.tsx` as a client module. Implement the
   payload with a stable `useId()` identity, one stable handle, guarded Root
   render-function surface, timing constants, warm/cold timer, and local
   fallback exactly as specified above. Do not use internal Base UI import
   paths.
2. Add `components/preview-card-timing.test.tsx` under jsdom with fake timers
   and two differently sized `SitePreviewCard` consumers. Prove no cold surface
   before a payload, one shared Root/surface, initial delay 300, delay 0 after
   open, 0 through 299ms after close, 300 at 300ms, canceled cooldown on reopen,
   payload/content/side switching replaces the keyed Popup DOM node while only
   one is mounted, `focus`/`dismiss` instant states add the settled instant
   class, timer cleanup, and one local Root at delay 300 outside the provider.
   A focused Base UI mock may expose Trigger delay/payload, Popup state, and Root
   lifecycle; do not mock the provider's own state machine.
   Include a GitHub-like popup containing `.contrib-grid i`, and assert the
   stylesheet keeps the baseline `contrib-cell-in` animation while the exact
   `.link-card.preview-card-instant .contrib-grid i` descendant rule sets
   `animation: none` for `focus` and `dismiss` states.
3. In the public branch of `app/_components/site-document.tsx`, wrap route
   body, footer, and dock in one `PreviewCardTimingProvider` inside
   `ThemeProvider`. Do not add it to admin. Update `app/site-document.test.tsx`
   with a lightweight provider marker so public/admin ownership is asserted.
4. Replace the local Root/Portal/Positioner/Popup assembly in
   `components/external-link.tsx` with `SitePreviewCard`. Pass its existing
   anchor props, popup body, computed popup class, default side, and 100ms close
   delay. Preserve the plain-link fallback when metadata is absent.
5. Replace the same assembly in the shared `Card` and `EmailCard` paths in
   `components/social-cards.tsx`. Pass `side="top"` and 120ms close delay.
   Preserve all service-specific markup and destinations.
6. In `app/globals.css`, delete `link-card-in`, `link-card-out`, `service-pop`,
   and their `[data-open]` container rules. Add the exact transition and
   reduced-motion rules above. Leave the pointer `.contrib-grid i` cascade
   unchanged and add only the instant-state descendant override.
7. Keep `components/external-link.test.tsx` and
   `components/social-cards.test.tsx` passing through the wrapper's local
   fallback. Add assertions there only if their Base UI mocks need to expose
   the new wrapper contract; the shared state machine belongs in its dedicated
   test.

## Boundaries

- Do NOT add a dependency or replace Base UI Preview Card.
- Do NOT import Base UI internal store modules; use only `PreviewCard.Root`,
  `Trigger`, `Portal`, `Positioner`, `Popup`, and `createHandle`.
- Do NOT change card content, dimensions, padding, shadows, image loading,
  collision padding, trigger destinations, or service-specific sides.
- Do NOT change the 300ms cold delay, 300ms warm window, 100ms prose close
  delay, 120ms service close delay, 200ms enter, or 130ms exit.
- Do NOT flatten the service-card start to generic scale 0.95; preserve
  `scale(0.92) translateY(4px)` through `data-starting-style`.
- Do NOT animate layout properties, add a second public root, or retain local
  roots when the provider is present.
- Do NOT reuse one Popup DOM node across different payload identities or animate
  its dimensions; each payload mounts keyed at settled dimensions.
- Do NOT remove/change the GitHub contribution-cell cascade for pointer opens;
  only `preview-card-instant` may suppress it.
- Do NOT make previews available on touch or turn popups into pointer targets.
- Do NOT put the timing provider around admin.
- If public Base UI 1.6 no longer supports shared handles, payload render
  functions, or immediate inactive-trigger switching, STOP and report instead
  of reaching into its internal store.
- If switching payload changes a card's dimensions after its content has
  rendered rather than mounting the new payload at settled dimensions, STOP
  with a browser reproduction; do not animate width or height.

## Verification

- **Mechanical**: run
  `pnpm vitest run components/preview-card-timing.test.tsx components/external-link.test.tsx components/social-cards.test.tsx app/site-document.test.tsx`,
  `pnpm typecheck`, and `git diff --check`; all must exit 0.
- **Static checks**:
  - `! rg -n 'link-card-in|link-card-out|service-pop' app/globals.css` prints no
    matches and exits 0.
  - `! rg -n '\.link-card\[data-open\]|\.service-card\[data-open\]' app/globals.css`
    prints no popup-container animation matches and exits 0.
  - `! rg -n '<PreviewCard.Root>|delay=\{300\}' components/external-link.tsx components/social-cards.tsx`
    prints no matches and exits 0.
  - `rg -n 'PreviewCard.createHandle|data-starting-style|PREVIEW_WARM_WINDOW_MS|preview-card-instant|key=\{payload\.id\}' components/preview-card-timing.tsx app/globals.css`
    finds the shared handle, keyed surface, transition/instant lifecycle, and
    exact timer constant.
  - `rg -nF '.link-card.preview-card-instant .contrib-grid i' app/globals.css`
    finds one descendant override whose declaration is `animation: none`, while
    the baseline `.contrib-grid i` rule still owns `contrib-cell-in`.
- **Feel check**: on a fine pointer at normal speed and 10% playback:
  - Hover the first eligible prose or footer trigger. It opens after 300ms.
  - Move to an adjacent trigger. One popup follows the active trigger and
    swaps to the correct payload/side without another wait or a second popup.
    Move between a short service card and a taller prose card: the old keyed
    node is replaced by the new card at settled dimensions, with no width/height
    tween or intermediate resize.
  - Leave all triggers for less than 300ms, then enter another. It opens
    immediately. Wait longer than 300ms and confirm the cold delay returns.
  - Reverse direction repeatedly during enter and exit. Opacity and transform
    retarget from the current frame without a restart or flash.
  - Generic cards enter from scale 0.95; service cards retain scale 0.92 plus
    4px downward offset; all exit toward scale 0.97 in 130ms.
  - Tab-focus a trigger, then press Escape. Base UI reports the focus/dismiss
    instant states; the popup appears and disappears on one frame with no
    opacity, transform, or contribution-cell animation.
  - Emulate `prefers-reduced-motion: reduce`. The popup is visible at its
    settled opacity/transform on the first frame and GitHub cells do not
    cascade.
  - Confirm touch remains a plain destination link with no preview surface.
- **Done when**: public previews use one shared Base UI root, adjacent triggers
  share the tested warm window, container transitions are interruptible,
  keyboard focus/Escape are instant, payload changes mount one keyed settled
  card, service geometry and reduced motion are correct, standalone fallback
  works, and card content/geometry contracts remain intact.
