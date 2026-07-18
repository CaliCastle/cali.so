# Plan 006: Make the Operator Stack optional per site

> **Executor instructions**: This plan extends the committed Site Profile from
> plan 005; it does not add an environment feature flag. cali.so remains
> full-stack in every environment. A public-only fork returns 404 for Operator
> Stack routes before provider/environment initialization while retaining the
> source and packages needed by full-stack forks. Run every Verify gate and
> update only this plan's status row in `advisor-plans/README.md`.
>
> **Drift check (run first)**:
> `git diff --stat 59a39bc..HEAD -- site.config.ts lib/site/site-config.test.ts proxy.ts lib/operator-stack.ts lib/operator-stack.test.ts lib/site-proxy.ts lib/security/clerk-proxy.ts lib/security/admin-proxy.test.ts lib/security/operator-proxy.test.ts lib/public-content-proxy.test.ts lib/security/headers.ts app/_components/site-document.tsx app/admin/layout.tsx app/admin/layout.test.tsx app/operator-layouts.test.tsx app/\(zh\)/ama/layout.tsx app/\(en\)/en/ama/layout.tsx app/\(zh\)/photos/layout.tsx app/\(en\)/en/photos/layout.tsx app/admin/\(protected\)/layout.tsx app/admin/\(protected\)/page.tsx app/admin/\(protected\)/ama/page.tsx app/admin/\(protected\)/media/page.tsx app/admin/\(protected\)/photos/page.tsx app/admin/login/page.tsx app/_views/home-page.tsx app/_views/home-page.test.tsx components/nav-cards.tsx components/published-photo-wall.tsx components/dock.tsx components/dock.test.tsx components/preferences.tsx components/preferences.test.tsx components/admin-dock.tsx components/site-footer.tsx components/site-footer.test.tsx hooks/use-dock-go-shortcuts.ts hooks/use-dock-go-shortcuts.test.tsx app/sitemap.ts app/robots.ts app/seo-routes.test.ts scripts/verify-public-discovery.mjs scripts/verify-legacy-url-contract.mjs scripts/verify-production-security-boundary.mjs lib/media/photo-selection/public.ts lib/media/photo-selection/repository.ts lib/media/photo-selection/repository.test.ts lib/media/photo-selection/server.ts lib/media/photo-selection/operator-server.ts lib/media/photo-selection/server.test.ts lib/media/photo-selection/public-ui.test.tsx lib/ama/server-env.ts lib/ama/server-env.test.ts lib/ama/server-env-gate.test.ts app/admin/\(protected\)/AdminOverview.tsx app/admin/\(protected\)/AdminOverview.test.tsx app/admin/\(protected\)/ama/AmaSettings.tsx app/admin/\(protected\)/ama/shared.tsx app/admin/\(protected\)/ama/AmaOperations.tsx app/admin/\(protected\)/ama/bookings/\[bookingId\]/BookingDetail.tsx app/admin/\(protected\)/media/MediaLibrary.tsx lib/ama/admin/server.ts lib/ama/admin/ama-settings.test.tsx lib/ama/admin/ama-operations.test.tsx lib/ama/admin/booking-detail.test.tsx lib/ama/booking/server.ts lib/ama/booking/service.ts lib/ama/booking/service.test.ts lib/ama/booking/manage-token.ts lib/ama/booking/manage-token.test.ts lib/ama/email/templates.ts lib/ama/email/templates.test.ts lib/ama/meeting/tencent.ts lib/ama/meeting/tencent.test.ts lib/ama/operations/handlers.ts lib/ama/operations/handlers.test.ts lib/ama/secrets.ts lib/ama/secrets.test.ts lib/ama/security/server.ts lib/media/admin/server.ts lib/media/admin/ui.test.tsx lib/media/privacy/capture-location.ts lib/media/privacy/capture-location.test.ts lib/media/storage/contract.ts lib/media/storage/contract.test.ts docs/adr/0008-owner-admin-is-always-available.md docs/adr/0012-committed-operator-stack-profile.md lib/site/CONTEXT.md lib/ama/CONTEXT.md lib/media/CONTEXT.md .env.example advisor-plans/README.md`
> Also run
> `git diff --stat 59a39bc..HEAD -- app/site-document.test.tsx components/admin-dock.test.tsx app/api/admin/session/route.ts app/admin/\(protected\)/ama/bookings/\[bookingId\]/page.tsx docs/security/baseline.md docs/security/verification.md`.
> Compare changed files with the exact interfaces, route inventory, and fixed
> compatibility vectors below. Status-only index changes and plan 005's
> committed dependency diff are expected. Any other meaningful mismatch is a
> STOP condition.

## Status

- **Priority**: P1
- **Effort**: L
- **Risk**: HIGH
- **Depends on**: `advisor-plans/005-deepen-site-profile.md`
- **Category**: security
- **Planned at**: commit `59a39bc`, 2026-07-18

## Why this matters

The public site and owner-operated infrastructure are currently one deployment
contract. A public-only fork still reaches Media, Photos, AMA, admin, Clerk,
Neon, Bunny, payment, calendar, email, and internal work modules. One committed
`operatorStack` choice gives forks a small interface while keeping every
credential-backed capability fail-closed.

ADR-0008 still applies to cali.so: owner admin is available in every deployed
environment whenever the committed profile is `true`. A public-only fork
commits `false` before it has operator data or deployments; this is a site
profile, not an environment kill switch.

## Current state

`proxy.ts:53-60` initializes Clerk at module evaluation, before route
classification can bypass it:

```ts
const clerkProxy = clerkMiddleware(async (auth, request) => {
  if (isAdminPage(request.nextUrl.pathname)) await auth.protect()
  return siteProxy(request)
})

export function proxy(request: NextRequest, event: NextFetchEvent) {
  if (!usesClerk(request.nextUrl.pathname)) return siteProxy(request)
  return clerkProxy(request, event)
}
```

The owner admin is already provider-free on the client: `app/admin/layout.tsx`
renders a static `SiteDocument`, and the partially prerendered admin routes put
owner data behind Suspense loaders that call `requireOwnerPage`. There is no
`ClerkProvider`, client-side Clerk, or per-request nonce CSP. Clerk remains only
in proxy/server authentication; `lib/security/headers.ts` supplies one static,
nonce-free policy for public and admin shells. This static/PPR architecture is
the true-profile baseline and must not be reversed.

`lib/media/photo-selection/server.ts` still owns database/Bunny imports in the
same module as the public reader. `lib/ama/server-env.ts:12-19` parses process
environment whenever its getters are called, with no profile gate.

Public Home, dock, footer, shortcuts, sitemap, and discovery always advertise
Photos/AMA. The legacy URL manifest intentionally expects current operator
public pages to return 200; it is an immutable true-profile contract and must
not be edited.

## Target interface and semantics

Plan 005 supplies committed non-secret fields including:

```ts
siteConfig.id            // 'cali.so': durable/provider domain separators
siteConfig.keyNamespace  // 'cali': browser/local-storage/rate-limit keys
siteConfig.canonicalUrl
siteConfig.owner
```

Extend that interface only with:

```ts
operatorStack: boolean
```

The committed cali.so value is `true`. No environment variable may override
it.

When `false`:

- `/photos`, `/en/photos`, `/ama`, `/en/ama`, `/admin`, and descendants return
  404;
- `/api/admin`, `/api/ama`, `/api/internal/ama`, `/api/internal/media`, and
  descendants return a minimal 404 before Clerk, env parsing, database,
  storage, payment, calendar, email, or work adapters evaluate;
- Home/nav/dock/shortcuts/footer/sitemap/discovery omit Photos and AMA;
- public Preferences never probes `/api/admin/session`, never reads or writes
  the cached `localStorage.owner` hint, never shows Admin, and never arms G-D;
- public Home, Writing, Projects, feeds, and content build with all Operator
  Stack environment variables blank;
- source, packages, migrations, and snapshots remain in the clone.

When `true`, every current route, auth rule, feature derivation, provider
failure mode, Published Photo Selection contract, and exact output remains.
That includes the static/PPR admin shell, `/admin` Overview, AMA/Media/Photos
information architecture, public owner-session probe and G-D entry, owner-dock
O/A/M/P/S chords, no client Clerk, no passkey reverification, and the static
nonce-free CSP.

## Required module shape

Keep provider imports behind real seams:

1. `lib/operator-stack.ts` is pure and exposes
   `operatorStackEnabled()` plus `classifyOperatorPath(pathname)` returning
   `page | api | public`. Use exact-or-slash-prefix matching. `/amazing` and
   `/photoshop` are public.
2. `lib/site-proxy.ts` owns provider-free public-content classification, 404
   responses, and route decisions. It does not create a nonce or stamp CSP;
   `lib/security/headers.ts` remains the unchanged static policy source.
3. `lib/security/clerk-proxy.ts` alone imports Clerk and owns its middleware.
   `proxy.ts` classifies disabled operator routes first and dynamically imports
   this module only for an enabled Clerk-owned request. Remove the module-scope
   `clerkMiddleware(...)` call.
4. `app/admin/layout.tsx` calls `notFound()` before rendering the existing
   provider-free static `SiteDocument` when false. When true it preserves the
   existing static/PPR document exactly; do not add `ClerkProvider`, a dynamic
   provider wrapper, per-request nonce work, or client-side auth.
5. `lib/media/photo-selection/public.ts` is provider-free and owns the public
   selection type, cache tag, and `getHomepagePhotoPreview` projection.
   Repository, public UI, and admin invalidation import that contract instead
   of making UI modules import the Drizzle repository. Public `server.ts`
   returns `null` before dynamically importing
   `lib/media/photo-selection/operator-server.ts` when false; only the operator
   module in that public-reader path owns DB/Bunny/repository imports and the
   cached reader implementation.
6. `getServerEnv()` throws an explicit programmer error before
   `parseServerEnv(process.env)` when false. `getAmaFeatures()` returns every
   capability false without reading env.

The interface is the test surface. Tests must prove provider modules/factories
were never evaluated, not merely that their returned functions were skipped.

## Commands you will need

| Purpose | Command | Expected on success |
| --- | --- | --- |
| Profile/classifier | `pnpm exec vitest run lib/site/site-config.test.ts lib/operator-stack.test.ts` | profile plus exact/prefix/negative cases pass |
| Isolation | focused command in Step 3 | false never evaluates Clerk module/middleware/provider |
| Public surfaces | focused command in Step 4 | true unchanged; false omits every operator affordance/adapter |
| Compatibility | focused command in Step 5 | fixed vectors and exact current output pass |
| Env gate | focused command in Step 6 | false avoids schema/provider parsing |
| Full suite | `pnpm test:unit` | every baseline and newly added canonical test passes |
| Typecheck/build | `pnpm typecheck && pnpm build` | both exit 0 |
| Patch check | `git diff --check` | no output, exit 0 |

## Scope

**Create**:

- `lib/operator-stack.ts`
- `lib/operator-stack.test.ts`
- `lib/site-proxy.ts`
- `lib/security/clerk-proxy.ts`
- `lib/security/operator-proxy.test.ts`
- `app/operator-layouts.test.tsx`
- `app/(zh)/ama/layout.tsx`
- `app/(en)/en/ama/layout.tsx`
- `app/(zh)/photos/layout.tsx`
- `app/(en)/en/photos/layout.tsx`
- `lib/media/photo-selection/operator-server.ts`
- `lib/media/photo-selection/public.ts`
- `lib/ama/server-env-gate.test.ts`
- `lib/ama/booking/manage-token.test.ts`
- `components/preferences.test.tsx`
- `components/admin-dock.test.tsx`
- `docs/adr/0012-committed-operator-stack-profile.md`

**Modify**:

- `site.config.ts`
- `lib/site/site-config.test.ts`
- `proxy.ts`
- `lib/security/admin-proxy.test.ts`
- `lib/public-content-proxy.test.ts`
- `app/admin/layout.tsx`
- `app/admin/layout.test.tsx`
- `app/_views/home-page.tsx`
- `app/_views/home-page.test.tsx`
- `components/nav-cards.tsx`
- `components/dock.tsx`
- `components/dock.test.tsx`
- `components/preferences.tsx`
- `components/admin-dock.tsx`
- `components/site-footer.tsx`
- `components/site-footer.test.tsx`
- `hooks/use-dock-go-shortcuts.ts`
- `hooks/use-dock-go-shortcuts.test.tsx`
- `app/sitemap.ts`
- `app/robots.ts`
- `app/seo-routes.test.ts`
- `scripts/verify-public-discovery.mjs`
- `scripts/verify-legacy-url-contract.mjs`
- `scripts/verify-production-security-boundary.mjs`
- `lib/media/photo-selection/server.ts`
- `lib/media/photo-selection/repository.ts`
- `lib/media/photo-selection/repository.test.ts`
- `lib/media/photo-selection/server.test.ts`
- `lib/media/photo-selection/public-ui.test.tsx`
- `components/published-photo-wall.tsx`
- `lib/ama/server-env.ts`
- `lib/ama/server-env.test.ts`
- `app/admin/(protected)/AdminOverview.tsx`
- `app/admin/(protected)/AdminOverview.test.tsx`
- `app/admin/(protected)/ama/AmaSettings.tsx`
- `app/admin/(protected)/ama/shared.tsx`
- `app/admin/(protected)/ama/AmaOperations.tsx`
- `app/admin/(protected)/ama/bookings/[bookingId]/BookingDetail.tsx`
- `app/admin/(protected)/media/MediaLibrary.tsx`
- `lib/ama/admin/server.ts`
- `lib/ama/admin/ama-settings.test.tsx`
- `lib/ama/admin/ama-operations.test.tsx`
- `lib/ama/admin/booking-detail.test.tsx`
- `lib/ama/booking/server.ts`
- `lib/ama/booking/service.ts`
- `lib/ama/booking/service.test.ts`
- `lib/ama/booking/manage-token.ts`
- `lib/ama/email/templates.ts`
- `lib/ama/email/templates.test.ts`
- `lib/ama/meeting/tencent.ts`
- `lib/ama/meeting/tencent.test.ts`
- `lib/ama/operations/handlers.ts`
- `lib/ama/operations/handlers.test.ts`
- `lib/ama/secrets.ts`
- `lib/ama/secrets.test.ts`
- `lib/ama/security/server.ts`
- `lib/media/admin/server.ts`
- `lib/media/admin/ui.test.tsx`
- `lib/media/privacy/capture-location.ts`
- `lib/media/privacy/capture-location.test.ts`
- `lib/media/storage/contract.ts`
- `lib/media/storage/contract.test.ts`
- `docs/adr/0008-owner-admin-is-always-available.md`
- `docs/security/baseline.md`
- `docs/security/verification.md`
- `lib/site/CONTEXT.md`
- `lib/ama/CONTEXT.md`
- `lib/media/CONTEXT.md`
- `.env.example`
- `advisor-plans/README.md` status row only

**Reference-only PPR/security audit; do not modify unless the plan is updated**:

- `app/_components/site-document.tsx`
- `app/site-document.test.tsx`
- `app/admin/(protected)/layout.tsx`
- `app/admin/(protected)/page.tsx`
- `app/admin/(protected)/ama/page.tsx`
- `app/admin/(protected)/ama/bookings/[bookingId]/page.tsx`
- `app/admin/(protected)/media/page.tsx`
- `app/admin/(protected)/photos/page.tsx`
- `app/admin/(protected)/AdminShell.tsx`
- `app/admin/(protected)/AdminShell.test.tsx`
- `app/admin/login/page.tsx`
- `app/api/admin/session/route.ts`
- `lib/security/headers.ts`

**Out of scope**:

- Deleting operator source, packages, routes, migrations, snapshots, or data.
- Editing `content/legacy-url-manifest.json`.
- Making true-profile credentials optional or changing provider pair rules.
- Environment-controlled Operator Stack flags or per-provider profile flags.
- Static photo fallback, new CMS, alternate gallery source, or physical
  tree-shaking/distribution.
- Production/cloud/database access or migration execution.
- Changing cali.so from committed `operatorStack: true`.

## Git workflow

- Branch: `cali/006-gate-operator-stack`
- Stage only the exact Scope paths.
- Commit: `feat: add public-only site profile`
- Do not push or open a pull request unless instructed.

## Steps

### Step 1: Record the decision

Add **Operator Stack** to `lib/site/CONTEXT.md`: owner-only Media/AMA
capabilities plus the public Photos/AMA surfaces they publish. Create ADR 0012
for the committed all-or-nothing profile, 404/no-provider false semantics,
stable `id`/`keyNamespace`, and shared source/packages. Amend ADR-0008 and the
AMA/Media context docs only to qualify “always available” by the committed
profile, never by environment.

Reconcile the two canonical security notes at the same time. In
`docs/security/baseline.md` and `docs/security/verification.md`, qualify owner
admin availability and the absence of an environment kill switch by committed
`operatorStack: true`; document the false profile as a pre-provider 404, not an
authorization bypass. Replace the obsolete dynamic-admin/per-request-nonce CSP
description with the current provider-free static/PPR shell, server/proxy Clerk
authorization, and shared static nonce-free CSP. Preserve dated hosted evidence,
the exact `siteOwner: "yes"` authorization marker, and every unrelated security
control.

Record that true preserves the existing provider-free static/PPR admin:
middleware and server loaders own Clerk authorization, static CSP remains
nonce-free, and passkey reverification is not reintroduced. The profile gate is
not permission to move provider code into the static shell or flatten Suspense
loaders.

**Verify**:

```bash
test -f docs/adr/0012-committed-operator-stack-profile.md
rg -q "Operator Stack" lib/site/CONTEXT.md lib/ama/CONTEXT.md \
  lib/media/CONTEXT.md docs/adr/0012-committed-operator-stack-profile.md
rg -qF '`operatorStack: true`' docs/security/baseline.md \
  docs/security/verification.md
rg -qF 'static' docs/security/baseline.md docs/security/verification.md
! rg -n 'dynamic `/admin` surface receives a fresh nonce|Owner admin is an always-available control plane|Owner admin is always reachable and has no environment switch' \
  docs/security/baseline.md docs/security/verification.md
```

All commands exit 0; the negative scan prints nothing.

### Step 2: Add the pure route classifier

Implement the classifier and boolean reader from Required module shape. Page
prefixes: `/photos`, `/en/photos`, `/ama`, `/en/ama`, `/admin`. API prefixes:
`/api/admin`, `/api/ama`, `/api/internal/ama`, `/api/internal/media`.

**Verify**:
`pnpm exec vitest run lib/site/site-config.test.ts lib/operator-stack.test.ts`
-> the extended profile type/value plus exact paths, descendants, trailing
slashes, localized routes, APIs, `/amazing`, and `/photoshop` all pass.

### Step 3: Gate proxy and layouts before provider evaluation

Implement the provider-free proxy/dynamic Clerk split and five layout guards
exactly as Required module shape states. The admin guard wraps the existing
provider-free static document directly; the other four guard the localized
AMA/Photos trees. Expand the proxy matcher to every operator prefix. Read the
pinned guides first:

- `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`
- `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/not-found.md`
- `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/layout.md`

Before editing, re-audit every reference-only admin layout/page. The July 2026
admin deliberately partially prerenders its paper, centered column, owner dock,
headings, and fixed fallbacks. Provider/database work must remain inside async
Suspense loaders after `requireOwnerPage`, with no module-scope env parse or
provider factory. Preserve every `instant` value, fallback dimension, route,
owner-dock item, and server authorization call. If the false build exposes a
module-scope provider initialization in one of those reference-only files, STOP
and update Scope rather than flattening PPR or making the admin dynamic.

False pages rewrite to `/_not-found` with status 404. False APIs return a
minimal 404, never redirect/401/403/503. True keeps Clerk protection and
public-content behavior byte-for-byte, stamps no proxy CSP/nonce, and retains
the existing static CSP from `lib/security/headers.ts`.

**Verify**:

```bash
pnpm exec vitest run lib/security/admin-proxy.test.ts \
  lib/security/operator-proxy.test.ts lib/public-content-proxy.test.ts \
  app/admin/layout.test.tsx app/operator-layouts.test.tsx \
  "app/admin/(protected)/AdminShell.test.tsx" app/site-document.test.tsx
git diff --exit-code -- app/_components/site-document.tsx \
  "app/admin/(protected)/layout.tsx" \
  "app/admin/(protected)/page.tsx" \
  "app/admin/(protected)/ama/page.tsx" \
  "app/admin/(protected)/ama/bookings/[bookingId]/page.tsx" \
  "app/admin/(protected)/media/page.tsx" \
  "app/admin/(protected)/photos/page.tsx" \
  "app/admin/(protected)/AdminShell.tsx" app/admin/login/page.tsx \
  app/api/admin/session/route.ts lib/security/headers.ts
```

All tests pass and the reference-only diff is empty. False cases prove Clerk's
module and middleware factory were never evaluated and `SiteDocument` was not
rendered. True cases preserve the static/PPR admin, owner shell, current auth,
and static nonce-free CSP without adding client Clerk or passkey code.

### Step 4: Remove false-profile public reachability and data access

Under false, omit the Published Photo Selection Suspense branch, Photos/AMA
cards, dock/fallback items, G-then-P/G-then-A shortcuts, footer Photos link,
sitemap entries, robots/discovery expectations, and photo adapter resolution.
`NavCards` renders a deliberate two-card layout with unchanged mobile order.

Gate the July 2026 owner-entry machinery at the same committed seam. A false
public dock must ignore even a stale `localStorage.owner === '1'` hint;
Preferences must not fetch `/api/admin/session`, read/write that hint, render the
Admin row, or arm G-D. The admin route and `/api/admin/session` still receive the
same proxy-level minimal 404 as the rest of `/admin` and `/api/admin`. Under
true, preserve the current on-open session probe, cached-hint self-correction,
Admin row, unlocalized public G-D chord, and owner-dock O/A/M/P/S chords exactly.

Add explicit cases, with the Site Profile module mocked before import: false Dock
ignores a seeded owner hint; opening false Preferences makes no session request
and does not access the owner key; false G-P/G-A/G-D are inert; true Preferences
still probes, corrects the hint, and reveals Admin; true public G-D and every
owner-dock chord retain their current localized/unlocalized destinations.

Move the public selection type, cache tag, and homepage projection into the
provider-free `lib/media/photo-selection/public.ts`. Update every type/projection
consumer to import that module. In particular, `app/_views/home-page.tsx` must
not runtime-import `lib/media/photo-selection/repository.ts`; a false-profile
Home render test must fail if the repository or operator reader evaluates.

Make `scripts/verify-legacy-url-contract.mjs` profile-aware without editing the
manifest: true enforces every manifest expectation unchanged; false expects
404 only for entries classified as operator pages.

Make `scripts/verify-production-security-boundary.mjs` profile-aware as well.
True runs every current assertion byte-for-byte. False probes every operator
page/API prefix plus one descendant, requires a minimal 404 with no redirect or
provider/env detail, and still requires 200 plus the existing security headers
for core public pages. Add one true-profile assertion for the current read-only
`GET /api/admin/session` contract: an unauthenticated request returns 200,
`{ owner: false }`, `cache-control: no-store`, and no redirect or session detail.
The same path is a minimal 404 under false.

**Verify**:

```bash
pnpm exec vitest run app/_views/home-page.test.tsx \
  lib/media/photo-selection/public-ui.test.tsx components/dock.test.tsx \
  components/preferences.test.tsx \
  components/site-footer.test.tsx hooks/use-dock-go-shortcuts.test.tsx \
  app/seo-routes.test.ts lib/media/photo-selection/server.test.ts \
  lib/media/photo-selection/repository.test.ts
```

All tests pass. True retains every current URL/label, owner probe, Admin entry,
public G-D chord, and owner-dock chords. False has no Photos/AMA card, link,
shortcut, sitemap entry, DB call, Bunny call, repository/operator module evaluation,
owner-session request, owner-hint storage access, Admin row, or G-D navigation.

### Step 5: Preserve operator identity bytes through the Site Profile

Migrate identity in this complete production inventory and no other source:

- `app/admin/(protected)/AdminOverview.tsx`
- `app/admin/(protected)/ama/AmaSettings.tsx`
- `app/admin/(protected)/ama/shared.tsx`
- `app/admin/(protected)/ama/AmaOperations.tsx`
- `app/admin/(protected)/ama/bookings/[bookingId]/BookingDetail.tsx`
- `app/admin/(protected)/media/MediaLibrary.tsx`
- `components/admin-dock.tsx`
- `lib/ama/admin/server.ts`
- `lib/ama/booking/server.ts`
- `lib/ama/booking/service.ts`
- `lib/ama/booking/manage-token.ts`
- `lib/ama/email/templates.ts`
- `lib/ama/meeting/tencent.ts`
- `lib/ama/operations/handlers.ts`
- `lib/ama/secrets.ts`
- `lib/ama/security/server.ts`
- `lib/media/admin/server.ts`
- `lib/media/privacy/capture-location.ts`
- `lib/media/storage/contract.ts`

Map every existing literal without changing its current cali.so bytes:

- use `siteConfig.id` for existing `cali.so:` durable/AAD bytes and provider
  client identity;
- use `siteConfig.keyNamespace` for existing `cali:` browser, storage, and
  rate-limit keys;
- use `siteConfig.canonicalUrl` when the literal is the site's public origin,
  not when it is a durable `cali.so:` namespace;
- use `siteConfig.owner.displayName`, `.givenName`, and `.timeZone` for their
  corresponding owner-facing values;
- use the existing Site Profile repository, public-email, profile, and asset
  fields only where the current literal has that exact meaning.

Never move `ADMIN_EMAIL` into config: it remains the environment-backed durable
operator-data owner, not the public contact address.

Add fixed compatibility vectors, not values recomputed by the function under
test:

- Manage token, key `Buffer.alloc(32, 5)`, booking `bk_1`:
  `NSuJzFywTZ3f9m3RyfdbgBKt2NAPJJmLiZfDaqHNfZQ`.
- Calendar event ID for `bk_1` at `2026-07-10T09:00:00.000Z`:
  `2e7bb12893ab2ef04b276d36b58a58a9b7ec143c7b0df8cbe84b5d7e8552c720`.
- Add fixed legacy-envelope open vectors to `lib/ama/secrets.test.ts` and
  `lib/media/privacy/capture-location.test.ts` before replacing AAD literals.
- Preserve these four exact `keyNamespace` compositions:
  `cali:ama:public-mutation`, `cali:ama:admin-mutation`,
  `cali:media:alt-text`, and
  `cali:media-upload:v1:<checksum>:<byteSize>:<contentType>`.

In `lib/operator-stack.test.ts`, add source-backed compatibility assertions for
the exact template-literal composition in the three rate-limit modules, plus
fixed expected-string assertions using cali.so's committed `keyNamespace`.
This deliberately catches a missing colon or changed suffix without importing
provider-heavy server modules. In `lib/media/admin/ui.test.tsx`, exercise the
upload replay path and assert the complete local-storage key, not only storage
length. Expected strings must be literal test fixtures, never generated by the
same implementation under test.

Update the Overview and AMA Settings tests to keep the current cali.so owner
time zone output exact. Add a focused Admin Dock fallback test that fixes the
current Overview/AMA/Media/Photos/return information architecture, avatar asset,
and O/A/M/P/S chord labels. This is true-profile regression coverage; the false
profile removes the route before the owner dock can render.

**Verify**:

```bash
pnpm exec vitest run "app/admin/(protected)/AdminShell.test.tsx" \
  "app/admin/(protected)/AdminOverview.test.tsx" \
  components/admin-dock.test.tsx lib/operator-stack.test.ts \
  lib/ama/admin/ama-settings.test.tsx lib/ama/admin/ama-operations.test.tsx \
  lib/ama/admin/booking-detail.test.tsx lib/ama/booking/manage-token.test.ts \
  lib/ama/booking/service.test.ts lib/ama/email/templates.test.ts \
  lib/ama/meeting/tencent.test.ts lib/ama/operations/handlers.test.ts \
  lib/ama/secrets.test.ts lib/media/admin/ui.test.tsx \
  lib/media/privacy/capture-location.test.ts lib/media/storage/contract.test.ts
```

All tests pass with exact current cali.so strings, all four fixed
`keyNamespace` outputs, the fixed durable namespace/envelope vectors, and the
current owner-admin IA/chord/avatar contract.

### Step 6: Make false safe without weakening true

Implement the env and photo-selection dynamic gates from Required module shape.
Update `.env.example`: false requires no env file for public rendering; true
retains every current required key/provider pair and documented defaulted
tunable. Document `AI_GATEWAY_API_KEY` as optional only for Local/CI; deployed
Vercel environments use OIDC, while non-Vercel Production rejects the static
key and cannot use Alt Text Suggestions under the current provider policy. Do
not add `OPERATOR_STACK_ENABLED` or any equivalent variable.

**Verify**:

```bash
pnpm exec vitest run lib/ama/server-env.test.ts \
  lib/ama/server-env-gate.test.ts lib/media/photo-selection/server.test.ts
! rg -n 'OPERATOR_STACK(_ENABLED)?' .env.example app components hooks lib proxy.ts
```

Tests pass; the scan prints nothing and exits 0. False returns all AMA features
disabled and throws the explicit programmer error before schema parsing.

### Step 7: Prove true and false profiles

**Verify**:

First run the committed true profile:

```bash
(
  set -euo pipefail
  unset LEGACY_URL_BASE_URL PUBLIC_LINKS_BASE_URL \
    PUBLIC_DISCOVERY_BASE_URL PUBLIC_DISCOVERY_EXPECTED_ORIGIN \
    SECURITY_BOUNDARY_BASE_URL VERIFY_EXTERNAL_LINKS
  pnpm test:unit
  pnpm test:localization
  pnpm typecheck
  pnpm build
  pnpm verify:legacy-urls
  pnpm verify:links
  pnpm verify:public-discovery
  pnpm verify:security-boundary
  git diff --check
)
```

All commands exit 0; true preserves current output, manifest behavior, static
admin shells/fallbacks, current IA/chords, server authorization, and static
nonce-free CSP. The unset selectors force every HTTP verifier to start the
just-built local server instead of following an inherited remote base URL or
external-link mode.

Then run the false profile inside one failure-safe shell block. The block saves
the implemented true file to a unique temporary path, arms restoration before
the temporary patch can change source, and restores from that byte-for-byte
snapshot on normal exit, command failure, or signal. `apply_patch` remains the
only authored temporary edit; `cp` is used only by the failure-safe restoration.
Blank the exact credential/provider/origin variables below so a local env file
cannot satisfy operator setup, and unset every remote verifier selector. The
`SITE_URL=` override deliberately exercises Plan 005's blank-safe
`siteConfig.canonicalUrl` fallback instead of accepting an origin from a local
env file.
Defaulted numeric/model tunables are deliberately irrelevant to this
credential-free proof and need not be blanked.

```bash
(
  set -euo pipefail
  unset LEGACY_URL_BASE_URL PUBLIC_LINKS_BASE_URL \
    PUBLIC_DISCOVERY_BASE_URL PUBLIC_DISCOVERY_EXPECTED_ORIGIN \
    SECURITY_BOUNDARY_BASE_URL VERIFY_EXTERNAL_LINKS

  backup="$(mktemp "${TMPDIR:-/tmp}/cali-site-config-operator-true.XXXXXX")"
  cp site.config.ts "$backup"
  restore_armed=0

  restore_config() {
    if [ "$restore_armed" -eq 0 ]; then return 0; fi
    if ! cp "$backup" site.config.ts; then return 1; fi
    if ! cmp -s site.config.ts "$backup"; then return 1; fi
    restore_armed=0
  }
  cleanup() {
    exit_code=$?
    set +e
    trap - EXIT HUP INT TERM
    restored=1
    if ! restore_config; then
      restored=0
      exit_code=1
      printf 'site.config.ts restoration failed; backup retained at %s\n' \
        "$backup" >&2
    fi
    if [ "$restored" -eq 1 ]; then
      trash "$backup" >/dev/null 2>&1 || true
    fi
    exit "$exit_code"
  }
  trap cleanup EXIT
  trap 'exit 129' HUP
  trap 'exit 130' INT
  trap 'exit 143' TERM

  restore_armed=1
  apply_patch <<'PATCH'
*** Begin Patch
*** Update File: site.config.ts
@@
-  operatorStack: true,
+  operatorStack: false,
*** End Patch
PATCH

  node --input-type=module -e "const {siteConfig}=await import('./site.config.ts'); if (siteConfig.operatorStack !== false) process.exit(1)"

  operator_env=(
    DATABASE_URL= MIGRATION_DATABASE_URL=
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY= CLERK_SECRET_KEY=
    ADMIN_EMAIL= AMA_ENCRYPTION_KEY= RATE_LIMIT_HASH_KEY= CRON_SECRET=
    GOOGLE_CLIENT_ID= GOOGLE_CLIENT_SECRET=
    STRIPE_SECRET_KEY= STRIPE_WEBHOOK_SECRET=
    RESEND_API_KEY= AMA_EMAIL_FROM=
    TENCENT_MEETING_MCP_URL= TENCENT_MEETING_MCP_TOKEN=
    UPSTASH_REDIS_REST_URL= UPSTASH_REDIS_REST_TOKEN=
    KV_REST_API_URL= KV_REST_API_TOKEN= KV_REST_API_READ_ONLY_TOKEN=
    KV_URL= REDIS_URL=
    BUNNY_MEDIA_REGION= BUNNY_ORIGINALS_ZONE= BUNNY_ORIGINALS_PASSWORD=
    BUNNY_RENDITIONS_ZONE= BUNNY_RENDITIONS_PASSWORD=
    BUNNY_RENDITIONS_CDN_URL= BUNNY_CDN_API_KEY= MEDIA_ENCRYPTION_KEY=
    GOOGLE_MAPS_GEOCODING_API_KEY= AI_GATEWAY_API_KEY=
    SITE_URL=
  )
  env "${operator_env[@]}" pnpm build
  env "${operator_env[@]}" pnpm verify:legacy-urls
  env "${operator_env[@]}" pnpm verify:links
  env "${operator_env[@]}" pnpm verify:public-discovery
  env "${operator_env[@]}" pnpm verify:security-boundary

  restore_config
  node --input-type=module -e "const {siteConfig}=await import('./site.config.ts'); if (siteConfig.operatorStack !== true) process.exit(1)"
  pnpm build
  pnpm verify:security-boundary
  git diff --check
)
```

The false assertion and all five false-profile commands exit 0. Core public
pages remain 200; every listed operator page/API is 404; focused test spies prove
no provider adapter ran. Every verifier uses the local false build. The trap is
armed before the patch and restores true even when a command or signal stops the
block; its `cmp` is the byte-for-byte gate. The final assertion, build, local
security check, and patch check prove the restored true profile. If restoration
fails, STOP immediately and use the retained unique backup path reported by the
trap before doing any other work.

The false `pnpm build` is also the completion gate for the reference-only PPR
audit: every admin page module may be compiled, but none may parse operator env
or initialize a provider at module scope. Do not satisfy this gate by removing
the static shell, Suspense boundaries, or current route metadata.

## Test plan

- Pure classifier covers exact, descendant, localized, trailing-slash, and
  prefix-confusion cases.
- Proxy/layout tests prove false returns 404 before provider module evaluation;
  true retains the static CSP and provider-free PPR admin document.
- Public tests prove false removes affordances, owner probe/hint/G-D behavior,
  and data calls; true preserves both public and owner-dock navigation exactly.
- Fixed vectors protect `cali.so:`/`cali:` namespaces and legacy envelopes.
- Env tests prove false never parses operator env and true remains strict.
- Canonical security-document checks prove both notes qualify admin availability
  by committed `operatorStack: true`, define false as a pre-provider 404 rather
  than an authorization bypass, and replace dynamic-admin/per-request-nonce
  wording with the provider-free static/PPR shell, proxy/server Clerk
  authorization, and shared static nonce-free CSP.
- Scoped diff review proves unrelated dated hosted evidence, verification
  dates, and checklist state remain intact.
- Both committed profile builds/verifiers are mandatory and clear every remote
  base-URL/external-link selector before starting the local production server.

## Done criteria

- [ ] One committed boolean controls the Operator Stack; no env override exists.
- [ ] cali.so is restored to `operatorStack: true` byte-for-byte.
- [ ] Every listed false page/API returns 404 before provider evaluation.
- [ ] False omits all Photos/AMA/Admin affordances, owner-session/hint behavior,
      G-D, and adapter calls.
- [ ] False public build needs no operator credential.
- [ ] True preserves current routes, auth, provider behavior, output, and
      immutable legacy manifest expectations.
- [ ] True preserves the provider-free static/PPR admin, current IA and both
      dock chord sets, static nonce-free CSP, and no passkey reverification.
- [ ] Fixed namespace and legacy-envelope vectors pass.
- [ ] ADR/context wording distinguishes site profile from environment.
- [ ] Both canonical security notes qualify admin availability and the absence
      of an environment kill switch by committed `operatorStack: true`.
- [ ] Both notes describe false-profile operator routes as 404 before Clerk,
      environment parsing, or provider initialization, not as an authorization
      bypass.
- [ ] Obsolete dynamic-admin/per-request-nonce wording is gone; both notes
      record the provider-free static/PPR admin, proxy/server Clerk
      authorization, and shared static nonce-free CSP.
- [ ] Unrelated dated hosted evidence, verification dates, and checklist state
      remain unchanged.
- [ ] Unit, localization, typecheck, build, legacy URLs, links, discovery,
      security boundary, and `git diff --check` pass.
- [ ] Both profile HTTP verifier runs target their just-built local `.next`
      output, never an inherited external deployment.
- [ ] Only exact Scope paths and the status row are modified.

## STOP conditions

- Live excerpts or plan 005's required Site Profile fields differ materially.
- A Verify command fails twice after a reasonable correction.
- Any implementation requires an out-of-scope file.
- Pinned Next 16.3 cannot dynamically isolate Clerk/provider evaluation.
- Preserving false semantics would flatten the admin PPR shell, make it dynamic,
  add client Clerk, restore nonce CSP, or restore passkey reverification.
- A false route becomes redirect/401/403/503 instead of 404.
- A true-profile compatibility vector changes.
- False requires editing the immutable legacy URL manifest.
- False still initializes operator env/provider code after the specified seams;
  report the import path instead of weakening the true schema.
- The temporary profile edit cannot be restored byte-for-byte.
- Production/cloud/database access, migrations, or data deletion are required.

## Maintenance notes

Do not split the profile into per-provider flags until real independent site
profiles require it. Provider credentials remain fail-closed capabilities
behind the full Operator Stack. Forks choose `id` and `keyNamespace` before
creating operator data; changing either later invalidates durable contracts.
