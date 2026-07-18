# Plan 006: Make the Operator Stack optional per site

> **Executor instructions**: This plan extends the committed Site Profile from
> plan 005; it does not add an environment feature flag. cali.so remains
> full-stack in every environment. A public-only fork returns 404 for Operator
> Stack routes before provider/environment initialization while retaining the
> source and packages needed by full-stack forks. Run every Verify gate and
> update only this plan's status row in `advisor-plans/README.md`.
>
> **Drift check (run first)**:
> `git diff --stat dc24eb3..HEAD -- site.config.ts lib/site/site-config.test.ts proxy.ts lib/operator-stack.ts lib/operator-stack.test.ts lib/site-proxy.ts lib/security/clerk-proxy.ts lib/security/admin-proxy.test.ts lib/security/operator-proxy.test.ts lib/public-content-proxy.test.ts app/admin/layout.tsx app/admin/layout.test.tsx app/admin/operator-document.tsx app/operator-layouts.test.tsx app/\(zh\)/ama/layout.tsx app/\(en\)/en/ama/layout.tsx app/\(zh\)/photos/layout.tsx app/\(en\)/en/photos/layout.tsx app/_views/home-page.tsx app/_views/home-page.test.tsx components/nav-cards.tsx components/published-photo-wall.tsx components/dock.tsx components/dock.test.tsx components/site-footer.tsx components/site-footer.test.tsx hooks/use-dock-go-shortcuts.ts hooks/use-dock-go-shortcuts.test.tsx app/sitemap.ts app/robots.ts app/seo-routes.test.ts scripts/verify-public-discovery.mjs scripts/verify-legacy-url-contract.mjs scripts/verify-production-security-boundary.mjs lib/media/photo-selection/public.ts lib/media/photo-selection/repository.ts lib/media/photo-selection/repository.test.ts lib/media/photo-selection/server.ts lib/media/photo-selection/operator-server.ts lib/media/photo-selection/server.test.ts lib/media/photo-selection/public-ui.test.tsx lib/ama/server-env.ts lib/ama/server-env.test.ts lib/ama/server-env-gate.test.ts app/admin/\(protected\)/AdminDashboard.tsx app/admin/\(protected\)/AdminShell.tsx app/admin/\(protected\)/AdminShell.test.tsx app/admin/\(protected\)/ama/shared.tsx app/admin/\(protected\)/ama/AmaOperations.tsx app/admin/\(protected\)/ama/bookings/\[bookingId\]/BookingDetail.tsx app/admin/\(protected\)/media/MediaLibrary.tsx lib/ama/admin/server.ts lib/ama/admin/dashboard.test.tsx lib/ama/admin/ama-operations.test.tsx lib/ama/admin/booking-detail.test.tsx lib/ama/booking/server.ts lib/ama/booking/service.ts lib/ama/booking/service.test.ts lib/ama/booking/manage-token.ts lib/ama/booking/manage-token.test.ts lib/ama/email/templates.ts lib/ama/email/templates.test.ts lib/ama/meeting/tencent.ts lib/ama/meeting/tencent.test.ts lib/ama/operations/handlers.ts lib/ama/operations/handlers.test.ts lib/ama/secrets.ts lib/ama/secrets.test.ts lib/ama/security/server.ts lib/media/admin/server.ts lib/media/admin/ui.test.tsx lib/media/privacy/capture-location.ts lib/media/privacy/capture-location.test.ts lib/media/storage/contract.ts lib/media/storage/contract.test.ts docs/adr/0008-owner-admin-is-always-available.md docs/adr/0012-committed-operator-stack-profile.md lib/site/CONTEXT.md lib/ama/CONTEXT.md lib/media/CONTEXT.md .env.example advisor-plans/README.md`
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
- **Planned at**: commit `dc24eb3`, 2026-07-18

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

`proxy.ts:65-72` initializes Clerk at module evaluation, before route
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

`app/admin/layout.tsx` imports/renders `ClerkProvider` before a public-only
guard could stop its module tree. `lib/media/photo-selection/server.ts` owns
database/Bunny imports in the same module as the public reader.
`lib/ama/server-env.ts:12-19` parses process environment whenever its getters
are called, with no profile gate.

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
- public Home, Writing, Projects, feeds, and content build with all Operator
  Stack environment variables blank;
- source, packages, migrations, and snapshots remain in the clone.

When `true`, every current route, auth rule, feature derivation, provider
failure mode, Published Photo Selection contract, and exact output remains.

## Required module shape

Keep provider imports behind real seams:

1. `lib/operator-stack.ts` is pure and exposes
   `operatorStackEnabled()` plus `classifyOperatorPath(pathname)` returning
   `page | api | public`. Use exact-or-slash-prefix matching. `/amazing` and
   `/photoshop` are public.
2. `lib/site-proxy.ts` owns provider-free public-content classification, 404
   responses, nonce/CSP work, and route decisions.
3. `lib/security/clerk-proxy.ts` alone imports Clerk and owns its middleware.
   `proxy.ts` classifies disabled operator routes first and dynamically imports
   this module only for an enabled Clerk-owned request. Remove the module-scope
   `clerkMiddleware(...)` call.
4. `app/admin/operator-document.tsx` alone imports/renders `ClerkProvider`.
   `app/admin/layout.tsx` calls `notFound()` first and dynamically imports this
   module only when enabled.
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
- `app/admin/operator-document.tsx`
- `app/operator-layouts.test.tsx`
- `app/(zh)/ama/layout.tsx`
- `app/(en)/en/ama/layout.tsx`
- `app/(zh)/photos/layout.tsx`
- `app/(en)/en/photos/layout.tsx`
- `lib/media/photo-selection/operator-server.ts`
- `lib/media/photo-selection/public.ts`
- `lib/ama/server-env-gate.test.ts`
- `lib/ama/booking/manage-token.test.ts`
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
- `app/admin/(protected)/AdminDashboard.tsx`
- `app/admin/(protected)/AdminShell.tsx`
- `app/admin/(protected)/AdminShell.test.tsx`
- `app/admin/(protected)/ama/shared.tsx`
- `app/admin/(protected)/ama/AmaOperations.tsx`
- `app/admin/(protected)/ama/bookings/[bookingId]/BookingDetail.tsx`
- `app/admin/(protected)/media/MediaLibrary.tsx`
- `lib/ama/admin/server.ts`
- `lib/ama/admin/dashboard.test.tsx`
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
- `lib/site/CONTEXT.md`
- `lib/ama/CONTEXT.md`
- `lib/media/CONTEXT.md`
- `.env.example`
- `advisor-plans/README.md` status row only

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

**Verify**:

```bash
test -f docs/adr/0012-committed-operator-stack-profile.md
rg -q "Operator Stack" lib/site/CONTEXT.md lib/ama/CONTEXT.md \
  lib/media/CONTEXT.md docs/adr/0012-committed-operator-stack-profile.md
```

Both commands exit 0.

### Step 2: Add the pure route classifier

Implement the classifier and boolean reader from Required module shape. Page
prefixes: `/photos`, `/en/photos`, `/ama`, `/en/ama`, `/admin`. API prefixes:
`/api/admin`, `/api/ama`, `/api/internal/ama`, `/api/internal/media`.

**Verify**:
`pnpm exec vitest run lib/site/site-config.test.ts lib/operator-stack.test.ts`
-> the extended profile type/value plus exact paths, descendants, trailing
slashes, localized routes, APIs, `/amazing`, and `/photoshop` all pass.

### Step 3: Gate proxy and layouts before provider evaluation

Implement the provider-free proxy/dynamic Clerk split, admin document split,
and five layout guards exactly as Required module shape states. Expand the
proxy matcher to every operator prefix. Read the pinned guides first:

- `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`
- `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/not-found.md`
- `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/layout.md`

False pages rewrite to `/_not-found` with status 404. False APIs return a
minimal 404, never redirect/401/403/503. True keeps nonce, CSP, Clerk protect,
and public-content behavior byte-for-byte.

**Verify**:

```bash
pnpm exec vitest run lib/security/admin-proxy.test.ts \
  lib/security/operator-proxy.test.ts lib/public-content-proxy.test.ts \
  app/admin/layout.test.tsx app/operator-layouts.test.tsx
```

All tests pass. False cases prove Clerk's module, middleware factory, and
provider module were never evaluated; true cases preserve current auth/CSP.

### Step 4: Remove false-profile public reachability and data access

Under false, omit the Published Photo Selection Suspense branch, Photos/AMA
cards, dock/fallback items, G-then-P/G-then-A shortcuts, footer Photos link,
sitemap entries, robots/discovery expectations, and photo adapter resolution.
`NavCards` renders a deliberate two-card layout with unchanged mobile order.

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
for core public pages.

**Verify**:

```bash
pnpm exec vitest run app/_views/home-page.test.tsx \
  lib/media/photo-selection/public-ui.test.tsx components/dock.test.tsx \
  components/site-footer.test.tsx hooks/use-dock-go-shortcuts.test.tsx \
  app/seo-routes.test.ts lib/media/photo-selection/server.test.ts \
  lib/media/photo-selection/repository.test.ts
```

All tests pass. True retains every current URL/label. False has no Photos/AMA
card, link, shortcut, sitemap entry, DB call, Bunny call, or repository/operator
module evaluation.

### Step 5: Preserve operator identity bytes through the Site Profile

Migrate identity in this complete production inventory and no other source:

- `app/admin/(protected)/AdminDashboard.tsx`
- `app/admin/(protected)/AdminShell.tsx`
- `app/admin/(protected)/ama/shared.tsx`
- `app/admin/(protected)/ama/AmaOperations.tsx`
- `app/admin/(protected)/ama/bookings/[bookingId]/BookingDetail.tsx`
- `app/admin/(protected)/media/MediaLibrary.tsx`
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

**Verify**:

```bash
pnpm exec vitest run "app/admin/(protected)/AdminShell.test.tsx" \
  lib/operator-stack.test.ts \
  lib/ama/admin/dashboard.test.tsx lib/ama/admin/ama-operations.test.tsx \
  lib/ama/admin/booking-detail.test.tsx lib/ama/booking/manage-token.test.ts \
  lib/ama/booking/service.test.ts lib/ama/email/templates.test.ts \
  lib/ama/meeting/tencent.test.ts lib/ama/operations/handlers.test.ts \
  lib/ama/secrets.test.ts lib/media/admin/ui.test.tsx \
  lib/media/privacy/capture-location.test.ts lib/media/storage/contract.test.ts
```

All tests pass with exact current cali.so strings, all four fixed
`keyNamespace` outputs, and the fixed durable namespace/envelope vectors.

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

All commands exit 0; true preserves current output and manifest behavior. The
unset selectors force every HTTP verifier to start the just-built local server
instead of following an inherited remote base URL or external-link mode.

Then run the false profile inside one failure-safe shell block. The block saves
the implemented true file to a unique temporary path, arms restoration before
the temporary patch can change source, and restores from that byte-for-byte
snapshot on normal exit, command failure, or signal. `apply_patch` remains the
only authored temporary edit; `cp` is used only by the failure-safe restoration.
Blank the exact credential/provider/origin variables below so a local env file
cannot satisfy operator setup, and unset every remote verifier selector.
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

## Test plan

- Pure classifier covers exact, descendant, localized, trailing-slash, and
  prefix-confusion cases.
- Proxy/layout tests prove false returns 404 before provider module evaluation.
- Public tests prove false removes affordances and data calls; true is exact.
- Fixed vectors protect `cali.so:`/`cali:` namespaces and legacy envelopes.
- Env tests prove false never parses operator env and true remains strict.
- Both committed profile builds/verifiers are mandatory and clear every remote
  base-URL/external-link selector before starting the local production server.

## Done criteria

- [ ] One committed boolean controls the Operator Stack; no env override exists.
- [ ] cali.so is restored to `operatorStack: true` byte-for-byte.
- [ ] Every listed false page/API returns 404 before provider evaluation.
- [ ] False omits all Photos/AMA affordances and adapter calls.
- [ ] False public build needs no operator credential.
- [ ] True preserves current routes, auth, provider behavior, output, and
      immutable legacy manifest expectations.
- [ ] Fixed namespace and legacy-envelope vectors pass.
- [ ] ADR/context wording distinguishes site profile from environment.
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
