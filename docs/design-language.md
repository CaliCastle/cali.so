# v3 Design Language

The visual and interaction spec for cali.so v3. It extends the component stack
in ADR-0006 (motion is information, not decoration). Rules here are written to
be buildable: when a value is stated, use it; when a component is described,
its behavior spec is the contract.

The primary navigation is a fixed bottom-center pill dock at z `--z-nav`.
Viewport-edge fades and the drafting guides remain ambient rather than
navigation chrome. On desktop, the footer is a single Swiss grid with a quiet,
left-aligned colophon first, followed by the contact and index trees.

## Motion system

Token set (define in `globals.css`, use everywhere — no ad-hoc cubic-beziers):

```css
--ease-swift: cubic-bezier(0.2, 0.8, 0.2, 1);       /* UI: enters, exits, movement */
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);   /* playful objects: overshoots  */
--ease: ease;                                        /* hover/color                  */
```

Two motion families. **UI chrome** (tooltips, dropdowns, hover cards, focus)
uses `--ease-swift` at 150–200ms — quick, decisive, no bounce. **Physical
objects** (the photo covers, anything meant to feel picked up) use
`--ease-spring` at 300–350ms — the overshoot reads as springiness; never use
it on chrome.

| Motion | Duration | Easing |
| --- | --- | --- |
| Hover/color change | 150ms | `ease` |
| Tooltip, dropdown, hover card enter | 150–200ms | `--ease-swift` |
| Exit (any) | ~2/3 of its enter | `--ease-swift` |
| Photo pick-up / settle | 300–350ms | `--ease-spring` |
| Shared-element page transition | 300–350ms | `--ease-swift` |
| Route defocus / focus | 250ms exit / 300ms enter | `--ease-swift` |

Shadow scale (one alpha, growing throw — don't invent one-off shadows):

```css
--shadow-small:  0 5px 10px rgb(0 0 0 / 0.12);
--shadow-medium: 0 8px 30px rgb(0 0 0 / 0.12);
--shadow-large:  0 30px 60px rgb(0 0 0 / 0.12);
--shadow-tooltip: 0 4px 8px rgb(0 0 0 / 0.04), 0 1px 1px rgb(0 0 0 / 0.02);
```

Hard rules:

- Animate `transform` and `opacity` only. Never `height`, `width`, `margin`,
  `padding`, or blur above 20px.
- The frequency principle: anything used 100+ times a day (theme toggle, nav
  links) gets no entrance animation. Keyboard-initiated actions are never
  animated.
- Elements that move together share one duration and easing (card + its
  shadow, cover + its caption).
- Route changes keep the ambient guides, dock, and other global chrome fixed.
  The route content defocuses by 2px while fading, then the destination focuses
  into place. Shared post covers and titles remain separate morph elements.
  Only a primary pointer or touch activation on a post link enables this route
  motion and prepares those identities. Keyboard, dock, settings, ordinary
  links, browser history, and reduced-motion navigation swap instantly. The
  pointer opt-in resets after the loading shell finishes handing off to the
  article.
- Scroll reveals are allowed only as gentle arrivals: below-fold long-form
  blocks may sharpen in (blur 2px → 0 + fade, 300ms `--ease-swift`, ≤45ms
  stagger within a batch) as they enter the viewport. Never parallax, never
  scroll hijacking, never hiding content behind JS — the hidden state is
  applied by script, so content without JS (or with reduced motion) is
  simply there.
- Springs (via the fluid components) are reserved for interruptible,
  pointer-driven motion — proximity hover, drag. Bounce stays in 0.1–0.3.
- Every animation has a `prefers-reduced-motion: reduce` branch that sets
  `animation: none` / `transition: none` — including opacity fades, no
  exceptions. Theme switching disables transitions while it applies.

## Typography

- Stack: Geist (Latin) → Frex Sans GB (CJK) → system, per `app/fonts.ts`.
  Weights 400/500/600 only, as `--font-weight-{normal,medium,semibold}`
  variables. Weight never changes on hover or selection — state is shown with
  color, never with weight or size.
- **Chrome stays compact.** Navigation, footer, dates, section labels, and
  utility controls remain 14px with letter-spacing −0.011em. Compact chrome
  provides contrast against the editorial content instead of flattening it.
- **Editorial scale.** The scale is based on 14px body copy. List titles and
  project rows are 15px. Homepage and introductory paragraphs are 14px/1.7.
  Post bodies are 14px/1.72, with CJK at 1.9. Post titles scale from 28px to
  32px; prose h2 is 18px/1.35 and h3 is
  16px/1.45. Code remains 13px. Form inputs stay ≥16px to prevent iOS zoom.
  Headings use `text-wrap: balance` and tighter letter-spacing as size grows.
- Content column is narrow: ~600px (`37.5rem`) plus padding.
- `font-variant-numeric: tabular-nums` on anything that counts: dates in
  lists, reading time, subscriber counts.
- Curly quotes, real ellipsis (…), full-width CJK punctuation left alone.
  `-webkit-font-smoothing: antialiased` on `body`.

## Color, borders, dark mode

- Grays are a numbered scale (`--gray-1` … `--gray-12`) that flips wholesale
  in dark mode. The warm-paper scale is shared by the public site and the
  owner admin (maintainer decision, July 2026); the neutral base ramp remains
  only as the pre-hydration fallback. Headings use the strongest ink, body
  copy steps down two levels, and metadata steps down again. Components
  reference scale variables, never Tailwind `dark:` overrides — if a
  component needs a `dark:` modifier, the token is wrong.
- Text selection uses a translucent yellow-green highlighter token and never
  changes the selected text color. The dark token lowers opacity so it reads
  as marker on dark paper rather than a luminous block.
- 1px borders are the exception: prefer `box-shadow: 0 0 0 1px` for card
  edges (blends with any background) and hairline dividers via
  `--border-hairline` (0.5px on retina, 1px otherwise).
- Focus rings stay neutral (gray/black/white), visible on `:focus-visible`,
  and are never removed.
- Z-index scale: `--z-nav: 100; --z-card: 200; --z-toast: 300`. Nothing else.
  Prefer `isolation: isolate` over a new z-index.

## Writing style

Titles do the work: post listings are title + date, no descriptions. Titles
are short, concrete, and conversational — "为什么按钮不需要手指光标" not
"关于按钮光标设计的一些思考与实践". Section headers are one or two words.

## Homepage introduction

The homepage opens with four short bilingual paragraphs: Cali is a father of
two, a design engineer, and an agent orchestrator; he loves getting the details
just right. Zolplay is introduced as an AI-native design studio creating
products, brands, and digital experiences, a casual generalist note connects
curiosity and craft to having fun with the team, and a final contact line links
to X, GitHub, and email.
Chinese also includes Xiaohongshu. Those inline contact triggers reuse the footer's
fixed-size informational preview cards and remain plain destination links on
touch. The personal sentence carries two decorative 18px
marks: the supplied design-engineer figure and the supplied orbital sparkle
for getting details just right. The orbital mark precedes its phrase in both
locales. Inline text establishes the shared baseline while each mark centers
against that text, so neither localized phrase shifts vertically. Hovering the
associated phrase on a fine pointer, or pressing it on touch, produces one
brief response with no looping or layout movement. On a fine-pointer hover,
both localized design-engineer labels pick up the same restrained, static
rainbow gradient. The three
characters in 刚刚好 and the three words in "details just right" rise in
sequence to `translateY(-5px) scale(1.03)` over a one-second spring, staggered
by 80ms, then settle back at their origin as the animation's end state. English
punctuation stays inside the unbreakable phrase wrapper but outside the
animated units, keeping its baseline and position stable. The Zolplay mention
uses the shared external-link preview, its fixed favicon slot, and the standard
northeast mark. Decorative marks stay out of the accessibility tree, reduced
motion keeps every mark and text unit static, and the text remains complete
without them.

## Entrance choreography

Entrances continue the selective-focus grammar: blocks *develop* into
focus (blur 4px → sharp + fade, 350ms `--ease-swift`) with inline per-item
delays — ~100ms base, 35–65ms steps, total under ~600ms. Nothing slides;
blur stands in for "not yet attended". Listing polaroids instead pop like
prints dropped on the sheet (rotate from base+1.5°, `scale(0.85)`, 350ms),
65ms apart — and are skipped after the first visit in the session
(`html[data-visited]`, set pre-paint). Entrance and reveal animations use
`animation-fill-mode: backwards` — a forwards fill would pin the keyframe
value and dead-lock hover transitions on the same properties. Reduced
motion disables every entrance. The staged post opening under Fluid page
transitions is the one longer route-level sequence and follows that section's
timing instead of this ordinary entrance budget.

## Hover cards as craft objects

Inline mentions of external presences (social profile, code, music)
open rich hover cards. The contract:

- **Per-service design.** Each card is composed for its service — no generic
  "avatar + handle" template. The card's *content* also animates, not just
  its container:
  - Code card: a real contribution graph (26 week columns — the recent
    ~180 days; the stat below still counts the past year, hairline 0.5px
    cell borders) whose cells **cascade in individually** — each cell rises
    from `translateY(4px) scale(0.92)` over ~0.48s with a per-cell stagger.
  - Social card: avatar, name + verified mark, bio, follower and following stats in
    `tabular-nums`.
  - Music card: current/last track with artwork.
- **Behavior.** ~256px fixed-width card, 300ms open intent delay (0ms when
  moving between adjacent triggers), enter 200ms `--ease-swift` from
  `scale(0.95)` + `opacity: 0`, `transform-origin` at the trigger,
  `backface-visibility: hidden`. Exit faster than enter. Built on the fluid
  hover-card primitive so pointer exit mid-animation reverses smoothly.
- **Fixed dimensions per service card type** — service-card content loads
  into a fixed-size card (skeleton first). External-link preview cards are
  instead fixed-width with content-driven height, settled at render. Either
  way a card never resizes while open. No layout shift, ever.
- **Touch fallback.** Hover cards require `@media (hover: hover) and (pointer:
  fine)` and are simply absent on touch — the trigger is a plain link to the
  destination (or inert text if there is no destination). The card is an
  enhancement, never the content.
- **Data before interaction.** Card data is fetched through static generation
  or ISR, never on hover; an open card never shows a network spinner.
- All content animations inside cards respect `prefers-reduced-motion`.
- **Implemented service cards** (`components/social-cards.tsx`, chrome
  social links): the X card (avatar, name/@handle, bio, follower and following stats) and
  the code card: a recent 26×7 contribution grid, 4px cells on 1px gaps,
  ink = foreground alpha ramp (7/30/52/74/100%), each cell cascading in
  (`translateY(4px) scale(0.92)`, 480ms, ~1.1ms/cell stagger). GitHub data
  revalidates through the Next data cache every 6 hours and the YouTube count
  every 12 hours. `content/social.json` and `content/github.json` are committed
  fallback seeds; X remains manual because it has no public endpoint. There is
  zero network work on hover. Touch follows the plain link.
- **Homepage contact line.** X, GitHub, and email reuse the exact footer card
  bodies through alternate inline trigger labels. The Chinese-only
  Xiaohongshu trigger opens a fixed-size service card with the local headshot,
  Xiaohongshu's official text wordmark, profile name and account number,
  two-line bio, and follower/engagement snapshot; it links directly to
  `https://xhslink.com/m/7vluP5ANiNE`. Its
  popup is informational and noninteractive, and touch follows that link
  without opening a separate surface.
- **The implemented base: external-link previews.** Every external link in
  prose carries a 14px inline favicon (fixed slot, no layout shift) — always
  requested against the link's root domain, never the deep URL, so a page
  that 404s or redirects can't fail the icon — and,
  when build-time metadata exists in `content/link-previews.json`, a preview
  card on the shared hover-card primitive (`components/external-link.tsx`).
  The card is fixed-width; its height adapts to the content and never changes
  after open. Image-enabled cards reserve one fixed 16:9 slot for the proxied
  Open Graph image above the favicon, domain, and title — the image speaks
  for the page, so the description renders only on image-less cards — with
  the slot's corner radius concentric to the card's (outer radius minus
  padding). A failed image degrades the card to its text form (description
  included); a failed favicon hides in place, keeping its slot and the
  link stable.
  Favicons and Open Graph images are served through the server-side cache at
  `/link-media` (`app/link-media/[kind]/route.ts`), allowlisted against the
  snapshot so the proxy can't be aimed at arbitrary hosts; targets not yet in
  the snapshot fall back to `og.zolplay.com` directly.
  Favicon tone chips (`components/favicon-tone.ts`): the same-origin icon is
  pixel-sampled once on load, and a glyph that would vanish into the theme
  background — white-on-transparent in light mode, black-on-transparent in
  dark — is set on a small `--primary` chip (2px inset padding, border-box,
  slot size unchanged); opaque near-white tiles get a hairline edge on the
  light page. Colorful icons, opaque dark tiles (their glyphs carry their
  own contrast), and un-proxied fallback icons stay untouched. Refresh the metadata
  from the same first-party service with
  `node scripts/refresh-link-previews.mjs`.
- **Link texture.** Inline prose and homepage contact links use a fine dotted
  underline at 38% current ink. Hover and keyboard focus deepen both text and
  decoration to full ink. Dots reuse the catalog-leader and drafting
  vocabulary; list rows, cards, shelves, and navigation remain undecorated.
- **External-link mark.** Text links that leave the site carry the shared
  northeast arrow inline; internal links, RSS, and Email do not. Shelf covers
  are selection controls only. Each shelf instead keeps one plain-text
  annotation below its plank; that annotation is the selected object's sole
  external-link surface and carries the northeast mark inline. The label text
  remains at normal opacity. The mark rests at 60% opacity and, when the
  annotation is hovered or focus-visible, transitions to 95% opacity and
  `translate(1.5px, -1.5px)` over 180ms `ease`. Reduced motion disables the
  movement.

## Image lightbox

Post images zoom on click: the photo is picked up off the page (FLIP,
transform-only, 300ms `--ease-swift`) and floats centered over the dimmed
sheet at no more than its intrinsic size, gaining `--shadow-large`. Esc,
click, or the first scroll puts it back. The inline image keeps its spot
(zero layout shift); reduced motion swaps instantly. `components/zoom-image.tsx`.

## Portrait & avatar

The site carries its author: the bottom dock uses the portrait as its Home
item. The home page opens with the halftone portrait hero (below).
Illustration, photo, and print are three registers of the same person; use
the illustration where chrome should stay quiet, the photo where a human
moment is wanted, the print where the page itself should feel authored.

## Technical print

A second ambient register alongside the drafting sheet: the marks of
reproduction — halftone dot screens, diagonal line rasters, dither fields,
typewriter/ascii textures, measuring ticks, registration marks. Rules:

- **Ink is always the foreground token** on transparent ground, never a
  boxed image — prints must dissolve into the paper in both themes.
- **The halftone portrait hero** (`components/halftone-portrait.tsx`): the
  home portrait rendered as a dot screen on canvas — dot radius ∝ auto-leveled
  luminance (p5–p95 stretch), 3px cells, dots taper through the outer 10% and
  below a 6% floor so the figure emerges from nothing. A fine pointer swells
  (+8%) and repels (≤3px) dots within ~150px, smoothed per-frame (0.16
  lerp, rAF only while active). Touch and reduced motion get the static
  print. The server-rendered shell is visually empty; once the client paints
  the first valid dot field, the portrait fades in over 400ms. Reduced motion
  reveals it instantly, while no-JS leaves the reserved square empty. Its
  wrapper is 149.6px wide on mobile (15% below the original 176px
  presentation) and returns to the fixed 240px size from the 40rem breakpoint
  onward.
- **Rulers**: measuring ticks (48px major / 12px minor) ride top and
  bottom as arcs of an enormous circle (fixed 40px rise at the viewport
  edge, so R = w²/8s at any width) — a bent steel rule whose ends bow away
  and leave the screen before the corners; the apex hugs the horizontal
  guide. Ticks are dashes on the stroked path (`components/arc-rulers.tsx`),
  perpendicular to the curve for free. Same missability contract as the
  guides.
- **Print veils** (`components/dither-veil.tsx`): cover images rest as
  ink-on-paper prints, identical in both themes (paper
  `oklch(0.98 0.004 95)`, ink `oklch(0.28 0.012 95)`), developing into the
  true photo on hover/focus (300ms). Two modes: pure ordered dither (4×4
  Bayer, 2.5px cells — list thumbnails), and the collage — seeded vertical
  panels of dither, ascii raster (7px cells, ` -li+tcsea` ramp — the letters of
  "cali castle" plus - and +, ordered by ink), and a
  window of the original photo (post heroes). Post covers enter with a
  morse-choreographed glitch (· — · · –, coverage ≈9→39→12→12→12%);
  afterwards **clicking toggles photo ⇄ the full dither print** through
  a Bayer dissolve: cells materialize (and dissolve away in reverse) in
  the order of the matrix's own 16 thresholds, 38ms per step — the image
  passes through its own printing screen. Fully interruptible: a walker
  chases the tap's target one threshold per tick, so tapping mid-dissolve
  just turns it around from wherever it is. Works on touch; reduced motion
  swaps instantly. No hover behavior — the print answers to touch, like
  paper. Captions on covers are
  braille numerals (`lib/braille.ts`); readable dates stay for assistive
  tech.
- **Blog index rows**: one catalog row per post — 64×44 dithered print thumb
  (still the shared morph element) resting over two quiet paper sheets, title,
  dotted leader (the typewriter TOC register), tabular date. The sheets are
  static decoration; they never join the morph or change the row geometry.
  Desktop titles remain one line; below 40rem they may use two balanced lines
  before truncating. Rows swing in center-out.
- **Hover cards are informational only**: `.link-card` carries
  `pointer-events: none; user-select: none` — a card is a printed label,
  never a control. Email's card is a little paper ENVELOPE (folded flap,
  perforated avatar stamp, mono address); the trigger opens mailto:.
- **Room shelves** (`.room-shelf-plank`): records and books rest on an
  actual wooden plank — edge grain drawn with layered CSS streaks over an
  oak tone (walnut in dark), top highlight, wall shadow beneath, and
  per-item contact shadows where things meet the wood. The plank runs the
  full framed width even when half empty — that's the point. A persistent
  muted plain-text annotation directly below it names the selected object and
  is the shelf's only external link. Covers always select; they never navigate.
  Record and book spines use static cover-derived color and contrasting ink
  values stored with the shelf data, so SSR output is stable and no color is
  sampled at interaction time.
- **Paper record sleeves** (`components/vinyl-shelf.tsx`): larger worn-paper
  sleeves form a horizontal cover stack with one active album enlarged in
  front. Sleeves on either side turn inward in 3D; rotation increases with
  distance so nearby albums retain more cover while distant albums read
  increasingly as a spine. Each sleeve is a shallow 3D object with two rendered
  side faces carrying its album and artist, not a shaded strip painted over the
  cover. The middle item is selected by default so the first composition is
  balanced on both sides. The records themselves are not rendered; the visual
  system is entirely about paper sleeves, cover art, and their spines. One tap
  brings a sleeve forward; tapping the active sleeve leaves it selected. The
  sleeves carry a quiet layered drop shadow so their paper edges separate from
  one another without floating away from the plank. Covers keep the default
  cursor and only inactive sleeves lift slightly on a
  fine-pointer hover. The shelf is clipped to a centered 37.5rem frame. Pointer
  drag and horizontal trackpad wheel input pan the stack continuously; vertical
  wheel input remains native page scrolling. Releasing the pointer or ending a
  horizontal wheel gesture snaps to the nearest sleeve. The frame is tuned for
  nine albums: one centered selection and four progressively turned sleeves on
  either side. Sleeves without art retain the word-raster fallback.
- **Bookshelf** (`components/bookshelf.tsx`): one book opens at a time while
  the other books remain as tightly packed spines with 1px seams. The books are
  ordered by relevance to Cali's work as a designer, developer, and founder,
  rather than alphabetically or by color. Active covers keep their intrinsic
  aspect ratio at a fixed 210px book height; source dimensions drive the 3D
  projection, so square and narrow editions render whole without shifting the
  shelf. A closed book selects and opens into the accordion; activating the
  open book leaves it selected. The annotation below the plank is the only link
  to its official author or publisher page.
- Future candidates: ascii-on-hover for photos, dithered media
  placeholders, line-screen section dividers. One instrument per page —
  never stack rasters over each other.

## Entrance swing (lists)

Compact list rows may enter with a tiny swing — `translateY(12px)
rotate(-2°)` + blur → settled, 400ms `--ease-swift`, staggered **from the
center out** (50ms steps). Reserve the swing for item collections; prose
and chrome develop without rotation.

## Selective focus

The governing attention grammar: **the thing being attended to keeps full
ink.** Applications:

- **List rows (writing index, home list)**: hovering a row dims its siblings to
  44% opacity over 180ms `--ease-swift`; mouse-out restores instantly. Rows
  remain sharp and the hovered row itself does not move.
- **Media loading**: images/video in card grids sit as blur-up placeholders
  and resolve to sharp when loaded or attended.
- Focus-pull requires `@media (hover: hover) and (pointer: fine)` and is fully
  disabled under `prefers-reduced-motion`.

## Post marginalia

Post wayfinding is a collapsible document minimap fixed to the left edge. The
title and h2/h3 headings are labeled landmarks, with three short ticks between
every pair. The even rhythm is deliberately independent of section length. The
active landmark is the last one above the fixed 100px reading line, with
page-top and page-bottom overrides. Its tick expands
with `scaleX` and returns to full foreground ink. Landmark activation updates
the hash, lands the target 100px below the viewport edge, and focuses it.

At ≥64rem the minimap opens by default and develops once on mount with the same
center-out item stagger used by its toggle. From 40–63.99rem it starts closed
and reveals in place over the left gutter without moving itself or the article
on the x-axis. Across that compact range, opening the rail also develops a
masked 8px backdrop blur that fades into the page and leaves when the rail
closes, keeping overlapping prose quiet without shifting it. The rail itself
has no panel background or border: compact 1px ticks and
two-line-clamped labels sit directly in the margin. Fine-pointer layouts use a
9px vertical step; coarse-pointer layouts use an 11px step so the four steps
between landmarks provide non-overlapping 44px hit regions. Labels overlay that
fixed track so wrapping never changes its cadence.
Active, hovered, and keyboard-focused labels shift right to clear the longer
lead tick. A localized 44px back link sits above the map and returns to the
Writing index with a backward page transition. Back to top sits below the map
and becomes available after 75% of one viewport. Reduced motion makes the top
jump instant.

Below 40rem the same map becomes a top-center reading island. Its collapsed
44px surface is a true pill showing circular document progress, the
one-line-clamped article title, and a vertical chevron. It develops after the
title card clears the reading line, then retreats when the reader returns to the
post hero. Opening reveals one continuous translucent surface around the tick
map using opacity and transform only. The expanded list starts at the first
heading because the article title already remains in the island header. The
post stays in place underneath. The phone layout omits the Writing return link;
Top remains in the expanded island footer so the collapsed 44px surface stays
quiet.
Landmark jumps collapse the compact map after selection; tapping outside or
pressing Escape also closes it. It keeps bottom-dock and safe-area
clearance, and the map scrolls internally when its fixed rhythm exceeds the
available height. Larger layouts remain transparent and borderless.

Every toggle exposes `aria-expanded`/`aria-controls` and morphs its chevron
between directions. Map items remain mounted inside the clipped shell and
animate through Motion's DOM animator with a tiny center-out stagger, vertical
develop, and two-degree swing. Avoid native view-transition snapshots here:
they live above the island's clipping boundary. A closed map is inert and hidden
from assistive technology. Escape closes a compact map and restores toggle
focus. Reduced motion removes island, rail, content, tick, icon, and staggered
item transitions.

## Bilingual content

Interface strings render in both languages in the static DOM
(`lib/i18n.tsx`'s `<T zh en>` + `<LocalDate>`), and CSS shows one based on
the explicit route's `html[data-locale]`. Unprefixed public routes are Chinese;
English uses the matching `/en` route. The preferences dock crosses that root
layout boundary with a full navigation while preserving the current path,
query, and fragment. Public localStorage remembers the selection but never
overrides an explicit URL; only the isolated admin root retains in-place locale
restoration. Locale-sensitive attributes derive from the route so accessible
names never mix languages, and server metadata, canonical links, feeds, and OG
images share the same route identity.

Each post keeps its Chinese source in `index.mdx` and a complete English
translation in `index.en.mdx`. The matching route renders only that source and
its document minimap; English heading IDs retain their `en-` prefix for stable
links carried forward from the earlier dual-DOM implementation.

## Footer colophon

The leftmost desktop colophon puts the copyright at the top and Cali's local
clock at the bottom. The clock shows the `UTC+8` timezone, a muted tabular live
Asia/Taipei time in 12-hour `h:mm AM/PM` format without seconds, and a small
redundant analog face. The digital `<time>` is the accessible source; the clock
face is decorative and deliberately quieter than the footer trees. Its fixed
placeholder dimensions avoid hydration shift, and the second-aligned timer
pauses while the page is hidden. On mobile, contact and index remain a
two-column row and the colophon follows them as the final row; inside it,
copyright and clock occupy opposite halves of a two-column grid.

## Project index

The homepage Projects doorway is one standalone monochrome 52×52px app icon.
Its solid center axes, two diagonals, and circle are clipped by the icon's
rounded square, with the crossed project mark centered above them. The whole
icon lifts together by 2px over the 300ms physical-object spring while the mark
retains its fine-pointer exploded-diagram response. Touch and reduced-motion
presentations are static, and the Writing and Photos doorway vignettes remain
independent.

The project page opens with a short bilingual note, then one intentionally
ordered list. Each linked row is a compact artifact: a fixed 36px project icon,
the project name and domain, then its description. Narrow screens keep the icon
in the first column and stack all copy in the second, with natural wrapping and
no horizontal overflow. On wider screens, the name and description share the
same top edge regardless of either cell's line count. The introduction, project
names, and descriptions use balanced wrapping wherever they break.

On fine pointers, attending to a project lifts its icon by 1px and develops
quiet crop marks around it while the domain and northeast mark gain contrast;
the shared selective-focus treatment softens the other rows. The row never
expands or moves. Touch is a plain whole-row link, keyboard focus uses the
neutral focus ring without motion, and reduced motion keeps every artifact
still.

## Photo index

The photo route keeps its title in the prefetched static shell and streams the
active Published Photo Selection into a page-level masonry boundary. While the
selection resolves, six quiet, nonanimated tiles reserve the two-column mobile
or three-column desktop masonry. The placeholder uses the final card radius,
gutter, and neutral edge treatment so navigation responds immediately without
introducing a second visual language or shifting the page header.

## Owner admin

The admin is a desk in the same studio: it shares the warm paper, grain,
dashed column guides, and the 37.5rem center column, while staying outside
public analytics, social reads, and route view transitions. Its contract:

- **Owner dock** (`components/admin-dock.tsx`): the public dock's grammar —
  glass pill, sliding marker, tooltips with chord hints — carrying the admin
  surfaces. Avatar = Overview (`/admin`), then AMA / Media / Photos, a
  divider, a return arrow to the public site, and Preferences. The admin
  Preferences variant keeps language (in-place), theme, and sound, and adds
  Sign out (a form POST; server-side session revocation).
- **Chords**: inside the admin, G then O / A / M / P jumps between surfaces
  and G then S returns to the site. On the public dock, G then D opens the
  admin — armed only after the owner probe (`GET /api/admin/session`, called
  when the Preferences panel opens; a remembered confirmation arms it
  instantly on later visits). Visitors never see owner chrome and public
  pages stay fully static.
- **Quiet headers.** Admin pages open like public views: an h1 at 14px
  medium muted ink with a tabular count line. Structure comes from
  `hairline-top` separators and spacing, not from heavier type.
- **Surfaces.** Inspectors and pickers are dialogs on the surface ladder
  (`Elevated` offset 4); popovers stay at offset 2. Never a native
  `confirm()`/`prompt()`.
- **Confirmation grammar.** Reversible-but-notable actions (archive,
  disconnect) use a two-step armed button that relaxes after ~4s.
  Irreversible actions (Purge) require the typed confirmation word inside
  the dialog; the server validates the same literal. Publishing shows an
  inline summary of what changes before one confirm.
- **No entrance animations** — the admin is daily-use chrome (frequency
  principle). Status is a quiet dot: amber for in-flight, red only for
  broken or destructive. Numbers are always `tabular-nums`.
- **Instant shells.** Every admin surface partially prerenders: the paper,
  column, dock, page header, and fixed-dimension skeleton placeholders are
  the static shell (prefetched, so dock navigation is instant), and owner
  data streams in behind each page's Suspense loader. Skeletons follow the
  photo-index rule — quiet, nonanimated, final geometry, zero layout
  shift. Only `/admin/login` (a pure redirect) stays a blocking route.
- There is no step-up verification anywhere in the admin (July 2026
  decision); owner authorization is the server-side Clerk `siteOwner`
  check plus origin guards, rate limits, and audit events.

## Liquid glass dock

The dock pill is real glass: a runtime-built displacement map (rounded-rect
SDF, four-fold symmetric — one quadrant computed, mirrored into four; R/G
channels encode the x/y bend, ramping outward through a 16px edge band,
curve 1.6) drives an SVG `feDisplacementMap` applied as an inline-style
`backdrop-filter: url(#…) blur(4px) saturate(1.25)` over a 68% paper
background. Three displacement passes at staggered scales (44 ±10%) split
the RGB channels for a faint chromatic fringe along the rim, recombined
with screen blends; an inset top highlight (white 0.2 over, 0.06 under) plays the
specular. The map and
filter get a fresh id on every resize. Chromium-only by design —
Safari/Firefox can't run SVG filters in `backdrop-filter` and get a plain
frosted pane (blur 6px) instead. The `backdrop-filter` must stay inline:
LightningCSS strips the raw property from stylesheets.

When UI sound is enabled, moving to a different dock destination uses Cuelume's
soft two-note `chime` cue; changing language, theme, or sound uses its warm
three-note `success` cue; and toggling a blog post cover uses its quick
`sparkle` cue when developing the dither print and `droplet` when clearing it
back to the photo. Re-selecting the current dock destination stays silent.

## Fluid page transitions

Index → post navigation continues the selective-focus grammar: the origin
page defocuses (the hovered row already sharp), and the post rises over that
blurred backdrop — cover and title morphing as shared elements over 300–350ms
`--ease-swift`; the rest crossfades. Post pages may open as a staged title
card (title + date settle first, content follows). Browsers without view
transitions get instant navigation — no JS fallback animation. Reduced motion
disables all of it. Transitions never delay navigation: content is statically
generated, and the transition plays over already-available content.

Implementation: `experimental.viewTransition` + `view-transition-name` pairs
(`cover-<slug>` via PolaroidCover's `morph` prop, `title-<slug>` on row
title/post h1). The document root remains static; the named route-content group
uses a 250ms fade + `blur(2px)` defocus and a 300ms focus-in. Shared groups use
320ms `--ease-swift`. The shared h1 remains unanimated, metadata develops from
320–570ms, and the prose starts at 520ms. This overlap hands the title card
into reading without delaying navigation.

## Instant-photo cover treatment

Post covers render as instant-print photographs. Governing principle: the
photo is a physical object you pick up — and **paper doesn't squish** (scale
and fade it, never deform it).

- Paper frame: 2% of width on the top and sides, with a fixed 28px bottom
  band. The OG treatment uses a 16:9 photo crop at 432px wide and leaves that
  band empty, with no readable caption or date. An inner hairline ring where photo
  meets frame (inset shadow ≈ `rgb(0 0 0 / 0.14)`) sells the print edge.
- Deterministic base tilt of −2° to 2° derived from the slug (stable across
  builds).
- **Hover = pick-up, not flatten**: rotate a further +1.2° from the base tilt
  and scale to 1.03, 300ms `--ease-spring`, `@media (hover: hover)` only.
  Press (`:active`) squishes the *gesture* — `scale(0.94)` — not the paper.
  Exception: a photo with interactive affordances on it may straighten on
  hover instead, so its controls are easy to grab.
- Entrance (first paint of a listing): pop in from `rotate(base ± a few deg)
  scale(0.85) opacity 0` to settled, ~350ms, staggered ~65ms per photo.
  Scale + fade only. Skip after first visit in the session.
- Shadow: `0 2px 4px -1px rgb(0 0 0 / 0.18)` at rest, stepping up the shadow
  scale on hover with the same timing as the pick-up.
- The same treatment renders the OG image, so a shared post is recognizably
  the same object.
- The frame is a component (`PolaroidCover`), not per-post CSS.

## Ambient background: paper, grain, and guides

The page reads as a sheet of working paper, not a void:

- **Grain**: a tiled noise texture over the whole page (fixed, tiled,
  `pointer-events: none`), at an opacity just past the threshold of
  perception. Light and dark modes get separately tuned strengths.
- **Guides**: the content column is boxed by full-height dashed vertical
  hairlines (2px dash / 2px gap) at both column edges. The top horizontal
  dashed rule is intentionally absent; the bottom ruler and both bent ruler
  arcs remain. All are hairline-weight marks at ~16px insets.
- No full-page dot matrix — texture comes from grain, structure from guides.
- Everything in this layer is `pointer-events: none`, `user-select: none`,
  and must be missable: noticed on the second visit, not the first.

## Micro-interaction craft

Few interactions, disproportionate care:

- Buttons: `transform: scale(0.97)` on `:active`, 100ms. 44px minimum hit
  area (pseudo-element if visually smaller).
- Copy buttons on every code block; copied state swaps icon for 1.5s with no
  layout shift (fixed-width slot).
- Anchored headings scroll with `scroll-margin-top` matching the nav height.
- Icon-only controls always carry `aria-label`. Tabbing reaches only visible
  elements; keyboard focus scrolls into view.
- Skeletons and dynamic slots have hardcoded dimensions — zero layout shift
  is a feature gate for merging.

## Illustration accents

Diagrams and decorative accents use a hand-drawn technical style: inline SVG,
stroke widths in the 1.35–1.8 range, `stroke-linecap="round"`, slight waver,
no fills or flat-vector look. Labels use a dedicated annotation face (the
handwriting-feel font), not the body font. Strokes may draw themselves on
first view (path-draw animation with tapered ends, ~0.5–1.25s), respecting
reduced motion. Decorative instances set `role="img"` + `aria-label` (or
`aria-hidden` if truly ornamental), `user-select: none`,
`pointer-events: none`. Used sparingly, mostly inside posts.

## Static by default

Blog and feeds are statically generated. OG images render from repository-owned
inputs through the long-lived cached, same-origin `/og` route so custom staging
aliases never advertise deployment-host assets. GitHub and YouTube social data
revalidate on ISR timers and fall back to committed snapshots. Fonts are
preloaded (except the CJK fallback, which loads on demand); above-the-fold images
get `rel="preload"`. Page scrollbars are never customized; code-block scrollbars
may be.
