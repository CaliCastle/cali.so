# Plan 005: Put fork identity behind one Site Profile interface

> **Executor instructions**: This plan creates the single committed identity
> seam confirmed by the maintainer. It does not make authored biography,
> projects, posts, or provider secrets into configuration. Follow every step,
> preserve all current output values for cali.so, and update only this plan's
> status row in `advisor-plans/README.md` when complete.
>
> **Drift check (run first)**:
> `git diff --stat 59a39bc..HEAD -- site.config.ts lib/site/site-config.test.ts CONTEXT-MAP.md lib/site/CONTEXT.md docs/adr/0011-committed-site-profile.md app/_components/site-document.tsx app/global-error.tsx app/global-not-found.tsx app/global-metadata.test.tsx app/newsletter-retired-metadata.test.ts app/non-public-metadata.test.ts app/seo-routes.test.ts app/site-document.test.tsx app/_views/home-page.tsx app/_views/home-page.test.tsx app/_views/newsletter-retired-page.tsx app/feed.xml/route.ts app/feed.en.xml/route.ts components/dock.tsx components/dock.test.tsx components/footer-clock.tsx components/footer-clock.test.tsx components/home-introduction.tsx components/home-introduction.test.tsx components/site-footer.tsx components/site-footer.test.tsx components/social-cards.tsx components/social-cards.test.tsx content/github.json content/social.json lib/content.test.ts lib/date.ts lib/date.test.ts lib/locale-client.ts lib/locale-metadata.ts lib/locale-metadata.test.ts lib/non-public-metadata.ts lib/og-image.tsx lib/og-route-metadata.test.ts lib/public-page-metadata.ts lib/public-page-metadata.test.ts lib/seo.ts lib/social-live.ts lib/social-live.test.ts next.config.ts scripts/refresh-github.mjs scripts/refresh-social.mjs scripts/refresh-link-previews.mjs scripts/verify-production-security-boundary.mjs scripts/verify-public-discovery.mjs scripts/verify-public-links.mjs advisor-plans/README.md`
> Compare every changed in-scope file with the excerpts and exact output
> inventory below. Status-only index changes and completed deletion-plan
> changes are expected; any other meaningful mismatch is a STOP condition.

## Status

- **Priority**: P1
- **Effort**: L
- **Risk**: MED
- **Depends on**: none; the canonical suite is stable at this baseline
- **Category**: tech-debt
- **Planned at**: commit `59a39bc`, 2026-07-18

## Why this matters

Fork identity currently has no seam. Names, canonical URLs, public contact,
time zone, profile handles, repository identity, and image paths are repeated
across metadata, chrome, social adapters, OG output, refresh scripts, and
verification scripts. A fork must discover and change all of them correctly.

A committed Site Profile module gives those callers leverage through one small
interface and gives maintainers locality: a shared identity change happens
once. Authored prose and personal collections remain content because putting
arbitrary JSX or biography into the interface would make the module shallow.

## Current state

Representative duplication at `59a39bc`:

```tsx
// app/_components/site-document.tsx:24-30
export const rootMetadata: Metadata = {
  metadataBase: seo.url,
  title: {
    default: 'Cali Castle',
    template: '%s | Cali Castle',
  },
}
```

```ts
// lib/seo.ts:3-10
export const seo = {
  title: publicPageMetadata.home.zh.title,
  description: publicPageMetadata.home.zh.description,
  url: new URL(
    process.env.SITE_URL ??
      (process.env.NODE_ENV === 'production' ? 'https://cali.so' : 'http://localhost:3199'),
  ),
} as const
```

```ts
// lib/social-live.ts:24-40
fetch('https://github-contributions-api.jogruber.de/v4/CaliCastle?y=last')
fetch('https://api.github.com/users/CaliCastle', {
  headers: { accept: 'application/vnd.github+json', 'user-agent': 'cali.so' },
})
// ...
user: 'CaliCastle'
```

`components/site-footer.tsx:72,107`,
`components/home-introduction.tsx:156-175`, `components/footer-clock.tsx:5-18`,
`lib/locale-metadata.ts:57-78`, and `lib/og-image.tsx:22` repeat more identity.
`content/social.json` and `content/github.json` duplicate handles/names that are
then consumed as though they were configuration.

The paired Chinese/English route family is a settled v3 contract. Locale
configurability is explicitly out of scope.

Architecture vocabulary for this plan is fixed: the **Site Profile module** is
the implementation; its exported `SiteConfig` value/type is the **interface**;
the import point is the **seam**. The module is **deep** when that small
interface hides repeated identity decisions. That depth gives callers
**leverage** and concentrates identity change with **locality**. Do not use
these terms as decorative prose or create extra adapters; direct imports are
the one real seam.

## Target interface

Create client-safe `site.config.ts` at the repository root. It must contain no
React, `process.env`, Zod, server-only import, provider client, or secret. Export
one runtime value plus its erased TypeScript interface with this shape:

```ts
type HttpsUrl = `https://${string}`
type PublicPath = `/${string}`
type Profile<T> = T | null

export interface SiteConfig {
  /** Stable delimiter-free token. Change only before creating operator data. */
  id: string
  /** Stable delimiter-free prefix for browser/storage/rate-limit keys. */
  keyNamespace: string
  canonicalUrl: HttpsUrl
  owner: {
    displayName: string
    givenName: string
    publicEmail: `${string}@${string}`
    timeZone: string
    location: { zh: string; en: string }
  }
  repository: {
    fullName: `${string}/${string}`
    url: HttpsUrl
  }
  assets: {
    avatar: PublicPath
    headshot: PublicPath
    portrait: { light: PublicPath; dark: PublicPath }
  }
  profiles: {
    github: Profile<{ handle: string }>
    x: Profile<{ handle: string }>
    telegram: Profile<{ handle: string }>
    youtube: Profile<{ handle: string }>
    xiaohongshu: Profile<{
      handle: string
      href: HttpsUrl
      profileId: string
    }>
  }
}

export const siteConfig = {
  id: 'cali.so',
  keyNamespace: 'cali',
  canonicalUrl: 'https://cali.so',
  owner: {
    displayName: 'Cali Castle',
    givenName: 'Cali',
    publicEmail: 'hi@cali.so',
    timeZone: 'Asia/Taipei',
    location: { zh: '台北', en: 'Taipei' },
  },
  repository: {
    fullName: 'CaliCastle/cali.so',
    url: 'https://github.com/CaliCastle/cali.so',
  },
  assets: {
    avatar: '/images/avatar.png',
    headshot: '/images/headshot.jpg',
    portrait: {
      light: '/images/headshot.jpg',
      dark: '/images/portrait-square.jpg',
    },
  },
  profiles: {
    github: { handle: 'CaliCastle' },
    x: { handle: 'calicastle' },
    telegram: { handle: 'cali_so' },
    youtube: { handle: 'calicastle' },
    xiaohongshu: {
      handle: 'calicastle',
      href: 'https://xhslink.com/m/7vluP5ANiNE',
      profileId: '5cbba503000000001101b6a2',
    },
  },
} as const satisfies SiteConfig
```

The interface is the test surface. Keep it limited to shared scalar identity,
public destinations, and public asset locations.

`canonicalUrl` is the site's default public identity. `SITE_URL` remains an
environment-specific deployed-origin override for Preview/security behavior;
outside Local development it should normally match the committed canonical
origin. `ADMIN_EMAIL` remains a durable operator data namespace and is not the
same as `owner.publicEmail`.

`id` and `keyNamespace` are deliberately separate. `id` preserves existing
durable/provider domain separators beginning `cali.so:`. `keyNamespace`
preserves browser events, local-storage keys, and rate-limit scopes beginning
`cali:`. A fork chooses both before creating operator data or shipping clients.
Both values must match
`^[a-z0-9](?:[a-z0-9._-]*[a-z0-9])?$`: non-empty, already trimmed,
lowercase ASCII tokens with no colon or trailing delimiter. Callers add their
own single `:` separator; the configured token never contains one.

`repository.fullName` must contain exactly one non-empty `owner/repository`
pair, and `repository.url` must be exactly
`https://github.com/${repository.fullName}` with no trailing slash, query, or
hash. These fields cannot vary independently; a fork must change both together.

## Commands you will need

| Purpose | Command | Expected on success |
| --- | --- | --- |
| Config tests | `pnpm exec vitest run lib/site/site-config.test.ts` | all tests pass and the file is owned by `test:unit` |
| Public identity tests | focused commands in Steps 3 and 4 | all exact-output and null-profile cases pass |
| Script tests | `pnpm test:localization && pnpm verify:public-discovery` | both pass |
| Canonical tests | `pnpm test:unit` | all pass |
| Typecheck | `pnpm typecheck` | exit 0 |
| Build | `pnpm build` | exit 0 |
| Patch check | `git diff --check` | no output, exit 0 |

## Scope

**Create**:

- `site.config.ts`
- `lib/site/site-config.test.ts`
- `app/_views/home-page.test.tsx`
- `app/global-metadata.test.tsx`
- `components/footer-clock.test.tsx`
- `components/home-introduction.test.tsx`
- `components/site-footer.test.tsx`
- `lib/social-live.test.ts`
- `lib/site/CONTEXT.md`
- `docs/adr/0011-committed-site-profile.md`

**Modify public identity consumers**:

- `CONTEXT-MAP.md`
- `app/_components/site-document.tsx`
- `app/global-error.tsx`
- `app/global-not-found.tsx`
- `app/_views/home-page.tsx`
- `app/_views/newsletter-retired-page.tsx`
- `app/feed.xml/route.ts`
- `app/feed.en.xml/route.ts`
- `components/dock.tsx`
- `components/footer-clock.tsx`
- `components/home-introduction.tsx`
- `components/site-footer.tsx`
- `components/social-cards.tsx`
- `content/github.json`
- `content/social.json`
- `lib/date.ts`
- `lib/locale-client.ts`
- `lib/locale-metadata.ts`
- `lib/non-public-metadata.ts`
- `lib/og-image.tsx`
- `lib/public-page-metadata.ts`
- `lib/seo.ts`
- `lib/social-live.ts`
- `next.config.ts`
- `scripts/refresh-github.mjs`
- `scripts/refresh-social.mjs`
- `scripts/refresh-link-previews.mjs`
- `scripts/verify-production-security-boundary.mjs`
- `scripts/verify-public-discovery.mjs`
- `scripts/verify-public-links.mjs`
- `app/non-public-metadata.test.ts`
- `app/newsletter-retired-metadata.test.ts`
- `app/seo-routes.test.ts`
- `app/site-document.test.tsx`
- `components/dock.test.tsx`
- `components/social-cards.test.tsx`
- `lib/content.test.ts`
- `lib/date.test.ts`
- `lib/locale-metadata.test.ts`
- `lib/og-route-metadata.test.ts`
- `lib/public-page-metadata.test.ts`
- `advisor-plans/README.md` status row only

**Out of scope**:

- `operatorStack` behavior and operator route gating; plan 006 owns it.
- Owner discovery and admin navigation outside `components/dock.tsx`, including
  `components/preferences.tsx`, `components/admin-dock.tsx`,
  `hooks/use-dock-go-shortcuts.ts`, and `app/api/admin/session/route.ts`; these
  remain unchanged until plan 006.
- Biography JSX in `components/home-introduction.tsx`, project/experience/book/
  record arrays, posts, newsletters, photos, and other authored content. They
  stay as the working example and plan 007 lists them for mandatory replacement.
- Arbitrary locale support or removal of the paired zh/en route contract.
- Secrets, credentials, `ADMIN_EMAIL`, provider endpoints, rate limits, or
  environment validation.
- Changing visible copy, URLs, profile handles, images, metadata, or generated
  output for cali.so.
- Package, dependency, or lockfile changes.

## Git workflow

- Branch: `cali/005-deepen-site-profile`
- Use logical commits only if needed; final subject:
  `refactor: centralize site identity`
- Stage exact paths. Do not push or open a pull request unless instructed.

## Steps

### Step 1: Record the domain and decision

Create `lib/site/CONTEXT.md` with two terms:

- **Site Profile**: committed non-secret identity and public destinations that
  define one fork of the personal site.
- **Authored Content**: personal prose, collections, and media that remain
  repository content rather than fields in the Site Profile.

Add Site Profile to `CONTEXT-MAP.md`. Add ADR 0011 recording the committed
typed seam, the distinction between `canonicalUrl` and deployed `SITE_URL`, the
stable `id` invariant, the no-secret rule, and the decision not to make locale
or biography arbitrary configuration.

**Verify**:

```bash
test -f lib/site/CONTEXT.md
test -f docs/adr/0011-committed-site-profile.md
for term in 'Site Profile' 'Authored Content' module interface seam depth leverage locality
do
  rg -qF "$term" lib/site/CONTEXT.md docs/adr/0011-committed-site-profile.md \
    || exit 1
done
rg -qF '[Site Profile](./lib/site/CONTEXT.md)' CONTEXT-MAP.md
```

All commands exit 0 with no output. The terms mean exactly what Current state
defines; no extra module, adapter, or locale interface is introduced.

### Step 2: Add and validate the Site Profile

Create `site.config.ts` with the exact interface above and the current cali.so
values. Add `lib/site/site-config.test.ts` covering:

- HTTPS canonical origin with pathname `/`, no query, and no hash;
- valid public `/...` asset paths whose files exist under `public/`;
- syntactically valid public email and non-empty handles;
- valid IANA time zone by constructing `Intl.DateTimeFormat`;
- alternate values satisfying the exported `SiteConfig` type with each of the
  five optional profiles set to null;
- both namespace fields match the exact lowercase delimiter-free token rule;
  negative fixtures cover empty, whitespace, uppercase, leading/trailing
  punctuation, and any colon, including a colon-suffixed `keyNamespace`;
- repository `fullName` has one non-empty owner/repository pair and its URL is
  exactly `https://github.com/${fullName}` with no trailing slash, query, or
  hash; negative fixtures cover missing or multiple segments, stale Cali URLs
  after a name change, non-GitHub origins, and URL suffixes;
- `id === 'cali.so'` and `keyNamespace === 'cali'` only when
  `repository.fullName === 'CaliCastle/cali.so'`; forks change both namespace
  fields, `fullName`, and its matching URL together;
- no field names containing `secret`, `token`, `password`, or `credential`, or
  conventional secret names such as `apiKey`, `privateKey`, `secretKey`, or
  `encryptionKey`; `keyNamespace` is an explicit non-secret identifier and must
  remain allowed.

Do not add a runtime validation dependency. TypeScript plus focused tests own
the interface.

**Verify**:

```bash
pnpm exec vitest run lib/site/site-config.test.ts
node --input-type=module <<'NODE'
import assert from 'node:assert/strict'

const { siteConfig } = await import('./site.config.ts')
const namespaceToken = /^[a-z0-9](?:[a-z0-9._-]*[a-z0-9])?$/
assert.match(siteConfig.id, namespaceToken)
assert.match(siteConfig.keyNamespace, namespaceToken)
assert.equal(
  siteConfig.repository.url,
  `https://github.com/${siteConfig.repository.fullName}`,
)
if (siteConfig.repository.fullName === 'CaliCastle/cali.so') {
  assert.equal(siteConfig.id, 'cali.so')
  assert.equal(siteConfig.keyNamespace, 'cali')
}
NODE
```

The config tests pass and Node 24 imports the TypeScript config without a
loader. The namespace, repository-pairing, and source-repository compatibility
assertions exit 0.

### Step 3: Migrate public metadata and chrome

Replace duplicated shared identity with imports from `siteConfig` in the public
files listed in Scope:

- document title, metadata site name, canonical origin, OG signatures, global
  error/not-found titles, newsletter archive title;
- home display name and portrait/thumbnail paths;
- footer public email, copyright owner, clock time zone/location label;
- social profile links, handles, avatar paths, and repository destination;
- public page descriptions only where the shared given/display name is
  interpolated. Preserve the authored sentence around it.

In `lib/seo.ts`, trim `process.env.SITE_URL` once and treat an empty or
whitespace-only value as absent. Preserve every non-empty Local/Preview
`SITE_URL`, keep Local's `http://localhost:3199` fallback, and replace only the
production hardcoded default with `siteConfig.canonicalUrl`. The blank-value
fallback is required so Plan 006 can override a populated local env file with
`SITE_URL=` and prove a public-only production build needs no deployed origin
variable.

Do not turn `siteConfig` into React context. Direct imports are the intended
small interface for server, client, and build-time callers.

Preserve the current public/admin document split in
`app/_components/site-document.tsx`: the owner-admin branch remains a static,
provider-free shell outside public analytics, social reads, public Dock, and
route transitions. In `components/dock.tsx`, migrate shared avatar identity
without changing the cached owner hint, Preferences-triggered
`/api/admin/session` probe, Admin-row visibility, or G-D ownership added before
this plan. Plan 006 owns profile-aware gating for those operator affordances.

**Verify**:

```bash
pnpm exec vitest run lib/site/site-config.test.ts \
  app/site-document.test.tsx app/global-metadata.test.tsx \
  app/newsletter-retired-metadata.test.ts app/non-public-metadata.test.ts \
  app/seo-routes.test.ts app/_views/home-page.test.tsx \
  components/dock.test.tsx components/footer-clock.test.tsx \
  lib/content.test.ts lib/date.test.ts lib/locale-metadata.test.ts \
  lib/og-route-metadata.test.ts lib/public-page-metadata.test.ts
```

All files pass and retain exact cali.so output expectations. Metadata coverage
proves a non-empty `SITE_URL` still wins, while blank/whitespace production
values use `siteConfig.canonicalUrl` and blank Local values use the existing
localhost fallback.

### Step 4: Separate social identity from snapshot metrics

Change committed snapshots so configuration is not duplicated:

- `content/github.json` keeps contribution/follower metrics and dates, but not
  the GitHub handle.
- `content/social.json` keeps replaceable bios, counts, and `asOf` values, but
  not shared display names or handles.
- `lib/social-live.ts` composes `siteConfig.profiles` with the committed/live
  metrics before returning the existing render-facing shapes.
- A null profile is omitted cleanly from chrome rather than producing a broken
  link. Adjust `SiteFooter`/`HomeIntroduction` props or composition as needed,
  but do not add placeholder accounts.
- Refresh scripts derive endpoints/handles from `siteConfig` and update metrics
  only.

Node 24 is the repository runtime and can import the erasable TypeScript config
from `.mjs`; do not add `tsx`, `ts-node`, or another config representation.

Add `lib/social-live.test.ts` to prove snapshot metrics are composed with the
configured GitHub/X/YouTube identities, null profiles are omitted, and refresh
failure keeps current snapshot metrics without reintroducing configured
handles into JSON.

**Verify**:

```bash
pnpm exec vitest run lib/social-live.test.ts components/social-cards.test.tsx \
  components/home-introduction.test.tsx components/site-footer.test.tsx
```

All tests pass with exact current links/labels. Null GitHub, X, Telegram,
YouTube, and Xiaohongshu profiles cause no fetch and no broken public link.

### Step 5: Migrate public verification adapters

Update public discovery/link scripts and their tests to derive expected origin,
document title suffix, user agent identity, and profile endpoints from
`siteConfig`. Preserve explicit request URL fixtures when they are testing URL
behavior rather than configuration.

`next.config.ts` may import `siteConfig` for current public identity, but the
legacy URL manifest itself remains untouched.

**Verify**:

```bash
node --check scripts/refresh-github.mjs
node --check scripts/refresh-social.mjs
node --check scripts/refresh-link-previews.mjs
node --check scripts/verify-public-discovery.mjs
node --check scripts/verify-public-links.mjs
node --check scripts/verify-production-security-boundary.mjs
pnpm test:localization
pnpm verify:links
pnpm verify:public-discovery
```

All commands exit 0; syntax checks print no output.

### Step 6: Audit remaining identity literals

Add a named test, `classifies every upstream identity literal`, to
`lib/site/site-config.test.ts`. It scans production `.js`, `.jsx`, `.mjs`,
`.cjs`, `.ts`, `.tsx`, `.mts`, and `.cts` source under `app`, `components`,
`lib`, and `scripts`, plus `proxy.ts` and `next.config.ts`; excludes tests/specs,
nested documentation/context files, and `site.config.ts`; and classifies this
exact marker set:

- shared identity to migrate now: `Cali Castle`, `CaliCastle`, `calicastle`,
  `cali_so`, `hi@cali.so`, `cali.so`, `https://cali.so`, `Asia/Taipei`, the
  Xiaohongshu profile ID/URL, configured avatar/headshot/portrait paths,
  repository identity, and `cali:locale-change`;
- authored identity, prose, and historical/project destinations deferred only
  in
  `components/home-introduction.tsx`, `components/social-cards.tsx`,
  `app/_views/ama-page.tsx`, `app/_views/ama-book-page.tsx`,
  `lib/public-page-metadata.ts`, `lib/personal.ts`, and `lib/projects.ts` for
  plan 007 replacement; this category may contain the generic `Cali` name and
  identity markers embedded in authored destinations, but not shared runtime
  chrome/configuration;
- operator identity deferred only in the complete production file inventory
  in plan 006, including `app/admin/(protected)/AdminOverview.tsx`,
  `app/admin/(protected)/ama/AmaSettings.tsx`, and
  `lib/media/storage/contract.ts`;
- explicit protocol URL fixtures in tests only. Production source may not use
  this category.

Repository/deployment identity in README, package metadata, `.github/**`,
funding, and `vercel.json` is owned by plan 007 and is outside this runtime
scan. No fifth category exists.

**Verify**:

```bash
pnpm exec vitest run lib/site/site-config.test.ts \
  -t "classifies every upstream identity literal"
```

Exactly one audit test passes with zero unclassified runtime matches. If an
operator path differs from plan 006's inventory, update that plan before
finishing this one.

### Step 7: Run the full gates

Run typecheck, deterministic unit suite, localization, public verification, and
build. Compare homepage, footer, social cards, metadata, OG images, feeds, and
global errors against the pre-change output. All current cali.so values must be
identical.

**Verify**:

```bash
pnpm test:unit
pnpm test:localization
pnpm typecheck
pnpm build
pnpm verify:legacy-urls
pnpm verify:links
pnpm verify:public-discovery
pnpm verify:security-boundary
git diff --check
git status --short
```

The first nine commands exit 0; every discovered test passes without retries or
raised timeouts. Its file/case count reflects any completed deletion plans plus
the seven new canonical test files and new cases in this plan, rather than the
pre-plan 107-file/1,007-test baseline. Exact-output tests cover the named
surfaces. Status contains only the fully enumerated Create/Modify paths and the
permitted index row; any other path is a STOP condition.

## Test plan

- Add focused structural tests for the Site Profile interface.
- Update current metadata, social, feed, OG, and verification expectations to
  derive from config while still asserting exact rendered cali.so output.
- Add null-profile cases for all five optional profiles, proving each omission
  produces no fetch or broken public link.
- Do not replace useful exact-output assertions with snapshots or vague
  `toBeTruthy` checks.

## Done criteria

- [ ] `site.config.ts` is the only committed interface for shared non-secret
      identity.
- [ ] Namespace tokens are non-empty, lowercase, delimiter-free, and compose
      with exactly one caller-owned colon; repository full name and URL match.
- [ ] The module imports no React, environment, provider, or secret code.
- [ ] Public metadata/chrome/social/scripts use it and render unchanged output.
- [ ] Social snapshot files no longer duplicate configured names/handles.
- [ ] Every remaining hardcoded identity match is explicitly classified.
- [ ] No authored content, locale contract, dependency, or secret handling was
      broadened into config.
- [ ] Focused tests, localization, links, discovery, unit tests, typecheck, and
      build all pass.
- [ ] `git diff --check` exits 0 and `git status --short` contains only the
      exact Create/Modify inventory plus the status row.
- [ ] Only in-scope paths and the plan status row are modified.

## STOP conditions

- An in-scope consumer has drifted enough that exact current output cannot be
  preserved from the plan.
- Identity migration would alter the static owner-admin document shell, public
  owner-discovery probe, Admin-row visibility, or public/admin shortcut split.
- A proposed field would contain a secret, provider credential, or
  environment-specific capability.
- A config change requires serializing functions, JSX, React elements, or a
  second config representation.
- Node 24 cannot import the erasable TypeScript config from the `.mjs` scripts;
  stop and report instead of adding a new runtime dependency.
- Centralization appears to require locale rearchitecture, a CMS, or moving
  authored content into a large shallow interface.

## Maintenance notes

Reviewers should reject new shared identity literals outside the Site Profile
unless they are authored content, a protocol fixture, or a documented stable
namespace. `siteConfig.id` becomes load-bearing for operator data in plan 006;
`siteConfig.keyNamespace` becomes load-bearing for current `cali:` keys. Forks
must choose both before creating data or shipping clients.
