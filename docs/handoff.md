# v3 handoff

Current as of July 2026.

## Release state

- The ground-up rewrite is **v3**. The site released in 2024 remains the
  historical v2.
- Git **`dev`** is the long-lived Staging and integration branch. `main` drives
  Production; a reviewed `dev` to `main` pull request is the release path.
- Release scope and evidence are tracked by
  [#98](https://github.com/CaliCastle/cali.so/issues/98). Do not merge to
  `main` until its complete dependency chain and final proof are green.
- Release slices #99 through #106 are merged into `v2`. Final cutover proof is
  tracked by #107; those `v2` references are historical evidence from before
  the branch became `dev`.

## Current architecture

- Next.js 16.3 preview, React 19, TypeScript, Tailwind CSS v4, Base UI, and the
  `@fluid` component registry. The Next.js version is exact-pinned.
- Posts are MDX under `content/blog/<slug>/`; assets are colocated and served
  through the owned content route. Projects and personal registries are typed
  source files.
- Chinese keeps every established unprefixed URL. English uses the matching
  `/en` route family. Locale-specific feeds, metadata, and OG images follow the
  route, not browser-local state.
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
  decision) — see `docs/security/clerk-admin-operations.md`; the typed PURGE
  confirmation for Media purge is still validated server-side.
- The admin was redesigned in July 2026 to share the public design language
  (warm paper, 37.5rem column, an owner dock; spec in
  `docs/design-language.md` § Owner admin). IA: `/admin` is a one-screen
  overview, `/admin/ama` holds all AMA operations plus availability and
  Google Calendar settings, `/admin/media` is the upload-to-archive library,
  and `/admin/photos` is the Photo Selection curation room. The owner enters
  from the public dock's Preferences panel (owner-only row, or G then D),
  backed by a client probe to `GET /api/admin/session` so public pages stay
  static and Clerk stays off public routes.
- Admin routes adopt Cache Components (July 2026): every surface partially
  prerenders (`◐`) — the shell (paper, column, owner dock, page header,
  fixed-dimension skeletons) is static and prefetches, while owner data
  streams behind per-page Suspense loaders that each call
  `requireOwnerPage` before touching data; `clerkMiddleware` still gates
  every request, and `/admin/login` stays a deliberate `instant = false`
  redirect. Consequences: the admin has no client-side ClerkProvider (no
  Clerk JS ships to the admin at all), and the former per-request nonce
  admin CSP is retired — nonces force dynamic rendering — so admin pages
  use the static site policy from `lib/security/headers.ts`.
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
- Rate limits use Upstash only in Production. Preview persists its limits in
  the isolated Neon database, while Local and CI use process-local limits.
- GitHub Actions owns deployment ordering. `dev` migrates the persistent Neon
  `staging` branch before deploying Vercel Staging. Internal feature branches
  use persistent `preview/<git-branch>` children of Staging. Production lives
  in a separate Neon project and waits for two sequential protected-environment
  approvals before database access.
- Security baseline controls from PR #97 remain mandatory: CSP and security
  headers, same-origin mutation policy, rate limits, kill switches,
  privacy-safe audit events, isolated credentials, and security automation.
- The Bunny-backed Media Library in ADR-0007 owns the curated photo workflow.
  Private Originals stay server-only, while `/photos` and homepage previews
  consume the active Published Photo Selection from Bunny Renditions. Media
  capabilities have no runtime feature switches: Alt Text Suggestions are on
  by default and, since July 2026, auto-apply as the approved bilingual Alt
  Text when none exists yet (upload-to-archive needs no review step; edits
  and regeneration remain available in the inspector). Location Label
  suggestions follow their provider credential.

## Launch gates

1. Preserve every legacy public URL through native content, a static archive,
   or an intentional permanent replacement. Drive verification from one
   checked-in manifest, not spot checks.
2. Complete all three issue #91 stages: Cache Components baseline,
   route-by-route Instant Navigations, then Partial Prefetching.
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
pnpm test:port-post
pnpm test:ama
pnpm test:deployment
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
pnpm build
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
- Raw stylesheet `backdrop-filter` is stripped by the CSS pipeline. The liquid
  dock owns its SVG filter as an inline style; ordinary blur uses Tailwind
  utilities.
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
- Local builds validate the full server environment. Keep `.env.local`
  aligned with `.env.example`; blank provider placeholders are fine, but the
  always-required values (`ADMIN_EMAIL`, `AMA_ENCRYPTION_KEY`,
  `RATE_LIMIT_HASH_KEY`, `SITE_URL`, Bunny media) must be present.

## Post-launch work

- #93's passkey-first high-impact boundary was retired in July 2026
  (maintainer decision): the owner admin has no step-up verification, and
  passkeys remain only as the Clerk sign-in method. Hosted setup, session
  revocation, and credential rotation stay documented in
  `docs/security/clerk-admin-operations.md`. The public AMA product slices
  (#82 through #87) are implemented and enabled by default; going live end
  to end only needs the provider credential pairs and hosted checks in
  `docs/ama-booking-operations.md`.
- Revisit Bunny S3 preview constraints and provider capabilities before
  expanding the Media Library beyond the curated photo workflow.
- Re-enable private capabilities only after their provider, retention,
  incident-response, and hosted-control checks are complete.
