# v3 handoff

Current as of July 2026.

## Release state

- The ground-up rewrite is **v3**. The site released in 2024 remains the
  historical v2.
- v3.0 reached `main` on July 20, 2026 through
  [PR #195](https://github.com/CaliCastle/cali.so/pull/195), at merge commit
  `4f071ab`. `dev` was restored at that same commit after GitHub's automatic
  branch cleanup and is protected against deletion and force pushes.
- [PR #206](https://github.com/CaliCastle/cali.so/pull/206) completed the
  Production hotfix at merge commit `d891463`. Attempt 3 of
  [Deploy Production run #29707454879](https://github.com/CaliCastle/cali.so/actions/runs/29707454879)
  passed the expand-only check, applied migrations with the dedicated
  `cali_migrator` role, and deployed that exact commit automatically. The live
  public and signed-out admin boundaries pass at `https://cali.so`.
- Git **`dev`** is the long-lived Staging and integration branch. `main` drives
  Production; a reviewed `dev` to `main` pull request is the release path.
- Release scope and evidence are preserved in closed issues
  [#98](https://github.com/CaliCastle/cali.so/issues/98) and
  [#107](https://github.com/CaliCastle/cali.so/issues/107), plus
  `docs/v3-cutover-readiness.md`. References there to Git `v2` are historical
  evidence from before the integration branch became `dev`.

## Current architecture

- Next.js 16.3 preview, React 19, TypeScript, Tailwind CSS v4, Base UI, and the
  `@fluid` component registry. The Next.js version is exact-pinned.
- Posts are MDX under `content/blog/<slug>/`; assets are colocated and served
  through the owned content route. Projects and personal registries are typed
  source files.
- Chinese keeps every established unprefixed URL. English uses the matching
  `/en` route family. Locale-specific feeds, metadata, and OG images follow the
  route, not browser-local state.
- `PUBLIC_SITE_URL` owns the public discovery identity used by canonical links,
  feeds, alternates, and social metadata. `SITE_URL` is the operational origin
  for application links, provider callbacks, and same-origin mutation checks;
  Staging therefore keeps `https://beta.cali.so` without leaking that alias into
  production discovery output.
- Public pages are static where possible. GitHub and YouTube social values use
  ISR-backed fetches with committed JSON snapshots as outage fallbacks.
- Vercel Web Analytics is instrumented to collect first-party page views
  across the public Chinese and English route families. Owner-admin routes
  stay excluded from public analytics.
- External-link cards keep metadata in a committed snapshot refreshed through
  `og.zolplay.com`; the same first-party service proxies fixed-slot favicons and
  Open Graph images, and missing media remains a non-blocking presentation
  failure.
- The fixed bottom dock is the primary navigation. The visual contract lives
  in `docs/design-language.md`.
- The owner admin is always reachable for Media and AMA operations, with
  Clerk authentication and an exact server-checked
  `publicMetadata.siteOwner = "yes"` authorization marker. Origin checks, rate
  limits, audit events, and the strict admin CSP remain in force. Passkey
  step-up (reverification) was removed entirely in July 2026 (maintainer
  decision) — see `docs/security/clerk-admin-operations.md`. Media Purge uses
  one fixed confirmation dialog with no typed phrase.
- The admin was redesigned in July 2026 to share the public design language
  (warm paper, 37.5rem column, an owner dock; spec in
  `docs/design-language.md` § Owner admin). IA: `/admin` is a one-screen
  overview, `/admin/ama` is a menu over `/admin/ama/bookings` (operations,
  time requests, failed operations) and `/admin/ama/settings` (availability
  windows, Google Calendar, open-time preview) — settings form POSTs
  redirect back to `/admin/ama/settings` — `/admin/media` is the
  upload-to-archive library, and `/admin/photos` is the Photo Selection
  curation room. Surfaces holding more than one job become menus with
  back-marked subpages rather than one stacked screen. The owner enters
  from the public dock's Preferences panel (owner-only row, or G then D),
  backed by a client probe to `GET /api/admin/session` so public pages stay
  static and Clerk stays off public routes.
- Admin routes adopt Cache Components (July 2026): every surface partially
  prerenders (`◐`) — the shell (paper, column, owner dock, page header,
  fixed-dimension skeletons) is static and prefetches, while owner data
  streams behind per-page Suspense loaders that each call
  `requireOwnerPage` before touching data; `clerkMiddleware` still gates
  every request, and `/admin/login` stays a deliberate `instant = false`
  redirect. Consequences: the former per-request nonce admin CSP is
  retired because nonces force dynamic rendering. The admin ships one
  non-dynamic `ClerkProvider` (no UI, no request data, shell still
  prerenders) purely so clerk-js keeps refreshing Clerk's 60-second
  session-token cookie — without it, every idle minute ended in a
  handshake redirect or an admin API 401 full-page reload. Admin pages
  therefore use a static admin policy from `lib/security/headers.ts` that
  extends `script-src` and `connect-src` with the Clerk instance origin
  (derived from the publishable key); AMA settings additionally extends
  `form-action` for the redirect to Google OAuth.
- The complete paid AMA booking system (#79, slices #82 through #87) is
  implemented and enabled by default (maintainer decision, July 2026; the
  former `AMA_*_ENABLED` switches are removed): public `/ama` and
  `/ama/book`, Slot Holds
  with a Postgres exclusion guarantee, Stripe-hosted Checkout with an
  authoritative signed webhook, durable finalization (Google Meet, Tencent
  Meeting over MCP, Resend email, Manage Links), guest rescheduling and
  refunds, owner operations in `/admin/ama`, reminders, and 90-day Booking
  Brief retention. Provider-backed capabilities (payments, finalization,
  Google, Tencent) turn on when their credential pairs are configured and
  fail closed with 503 while they are not.
  `docs/ama-booking-operations.md` is the environment and operations
  reference.
- Rate limits use Upstash only in Production. Staging and Preview persist their
  limits in isolated Neon databases, while Local and CI use process-local
  limits.
- GitHub Actions owns deployment ordering. `dev` migrates the persistent Neon
  `staging` branch before deploying Vercel Staging. Internal feature branches
  use persistent `preview/<git-branch>` children of Staging. Production lives
  in a separate Neon project; every commit reaching `main` automatically uses
  the `main`-only Production environment to migrate before deploying.
- Security baseline controls from PR #97 remain mandatory: CSP and security
  headers, same-origin mutation policy, rate limits, credential-driven
  fail-closed provider controls, privacy-safe audit events, isolated
  credentials, and security automation.
- Playwright is the browser release gate. Quality runs the complete production-
  build Chromium suite plus a WebKit smoke matrix, while Preview and Staging
  rerun the read-only hosted subset against the exact deployment URL.
- The Bunny-backed Media Library in ADR-0007 and ADR-0013 owns the curated
  photo workflow. One Bunny Media zone stores Originals, Renditions, and
  transfer chunks; Pull Zone rules expose only `/renditions/*`. Browser
  transfers use retryable 4 MiB
  same-origin chunks so the 50 MiB product limit stays below Vercel's 4.5 MB
  per-request ceiling; completion assembles and verifies the Original in Bunny,
  and lease-claimed reconciliation removes abandoned chunks without racing an
  active transfer. `/photos` and homepage previews consume
  the active Published Photo Selection from Bunny Renditions. Media
  Transfer Jobs persist across dialog dismissal and reload; Retry and Discard
  stay in Transfers, including during processing, while only ready Media
  Assets appear in Library or Archived. Rendition writes serialize with
  Discard/Purge and persist their cleanup manifest before storage. Archive and
  Purge surgically withdraw the target from Draft and
  Published Photo Selections without publishing unrelated Draft edits. Archive
  offers immediate Undo when the affected revisions remain unchanged.
  capabilities have no runtime feature switches: Alt Text Suggestions are on
  by default and, since July 2026, auto-apply as the approved bilingual Alt
  Text when none exists yet (upload-to-archive needs no review step; edits
  and regeneration remain available in the inspector). Location Label
  suggestions follow their provider credential.
  Before promoting the one-zone Media contract to Production, set
  `BUNNY_MEDIA_ZONE`,
  `BUNNY_MEDIA_PASSWORD`, and `BUNNY_MEDIA_CDN_URL` from the existing
  Rendition zone, then add the two protected-path Edge Rules. Remove the old
  Original and Rendition variable names only after the new contract verifies.
  Emptying or retiring the former Original zone is a separate destructive
  cloud operation and requires fresh confirmation.

## Release gates

1. Preserve every legacy public URL through native content, a static archive,
   or an intentional permanent replacement. Drive verification from one
   checked-in manifest, not spot checks.
2. Preserve the completed issue #91 baseline: Cache Components,
   route-by-route Instant Navigations, and Partial Prefetching.
3. Keep owner admin authenticated and reachable, and keep AMA capabilities
   whose provider credentials are absent failing closed with 503.
4. Validate from a frozen-lockfile install: types, all tests, migrations,
   localization, security, production build, dependency audit, links, HTTP
   contracts, and browser checks.
5. Review a production-like Vercel Preview across both languages, appearance
   modes, mobile and desktop, reduced motion, keyboard navigation, metadata,
   feeds, social images, and navigation shells.
6. Record hosted controls and production prerequisites as pass, fail, unknown,
   or awaiting confirmed access. Never count an unverified external state as
   passed.
7. Run separate repository-standards and release-spec reviews over the complete
   diff before proposing the `main` merge.

Production database or sensitive cloud-data access is not implied by release
work. It requires two fresh explicit confirmations immediately before access.

## Commands

```bash
pnpm install --frozen-lockfile
pnpm dev

pnpm typecheck
pnpm test:unit
pnpm test:localization
pnpm test:ama
pnpm test:deployment
pnpm build
pnpm test:browser
pnpm test:security
pnpm test:media:storage
pnpm test:media:catalog
pnpm test:media:processing
pnpm test:media:ingestion
pnpm test:media:geocoding
pnpm test:media:alt-text
pnpm test:media:admin
pnpm test:media:asset-review
pnpm test:media:photo-selection
pnpm test:media:purge
pnpm test:media:reconciliation
pnpm db:validate
pnpm verify:legacy-urls
pnpm verify:links
pnpm verify:public-discovery
pnpm verify:security-boundary
pnpm audit:prod
```

Deployment workflows run migrations before deployment with a scoped GitHub
environment credential. For an explicitly authorized local operation:

```bash
MIGRATION_DATABASE_URL=postgresql://... pnpm db:migrate
```

The Vercel runtime receives only the CRUD-only `DATABASE_URL`. Never put
`MIGRATION_DATABASE_URL` in Vercel or an ordinary runtime environment file.

## Gotchas

- Historical product v2 tags and old readiness evidence remain v2. Do not
  rewrite them when working on Git `dev`, the current v3 integration branch.
- This Next.js preview has breaking changes. Read the relevant bundled guide in
  `node_modules/next/dist/docs/` before changing framework behavior.
- `turbopack.root` supports nested worktrees and must stay configured.
- OG font subsetting runs only in the prebuild script. Runtime image routes
  load the generated `FrexSansGB-OG-*.ttf` files so HarfBuzz WASM stays out of
  Turbopack tracing. Preserve that boundary.
- Raw stylesheet `backdrop-filter` is stripped by the CSS pipeline. The
  dock's frosted pane (`DockGlass` in `components/dock.tsx`) carries its
  backdrop-filter as an inline style; ordinary blur uses Tailwind utilities.
- Staging/Preview and Production credentials and data are isolated in separate
  Neon projects. Non-production data must be disposable or irreversibly
  sanitized. Never attach Redis credentials to Staging or Preview; their
  rate-limit windows live in Neon.
- AMA has no capability switches: capabilities are on by default, and each
  provider capability follows its credential pair (complete or absent; a
  half pair fails startup). Owner admin has no capability switch either.
- Media has no capability switches. Alt Text Suggestions are always on;
  Location Label suggestions use Google Maps whenever its server credential is
  configured, while manual labels remain available without it.
- Design references are private. Public code and documentation use only the
  vocabulary in `docs/design-language.md`.
- In development the photo-selection dev fixture masks an empty or failed
  public read (production renders the empty state). The published-selection
  cache is a `'use cache'` function invalidated by publish via
  `revalidateTag(tag, { expire: 0 })`; a redeploy also rebuilds it fresh.
  A failing read aborts Vercel builds loudly (`VERCEL_ENV` set) instead of
  silently shipping an empty photos page; local builds with the usual
  shaped-but-unreachable `DATABASE_URL` still pass and render the empty
  state, with the failure logged.
- Local builds validate the full server environment. Keep `.env.local`
  aligned with `.env.example`; blank provider placeholders are fine, but the
  always-required values (`ADMIN_EMAIL`, `AMA_ENCRYPTION_KEY`,
  `RATE_LIMIT_HASH_KEY`, `SITE_URL`, Bunny media) must be present.

## Current work queue

GitHub Issues is the canonical planning surface. Refresh every issue's live
assumptions immediately before implementation.

1. #176 consolidates duplicated test infrastructure and CI ownership.
2. #180 adds the committed Site Profile. #181 depends on it and makes the
   Operator Stack optional per site without adding an environment kill switch.
3. #182 depends on #180 and #181 and documents the supported fork workflow.
4. #183 makes route-motion state explicit and fail-closed.
5. #89, #94, and #95 remain needs-triage follow-ups for public accounts,
   privacy, and incident-response operations.

The retired #93 passkey boundary remains documented in
`docs/security/clerk-admin-operations.md`. Revisit Bunny S3 preview constraints
before expanding Media beyond curated photos, and configure private provider
capabilities only after their retention, incident-response, and hosted-control
checks are complete.
