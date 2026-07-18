# Plan 007: Document and verify the supported fork workflow

> **Executor instructions**: Make the post-cleanup repository usable as a
> template without a second branch or mutating setup tool. `docs/forking.md` is
> canonical; README and the bilingual article only summarize/link to it. Delete
> screenshots with `trash` or a patch, never `rm`. Run every Verify gate and
> update only this plan's status row in `advisor-plans/README.md`.
>
> **Drift check (run first)**:
> `git diff --stat 59a39bc..HEAD -- docs/forking.md scripts/template-check.mjs scripts/template-check.test.mjs scripts/forking-docs.test.mjs scripts/refresh-link-previews.test.mjs README.md docs/handoff.md .env.example LICENSE package.json scripts/refresh-link-previews.mjs content/link-previews.json content/blog/guide-for-cloning-my-site/index.mdx content/blog/guide-for-cloning-my-site/index.en.mdx content/blog/guide-for-cloning-my-site/image-1.png content/blog/guide-for-cloning-my-site/image-2.png content/blog/guide-for-cloning-my-site/image-3.png content/blog/guide-for-cloning-my-site/image-4.png content/blog/guide-for-cloning-my-site/image-5.png content/blog/guide-for-cloning-my-site/image-6.png content/blog/guide-for-cloning-my-site/image-7.png content/blog/guide-for-cloning-my-site/image-8.png content/blog/guide-for-cloning-my-site/image-9.png content/blog/guide-for-cloning-my-site/image-10.png content/blog/guide-for-cloning-my-site/image-11.png content/blog/guide-for-cloning-my-site/image-12.png content/blog/guide-for-cloning-my-site/image-13.png content/blog/guide-for-cloning-my-site/image-14.png content/blog/guide-for-cloning-my-site/image-15.png .github/workflows/cleanup-preview.yml .github/workflows/deploy-staging.yml .github/workflows/deploy-production.yml .github/workflows/refresh-preview.yml .github/workflows/media-storage-live.yml scripts/deployment-workflows.test.mjs advisor-plans/README.md`
> Also run
> `git diff --stat 59a39bc..HEAD -- docs/v3-cutover-ops-runbook.md docs/security/baseline.md docs/security/verification.md`.
> Compare changed paths with the exact docs/frontmatter/workflow/cache contracts
> below. Changes from dependency plans 002/004/005/006 and status-only index
> changes are expected; any other meaningful mismatch is a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: plans 002, 004, 005, and 006 in `advisor-plans/README.md`
- **Category**: docs
- **Planned at**: commit `59a39bc`, 2026-07-18

## Why this matters

README currently says the repository is not a template, while its 706-line
cloning article documents deleted v2 Sanity/comments/guestbook/Studio setup and
references 15 obsolete screenshots (about 18.5 MB). A supported fork needs one
current guide, a read-only readiness check, deterministic link-preview cleanup,
and an operational personal-content/license replacement contract.

The MIT grant covers original application source but excludes personal writing,
identity, photographs, artwork, branding, and third-party assets. Forks must
preserve Cali's upstream copyright/permission notice for MIT source, may add
their own notice, and must remove/replace excluded materials.

## Current state

`README.md:8-9` says the repository is not maintained as a template. Both
localized `guide-for-cloning-my-site` sources still describe v2 infrastructure.
The Chinese source owns publication/cover metadata; the English source only
overrides translated title/description and inherits the rest.

Existing automation is mixed:

- `deploy-preview.yml` already has the upstream repository/fork guard and is a
  read-only exemplar for this plan.
- `security.yml` is useful in forks and must stay unguarded.
- cleanup, staging, production, refresh-preview, and media-storage-live jobs
  mutate Cali-specific infrastructure and need upstream guards.

`docs/handoff.md:39-64` now records the July 2026 owner-admin contract: public
Preferences plus G-D reveal the owner entry through `GET /api/admin/session`;
`/admin` is Overview, with AMA, Media, and Photos as separate owner-dock
destinations; static shells and fixed fallbacks partially prerender while
server loaders call `requireOwnerPage`; client `ClerkProvider`, per-request
nonce CSP, and passkey reverification are intentionally absent. Preserve those
decisions. Its older “always reachable” wording is true only for the committed
`operatorStack: true` profile and must be qualified by profile, never by
environment.

`docs/v3-cutover-ops-runbook.md:65-69` still carries an obsolete Staging smoke
check that treats `/admin/photos` as a redirect to `/admin/media#publish`.
Those are separate current owner surfaces and must be tested independently.

## Target documentation contract

- `docs/forking.md` is the only detailed technical guide.
- README identifies cali.so as the live working example, links the guide, and
  names public-only/full Operator Stack profiles.
- Both public articles become concise localized v3 overviews linking the guide.
- Fork documentation preserves the current admin IA, owner entry, PPR/server
  authorization boundary, static nonce-free CSP, and passkey-removal decision.
  “Owner admin is always reachable” is stated only for a committed true profile;
  public-only forks have no owner probe, Admin row, G-D, or admin routes.
- Personal content stays checked in as the example but replacement/removal is
  mandatory. There is no template branch.
- `pnpm template:check` is read-only, non-networked, non-mutating, and never
  prints environment values. It warns on personal residue/missing env and exits
  nonzero only for invalid Site Profile structure or missing configured assets.
- No generator, prompt, browser opener, file rewrite, or automatic deletion is
  introduced.

## Checker interface

Add `template:check` to `package.json`:

```json
"template:check": "node scripts/template-check.mjs"
```

The checker prints these four stable headings exactly once:

1. `Site Profile`
2. `Identity residue`
3. `Mandatory replacements`
4. `Operator Stack`

Before scanning residue, the `Site Profile` section imports the committed
profile and mirrors Plan 005's structural gates exactly:

- `id` and `keyNamespace` match
  `^[a-z0-9](?:[a-z0-9._-]*[a-z0-9])?$`, so neither is empty, padded,
  uppercase, colon-bearing, or delimiter-suffixed;
- `repository.fullName` contains exactly one non-empty owner/repository pair;
- `repository.url` equals
  `https://github.com/${repository.fullName}` exactly, with no stale owner/repo,
  alternate origin, trailing slash, query, or hash;
- Cali's upstream full name still requires `id === 'cali.so'` and
  `keyNamespace === 'cali'`.

Invalid structure exits nonzero without printing field values. `site.config.ts`
is excluded only from identity-residue matching; it is never excluded from this
structural validation.

Its scan contract is exact:

- roots/files: `app`, `components`, `hooks`, `lib`, `scripts`, `proxy.ts`,
  `next.config.ts`, `package.json`, `vercel.json`, `.env.example`, `AGENTS.md`,
  `SECURITY.md`, and `.github`;
- exclusions: `site.config.ts`, checker source, tests/specs, `content`, `docs`,
  `public`, both plan directories, `.git`, `node_modules`, `.next`,
  `.pnpm-store`, and binary contents;
- markers: `Cali Castle`, `CaliCastle`, `calicastle`, `cali_so`,
  `hi@cali.so`, `cali.so`, `Asia/Taipei`,
  `5cbba503000000001101b6a2`, and
  `https://xhslink.com/m/7vluP5ANiNE`;
- generic authored `Cali` prose is a mandatory content replacement, not an
  identity-residue marker.

Report file/line only. Never print matching line contents or environment
values. Missing environment names are warnings.

For `operatorStack: true`, report these exact environment contracts without
reading their values:

- required runtime names: `DATABASE_URL`,
  `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `ADMIN_EMAIL`,
  `AMA_ENCRYPTION_KEY`, `RATE_LIMIT_HASH_KEY`, `SITE_URL` (except a trusted
  Vercel Preview deriving it from platform `VERCEL_URL`), `CRON_SECRET`,
  `BUNNY_MEDIA_REGION`, `BUNNY_ORIGINALS_ZONE`,
  `BUNNY_ORIGINALS_PASSWORD`, `BUNNY_RENDITIONS_ZONE`,
  `BUNNY_RENDITIONS_PASSWORD`, `BUNNY_RENDITIONS_CDN_URL`,
  `BUNNY_CDN_API_KEY`, and `MEDIA_ENCRYPTION_KEY`;
- optional complete pairs: `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET`,
  `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY` +
  `AMA_EMAIL_FROM`, and `TENCENT_MEETING_MCP_URL` +
  `TENCENT_MEETING_MCP_TOKEN`;
- optional single provider: `GOOGLE_MAPS_GEOCODING_API_KEY`;
- optional local/CI-only static Gateway credential: `AI_GATEWAY_API_KEY`;
  Vercel deployments use OIDC, while non-Vercel Production must reject the
  static key and cannot use Alt Text Suggestions under the current provider
  policy, matching `docs/media/ai-provider-policy.md`;
- Production rate-limit alternatives: either
  `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`, or
  `KV_REST_API_URL` + `KV_REST_API_TOKEN`; generated aliases
  `KV_REST_API_READ_ONLY_TOKEN`, `KV_URL`, and `REDIS_URL` do not satisfy the
  pair requirement;
- documented defaulted tunables: `ADMIN_MUTATION_RATE_LIMIT_MAX_REQUESTS`,
  `ADMIN_MUTATION_RATE_LIMIT_WINDOW_SECONDS`,
  `AMA_PUBLIC_RATE_LIMIT_MAX_REQUESTS`,
  `AMA_PUBLIC_RATE_LIMIT_WINDOW_SECONDS`, `MEDIA_ALT_TEXT_PRIMARY_MODEL`,
  `MEDIA_ALT_TEXT_FALLBACK_MODEL`, `MEDIA_ALT_TEXT_TIMEOUT_MS`,
  `MEDIA_ALT_TEXT_MAX_RETRIES`, `MEDIA_ALT_TEXT_RATE_LIMIT_MAX_REQUESTS`, and
  `MEDIA_ALT_TEXT_RATE_LIMIT_WINDOW_SECONDS`;
- operation-only names: `MIGRATION_DATABASE_URL` for an authorized migration,
  and `BUNNY_STORAGE_CONTRACT_ENVIRONMENT`,
  `BUNNY_STORAGE_CONTRACT_ORIGIN`,
  `BUNNY_STORAGE_CONTRACT_EDGE_TTL_SECONDS`, and
  `BUNNY_STORAGE_CONTRACT_BROWSER_TTL_SECONDS` for the opt-in non-production
  storage contract, plus `BUNNY_STORAGE_LIVE_TEST` as its explicit live-test
  confirmation. `VERCEL_ENV`/`VERCEL_URL` are platform context, not fork
  secrets.

For `operatorStack: false`, report zero required operator environment names and
these disabled families with descendants: `/photos`, `/en/photos`, `/ama`,
`/en/ama`, `/admin`, `/api/admin`, `/api/ama`, `/api/internal/ama`, and
`/api/internal/media`. Also report that the public owner-session probe,
`localStorage.owner` hint, Admin row, and G-D chord are disabled. Keep these
literal name sets and owner-entry semantics in the checker test so drift from
`.env.example`, the schema, or the committed UI contract fails visibly.

## Mandatory replacement inventory

The guide/checker must name at least:

- `site.config.ts`;
- `components/home-introduction.tsx`, `components/social-cards.tsx`,
  `app/_views/ama-page.tsx`, `app/_views/ama-book-page.tsx`,
  `lib/public-page-metadata.ts`, `lib/personal.ts`, `lib/projects.ts`;
- all `content/blog/**`, `content/newsletters/**`, and colocated media;
- `content/social.json`, `content/github.json`, `content/link-previews.json`;
- `content/legacy-url-manifest.json`, with instructions to update matching
  redirects/tests rather than blindly deleting the contract;
- `public/images/**`, `app/icon.png`, `docs/asset-sources.md`;
- README/package/repository metadata, `docs/handoff.md`, `AGENTS.md`,
  `SECURITY.md`,
  `.github/FUNDING.yml`, the exact workflow guards,
  `.github/actions/deploy-neon-vercel/action.yml`, and `vercel.json`;
- `.github/workflows/security.yml`: keep fork CI runnable, but replace the
  upstream Clerk publishable credential and canonical origin used by its test
  environment.

No fork workflow may require production DB/Bunny data, Clerk users, or secrets.

## Commands you will need

| Purpose | Command | Expected on success |
| --- | --- | --- |
| Checker | `node --test scripts/template-check.test.mjs && pnpm template:check` | tests pass; four headings once; source exits 0 with warnings |
| Docs | `node --test scripts/forking-docs.test.mjs` | guide/README/license/article contracts pass |
| Link previews | `node --test scripts/refresh-link-previews.test.mjs` | all cache/failure/write cases pass |
| Workflows | `pnpm test:deployment` | all guard/order tests pass |
| Localization | `pnpm test:localization` | localized article pair passes |
| Full suite | `pnpm test:unit && pnpm typecheck && pnpm build` | all exit 0 |
| Public contracts | `pnpm verify:legacy-urls && pnpm verify:links && pnpm verify:public-discovery && pnpm verify:security-boundary` | all exit 0 |
| Patch check | `git diff --check` | no output, exit 0 |

## Scope

**Create**:

- `docs/forking.md`
- `scripts/template-check.mjs`
- `scripts/template-check.test.mjs`
- `scripts/forking-docs.test.mjs`
- `scripts/refresh-link-previews.test.mjs`

**Modify**:

- `README.md`
- `docs/handoff.md`
- `docs/v3-cutover-ops-runbook.md`
- `.env.example`
- `LICENSE` only to link the guide without changing legal terms
- `package.json`
- `scripts/refresh-link-previews.mjs`
- `content/link-previews.json`
- `content/blog/guide-for-cloning-my-site/index.mdx`
- `content/blog/guide-for-cloning-my-site/index.en.mdx`
- `.github/workflows/cleanup-preview.yml`
- `.github/workflows/deploy-staging.yml`
- `.github/workflows/deploy-production.yml`
- `.github/workflows/refresh-preview.yml`
- `.github/workflows/media-storage-live.yml`
- `scripts/deployment-workflows.test.mjs`
- `advisor-plans/README.md` status row only

**Delete only after both articles stop referencing them**:

- `content/blog/guide-for-cloning-my-site/image-1.png` through `image-15.png`

**Reference-only, do not modify**:

- `.github/workflows/deploy-preview.yml` (existing guard exemplar)
- `.github/workflows/security.yml` (must remain runnable in forks)
- `docs/security/baseline.md` and `docs/security/verification.md` (canonical
  security wording reconciled by plan 006)
- `.github/FUNDING.yml`, `.github/actions/deploy-neon-vercel/action.yml`, and
  `vercel.json`, plus `AGENTS.md` and `SECURITY.md` (mandatory fork reviews or
  replacements documented/reported, not changed upstream)

**Out of scope**:

- Article slug/route, localized pairing, `publishedAt`/cover frontmatter, or
  `cover.png`; localized title and description are intentionally rewritten.
- Personal content/assets beyond the 15 tutorial screenshots.
- Legacy URL routes/archives/migrations/snapshots or the manifest itself.
- Production/cloud/database/provider actions.
- A template branch/package/generator/initializer or locale rearchitecture.
- Changing license grant/exception language or removing upstream notice.

## Git workflow

- Branch: `cali/007-document-fork-workflow`
- Stage only exact Scope paths and inspect binary deletions.
- Commit: `docs: add v3 fork workflow`
- Do not push or open a pull request unless instructed.

## Steps

### Step 1: Add the read-only checker

Implement the exact Checker interface through exported pure analysis functions
or temporary fixture directories. Tests cover valid source profile, missing
asset, every invalid namespace fixture from Plan 005 (empty, whitespace,
uppercase, leading/trailing punctuation, any colon, and a colon-suffixed
namespace), missing/multiple repository segments, stale Cali repository URL
after a full-name change, non-GitHub URL, URL suffixes, every marker with
file/line, false profile with zero required env, true profile exact
names/pairs/tunables plus the local/CI-only Gateway credential,
`AGENTS.md`/`SECURITY.md`/handoff/security-workflow reporting, and sentinel
secret redaction. Repository fixtures must enforce the exact
`https://github.com/${fullName}` equality. Stub `fetch`, filesystem
write/delete, prompt/stdin, browser-open, and child-process APIs to prove none
is called; snapshot fixture trees before/after to prove no mutation. Failure
output reports only safe labels and paths, never configured namespace or
repository values.

**Verify**:

```bash
node --test scripts/template-check.test.mjs
pnpm template:check
```

Tests pass. Each of the four headings appears exactly once; valid upstream
source exits 0 with warnings and never emits sentinel values.

### Step 2: Write the canonical guide

Create `docs/forking.md` with sections in this order:

1. profiles table (public-only/full Operator Stack);
2. Node 24, exact package-manager pnpm, Git, no production credentials/data;
3. clone/install and edit Site Profile before first operator use;
4. exact Mandatory replacement inventory;
5. MDX/content/assets and paired zh/en contract;
6. public-only setup and unreachable Photos/AMA/admin/operator APIs, including
   no owner-session probe, cached owner hint, Admin row, or G-D chord;
7. full-stack setup linking Neon/Clerk/Bunny/AMA/security operations docs and
   preserving the current owner-admin IA/PPR/auth/security decisions;
8. deployment choices;
9. license and personal-content removal;
10. mechanical/browser smoke checklist.

Public-only deployment removes both operator crons from its own `vercel.json`
and re-enables ordinary Vercel Git deployment. Full-stack forks replace repo
guards/infrastructure while preserving migration-before-deploy ordering.
The guide must state that owner admin is always reachable across deployed
environments only when the committed profile is `operatorStack: true`.
The Site Profile instructions require forks to change both namespace tokens,
`repository.fullName`, and its exactly matching GitHub URL together before the
first build or operator record.

The full-stack section names `/admin` Overview, `/admin/ama`, `/admin/media`,
and `/admin/photos`, plus public Preferences/G-D entry and the owner-dock chord
set. It explains that static shells/fallbacks prerender, provider/data work stays
behind `requireOwnerPage` in server Suspense loaders, Clerk remains server/proxy
only, the static CSP is intentionally nonce-free, and passkey reverification is
not part of the current architecture. These are current contracts, not setup
steps for a fork to redesign.

Create `scripts/forking-docs.test.mjs` with named subtests for
`canonical guide contract`, `repository pointers and license`, and
`localized article contract`.
Implement the first subtest now: it asserts the ten-section order, both profile
names, exact mandatory replacement paths, exact environment-name sets, the
profile-qualified admin availability rule, public-only owner-entry omissions,
the full-stack IA/PPR/static-CSP/no-passkey contract, and the
no-production-data/no-initializer rules.

**Verify**:

```bash
node --test --test-name-pattern='canonical guide contract' \
  scripts/forking-docs.test.mjs
```

The canonical-guide subtest passes; later named subtests may be reported as
skipped until their scoped files are updated.

### Step 3: Align repository and operations documentation

README says this is the live working example, supports two profiles via the
guide, and is not a zero-config theme. Correct AMA capability copy and link the
canonical guide. `docs/handoff.md` records cali.so's committed true profile and
points fork setup to that guide. Keep its current owner-entry, Overview/AMA/
Media/Photos IA, PPR/Suspense/`requireOwnerPage`, server-only Clerk, static
nonce-free CSP, and passkey-removal details intact. Qualify its owner admin as
always reachable in every deployed environment only while the committed profile
is true; do not recast that rule as an environment switch. `.env.example`
groups the exact true-profile names from Checker interface, documents
`AI_GATEWAY_API_KEY` as local/CI-only,
says false requires none of them, and preserves all provider-pair/fail-closed
rules. LICENSE only appends a guide pointer after the existing text; preserve
its upstream notice, grant, warranty, and content exception byte-for-byte.

Correct only the stale Staging smoke paragraph in
`docs/v3-cutover-ops-runbook.md`: verify `/admin/media` and `/admin/photos` as
separate current surfaces, and remove the obsolete redirect expectation.
Preserve every unrelated deployment, environment, migration, branch, and dated
hosted-evidence instruction verbatim.

Implement the `repository pointers and license` subtest to assert those README,
handoff, environment, unchanged-license, and preserved admin-architecture
contracts, plus the runbook's separate `/admin/media` and `/admin/photos`
Staging checks. The test must fail if the handoff reintroduces client Clerk,
nonce CSP, or passkey reverification, states unqualified admin availability, or
the runbook restores the obsolete `/admin/photos` redirect.

**Verify**:

```bash
node --test --test-name-pattern='repository pointers and license' \
  scripts/forking-docs.test.mjs
```

The repository-pointer/license subtest passes with no network or provider
access; unrelated named subtests may be skipped.

### Step 4: Rewrite both articles and delete their screenshots

Write concise localized v3 overviews: working example, two profiles, mandatory
personal-content/license replacement, canonical GitHub link to
`docs/forking.md`. Do not duplicate commands/env/provider matrices.

Preserve frontmatter exactly:

- `index.mdx`: `publishedAt`, `cover`, `coverWidth`, `coverHeight` and their
  values;
- `index.en.mdx`: only translated `title` and `description`; it intentionally
  inherits date/cover from Chinese.

After both sources contain no image-1..15 reference, delete only those 15
files. Keep `cover.png`.

Implement the `localized article contract` subtest for concise guide links,
localized titles/descriptions, exact preserved Chinese publication/cover
frontmatter, English inheritance, absent screenshot references/files, and the
retained cover.

**Verify**:

```bash
node --test scripts/forking-docs.test.mjs
pnpm test:localization
! rg -n -i 'image-(?:[1-9]|1[0-5])\.png|sanity|guestbook|/studio|npm create sanity' \
  content/blog/guide-for-cloning-my-site/index.mdx \
  content/blog/guide-for-cloning-my-site/index.en.mdx
! rg --files content/blog/guide-for-cloning-my-site \
  | rg '/image-(?:[1-9]|1[0-5])\.png$'
test -f content/blog/guide-for-cloning-my-site/cover.png
```

All tests/assertions exit 0; negative scans print nothing. The docs test proves
section order, guide links, exact legal notice preservation, and frontmatter.

### Step 5: Prune link-preview data deterministically

Refactor the refresh script so cache keys equal URLs discovered in every current
localized MDX source rendered through the shared external-link treatment:
`content/blog/*/index.mdx`, `content/blog/*/index.en.mdx`,
`content/newsletters/*/index.mdx`, and
`content/newsletters/*/index.en.mdx`. For each active URL, keep old metadata if
refresh fails. Drop stale URLs even during network failure. If a new active URL
has no old metadata and refresh fails, abort before writing. Sort keys
lexicographically, never fabricate a `{ domain }` fallback, and write exactly
once only after a complete scan.

Tests cover all six cases across both content roots: active-key equality, stale
failure deletion, active failure retention, missing-active failure abort/no
write, lexical order, and one final write/no fabricated fallback. Include one
newsletter-only URL so a future blog-only regression fails.

**Verify**:

```bash
node --test scripts/refresh-link-previews.test.mjs
node scripts/refresh-link-previews.mjs
node --test scripts/refresh-link-previews.test.mjs
```

Tests pass before/after and refresh exits 0. STOP if a new active URL lacks both
old metadata and a successful refresh.

### Step 6: Guard Cali-specific automation

Add both conditions to every mutating job in the five scoped workflows:

```yaml
github.repository == 'CaliCastle/cali.so'
github.event.repository.fork == false
```

Match the existing preview style. Do not guard `security.yml`; do not modify
already-guarded `deploy-preview.yml`; do not invent a generic deployment
framework.

**Verify**: `pnpm test:deployment` -> all tests pass and assert every scoped
mutating job has both conditions while `security.yml` remains unguarded.

### Step 7: Run all fork/repository gates

**Verify**:

```bash
node --test scripts/template-check.test.mjs \
  scripts/forking-docs.test.mjs scripts/refresh-link-previews.test.mjs
pnpm template:check
pnpm test:deployment
pnpm test:localization
pnpm test:unit
pnpm typecheck
pnpm build
pnpm verify:legacy-urls
pnpm verify:links
pnpm verify:public-discovery
pnpm verify:security-boundary
git diff --check
git status --short
```

All commands through the patch check exit 0; the unit suite reports its new
post-plan count. Status lists only exact Scope paths. The checker/docs tests are
the completion gate for README links/anchors, both article routes/cover, and
both profile tables; an optional rendered review may be recorded outside the
repository but requires no credentials and is not a substitute for those tests.

## Test plan

- Checker tests prove pure read-only/secret-safe behavior for both profiles.
- Docs tests prove guide ordering, legal notice, links, frontmatter, and binary
  deletion boundaries, plus profile-qualified admin availability and the
  current IA/PPR/static-CSP/no-passkey contract. They also prove the operations
  runbook smokes `/admin/media` and `/admin/photos` as separate current surfaces.
- Refresh tests prove exact active-key and atomic failure semantics.
- Deployment tests prove guards without suppressing fork CI.
- Localization/unit/type/build/public verifiers protect the live site.

## Done criteria

- [ ] `docs/forking.md` is the one detailed source of truth.
- [ ] README/articles are short, accurate pointers for both profiles.
- [ ] Guide and handoff preserve the current admin IA, owner entry, PPR/server
      auth boundary, static nonce-free CSP, and passkey-removal decision.
- [ ] Admin is described as always reachable only for committed
      `operatorStack: true`; public-only docs state that owner
      probe/hint/Admin/G-D behavior is disabled.
- [ ] The Staging operations runbook tests `/admin/media` and `/admin/photos`
      separately, contains no obsolete redirect between them, and preserves
      unrelated deployment instructions.
- [ ] Fifteen screenshots are absent and `cover.png`/frontmatter remain exact.
- [ ] Cache keys equal active localized blog and newsletter URLs with tested
      failure rules.
- [ ] `template:check` is read-only, non-networked, secret-safe, and exits 0 on
      valid source warnings.
- [ ] `template:check` rejects invalid/delimited namespaces and any repository
      full-name/URL mismatch without printing configured values.
- [ ] Mandatory personal/license replacement is operational and preserves the
      upstream MIT notice.
- [ ] Exact Cali automation is guarded; `security.yml` remains fork-runnable.
- [ ] No legacy contract/archive/migration/snapshot or other personal asset was
      deleted.
- [ ] All mechanical gates and `git diff --check` pass.
- [ ] Only exact Scope paths and the status row are modified.

## STOP conditions

- Live excerpts/frontmatter/dependency-plan output differs materially.
- A Verify command fails twice after a reasonable correction.
- An out-of-scope file is required.
- A workflow guard would suppress fork CI or change current cali.so behavior.
- Guide instructions conflict with current operations/security docs.
- Documentation flattens the admin PPR model, adds client Clerk or nonce CSP,
  restores passkey reverification, or leaves admin availability unqualified.
- A missing active preview would require fabricated metadata.
- Article pairing/frontmatter changes or any personal asset beyond the 15
  screenshots would be deleted.
- Checker reads/prints env values or performs network/write/delete/prompt/open.
- A temporary/config/cache operation cannot be restored byte-for-byte.
- Production/cloud/database/provider access is required.

## Maintenance notes

Update `docs/forking.md` first for future setup changes. README/public article
remain pointers. Keep `template:check` read-only so it is always safe to rerun.
