# v3 cutover record

Finalized: 2026-07-20.

## Final outcome

The v3.0 source cutover reached `main` through
[PR #195](https://github.com/CaliCastle/cali.so/pull/195) at merge commit
`4f071ab` on July 20, 2026. The final `dev` commit passed Staging, Quality, and
CodeQL before merge. GitHub's automatic head-branch cleanup removed `dev`; the
branch was restored at the same commit. Active `dev` and `main` rulesets now
block deletion, force pushes, and direct bypass while requiring pull requests,
Quality, and CodeQL.

The first Deploy Production run
[#29696010332](https://github.com/CaliCastle/cali.so/actions/runs/29696010332)
passed its no-secret review but received an empty `MIGRATION_DATABASE_URL`, so
Drizzle stopped before connecting and Vercel deployment was skipped.
[PR #206](https://github.com/CaliCastle/cali.so/pull/206) then added dedicated
Production migration and CRUD-only runtime roles, made each `main` push migrate
and deploy automatically, and kept each credential isolated to its GitHub or
Vercel consumer.

PR #206 merged as `d891463`. Attempt 3 of
[Deploy Production run #29707454879](https://github.com/CaliCastle/cali.so/actions/runs/29707454879)
passed the expand-only check, applied migrations `0001` through `0012`, and
deployed that exact commit to
`https://cali-nnstyrz6o-cali.vercel.app`. The exact deployment and
`https://cali.so` return 200. The post-deploy security-boundary verifier and all
13 hosted browser cases pass against Production; the signed-out Media API now
returns 401 instead of the pre-fix 500. Automated Production deployment and
public smoke proof are complete.

## Pre-cutover verdict (historical)

At the last pre-merge audit, the verdict was **NOT READY**. `dev` was green
under the complete local release suite, and the audited Staging deployment at
`https://beta.cali.so` passed its migration, public-site, security-boundary,
link, URL-contract, and browser checks. Production provisioning, signed-in
owner verification, dashboard checks, Analytics ingestion, and rollback proof
remained open at that snapshot. Unknown hosted state was not counted as passed.

## Audit baseline

| Item | Value |
| --- | --- |
| Production branch | `main` at `8c258834af538dd501486a5fd319b3e96a2ff5bc` |
| Integration branch | `dev` at `880260769d1d74815e63acf8928fd95565ff75b6` |
| Staging deployment | `https://beta.cali.so`, deployed from the audited `dev` SHA by successful run [#29644176180](https://github.com/CaliCastle/cali.so/actions/runs/29644176180) |
| Vercel project | `cali-so` (`prj_oIl5…`) on team `team_r1Mln…`; full IDs live in the local `.vercel/project.json` link state |
| Production deployment | `dpl_A29CV…`, created 2026-07-11, status Ready at inventory time |
| Release issue | [#98](https://github.com/CaliCastle/cali.so/issues/98) |
| Readiness issue | [#107](https://github.com/CaliCastle/cali.so/issues/107) |
| Framework pin | `next@16.3.0` |
| Install boundary | `pnpm install --frozen-lockfile` |
| Production site observed | `https://cali.so`, HTTP 200 from Vercel, still serving `main` |

Prerequisite issues #99 through #106 are closed and their changes are merged
into `dev`. The complete issue #96 Media Library stack is also merged: the
owner admin manages the catalog and curation workflow, and the public homepage
and `/photos` now consume the active Published Photo Selection from Bunny
Renditions. The retired static photo fallback has been removed.

## Pre-cutover gate summary (historical)

The table below preserves the July 19 evidence and must not be read as current
Production deployment status.

| Gate | Status | Evidence or blocker |
| --- | --- | --- |
| Frozen install | PASS | `pnpm install --frozen-lockfile` completed from the audited commit. |
| Repository validation | PASS (LOCAL AND FEATURE PREVIEW) / AWAITING QUALITY AND STAGING | The new `pnpm test:browser` production-build gate passes 19 Chromium behavior cases plus six WebKit smoke executions locally. Feature Preview run [29671775136](https://github.com/CaliCastle/cali.so/actions/runs/29671775136) passed all 13 read-only `@hosted` cases against `https://cali-lonkhb5df-cali.vercel.app` for `2336124`. `Quality` and the Staging deployment remain pending. |
| Public browser behavior | PASS | Local and Staging review covered desktop and mobile, both locales, light and dark appearance, reduced motion, keyboard navigation, metadata, overflow, feeds, generated social images, and Instant Navigation. |
| Owner admin boundary | PASS (Staging signed-out path) / AWAITING OWNER AND PRODUCTION PROOF | A clean browser navigation to Staging `/admin` completes Clerk's development-instance handshake and reaches the isolated sign-in UI. The complete remote security-boundary verifier passes. Signed-in owner reads and mutations still require authorized operator access and the database gate below; confirm the Production Clerk keys and owner metadata at cutover. |
| Complete diff Standards review | PARTIAL / AWAITING RE-REVIEW | PR #189 landed the credential-driven AMA and owner-auth decisions plus keyboard-instant Preview-card, lightbox, and article-map behavior. The browser gate now verifies those motion paths. At this snapshot, issues #184 through #186 remained open because their PR had merged to `dev`, not the default branch; the layer-scale finding and judgement-level `app/globals.css` disposition still needed a recorded resolution before the refreshed review could pass. |
| Complete diff Spec review | PARTIAL / AWAITING RE-REVIEW | No scope creep was found, and the missing automated browser-test command plus automated feature Preview evidence are now implemented. Analytics dashboard proof remains absent, and Domain evidence was overstated. The Clerk redirect-shape verifier intentionally stops at the first 307, but the separate clean-browser matrix completed the development handshake and rendered Clerk sign-in. |
| Production-like Staging | PASS (public and signed-out boundaries) | `https://beta.cali.so` serves `dev@8802607`. The complete public route, link, discovery, legacy-URL, security-boundary, and manual browser matrix passed. Signed-in owner operations and provider-backed workflows remain separate gates. |
| Issue #107 feature Preview evidence | PASS (AUTOMATED MATRIX) / AWAITING MANUAL HOSTED EVIDENCE | The exact feature Preview for `2336124` passed the 13-case hosted matrix across both locales, appearance and viewport profiles, reduced motion, metadata, feeds, social images, Instant Navigation, public Analytics inclusion, and the signed-out admin boundary. Fresh Analytics dashboard proof and signed-in owner evidence remain separate manual gates. |
| Vercel Web Analytics | AWAITING DASHBOARD CONFIRMATION | Chinese and English Feature Preview and Staging routes load the first-party Insights client; the signed-out owner-admin boundary excludes it. Confirm fresh Chinese and English pageviews from the recorded Feature Preview in the existing `cali-so` Analytics dashboard. |
| GitHub security settings | PASS | Secret scanning, push protection, Dependabot security updates, read-only Actions defaults, and full-SHA action policy are enabled. |
| Required GitHub checks | PARTIAL | At this snapshot, the `dev` ruleset required `Quality` and `CodeQL` while `main` protection required neither. Both branches are protected now. |
| Deployment environments | PASS | At this snapshot, GitHub had Preview, Staging, `production-migration-review`, and Production environments, with the last two requiring maintainer review. The release decision was later amended to one automatic, `main`-only Production environment. |
| Current Vercel project settings | PASS | Project inspection succeeds with the explicit team scope. The earlier `Not authorized` was a CLI quirk: the team slug `cali` resolves to the personal account, so commands must pass the team ID as `--scope` (see the runbook). |
| Production capability posture | PASS (superseded July 2026) | The former `AMA_*_ENABLED` switches are removed by maintainer decision: AMA capabilities are enabled by default, and each provider capability follows its credential pair, failing closed with 503 while the pair is absent. Owner admin has no capability switch. |
| Staging and Production secret isolation | PARTIAL / AWAITING DATABASE CONFIRMATION | Staging uses its isolated Clerk instance and has no Redis fallback. The successful Staging workflow reported that all migrations were applied, but table state and the runtime role's CRUD-only grants were not inspected. If migration `0010` or its grants are missing, rate-limited admin mutations fail closed with 503 while public reads remain available. Two fresh confirmations are required before remote database inspection. |
| Production runtime environment | FAIL (last authorized audit) | The 2026-07-16 audit found that Production's `DATABASE_URL` predates the rewrite and the v3 server-environment contract was otherwise unmet, including required Clerk, cryptographic, rate-limit, Bunny, and media values. Production cloud configuration was not reopened during this refresh because the required confirmations were not given. |
| Production runtime database grants | AWAITING CONFIRMATION | Requires two fresh confirmations before inspecting the production role or sensitive cloud state. |
| Production migration credential | PASS (name level) | `MIGRATION_DATABASE_URL` is absent from every Vercel environment. Its availability to the controlled migration operation is confirmed at cutover time. |
| Production migrations | AWAITING CONFIRMATION | The immutable legacy baseline `0000` and eleven additive v3 migrations validate locally. Staging reported successful application through `0011`; Production execution and schema state require the separately authorized cutover step. |
| Media provider and publication | FAIL | Production has no Bunny or media configuration at all, so the provider boundary, live storage contract, and the two-photo Published Photo Selection cannot exist yet. Provisioning precedes verification. |
| Other external providers | PASS (name level) | No Google, Tencent, payment, or booking-finalization credentials exist in Production. Legacy-era variables (Clerk, Sanity, Edge Config, a three-year-old Upstash pair) remain for the current `main` site and need pruning or rotation at cutover. |
| Logs and drains | UNKNOWN | Not exposed through the CLI; verify access, retention, drains, and the privacy allowlist in the Vercel dashboard. |
| Domain cutover | PARTIAL / AWAITING DASHBOARD CONFIRMATION | `cali.so` was assigned to the correct team with third-party DNS pointing at Vercel and the production alias intact at the last authorized audit. The Production-branch mapping and certificate still need a dashboard check before merge. |
| Rollback | AWAITING CONFIRMATION | The last known-good production deployment is recorded in the audit baseline. An operator must still confirm promotion or merge-revert works without reversing additive migrations. |

## Automated evidence

The following passed from the frozen installation:

- TypeScript typecheck.
- 1,014 Vitest unit and integration tests across 108 application, component,
  database, and library test files, excluding only explicitly live suites.
- 611 AMA tests across 33 files and 7 migration checks.
- 20 deployment workflow and migration-policy checks.
- 5 security tests.
- 148 localization checks.
- 19 Media Library catalog tests.
- 17 Media Library ingestion and privacy tests.
- 9 Media Library processing tests.
- 41 Media Library storage tests.
- 7 Media Library geocoding tests.
- 17 Media Library Alt Text tests.
- 43 Media Library admin tests.
- 13 Media Asset review tests.
- 29 Photo Selection publication tests.
- 8 Media Asset Purge tests.
- 11 Media reconciliation tests.
- 4 port-post tests.
- Production build with 72 generated pages using the isolated CI environment.
- Playwright production-build gate: 19 Chromium behavior cases plus six WebKit
  smoke executions, covering both locales, desktop and mobile, light and dark,
  reduced motion, prefetched Instant Navigation before streamed data releases,
  history, focus
  restoration, metadata, feeds, social images, public Insights inclusion, and
  signed-out admin Insights exclusion.
- 53 legacy URL probes against the production server.
- 400 internal links and 147 external targets across all 30 sitemap pages; one
  aggregate fetch was transiently inconclusive and returned 200 on direct
  retry.
- 30 public discovery pages and failure-handling verification.
- Production security-boundary verification.
- OSV audit of 653 production package versions with no findings.
- Full-SHA GitHub Action reference check.
- Redacted Gitleaks 8.30.1 scan of the reachable history with no findings.
- `git diff --check origin/main`.

The focused migration-policy regression also proves that the legacy `0000`
migration remains byte-for-byte immutable and absent from the v3 Drizzle
journal.

## Browser review

Playwright now turns the browser matrix into a repository gate. `Quality` runs
all 19 Chromium cases and repeats the six public smoke profiles in WebKit.
Feature Preview and Staging deployment workflows run the 13 read-only
`@hosted` cases against the exact deployment URL, so deployment-specific
Insights, navigation, metadata, feed, social-image, locale, appearance, motion,
and responsive failures block the workflow. Screenshots, video, and traces are
retained only on failure.

The exact Feature Preview for `2336124` passed all 13 hosted cases at
`https://cali-lonkhb5df-cali.vercel.app` in GitHub Actions run
[29671775136](https://github.com/CaliCastle/cali.so/actions/runs/29671775136).

Local production-build review covered the homepage and a representative blog
post in Chinese and English at desktop and mobile widths. Staging repeated the
matrix on `dev@8802607`: Chinese and English Home, Projects, Photos, Writing,
and AMA routes rendered at 1440 pixels and an emulated 390-pixel iPhone; light
and dark appearance had no horizontal overflow or browser errors; and reduced
motion reported zero running animations.

The review found that the custom `scroll-fade*` class names collided with
generated Tailwind scroll utilities. The collision introduced scroll-driven
animations and `transition: all`, including with reduced motion enabled. The
classes are now named `viewport-edge-fade*`, and a focused regression test
keeps them outside Tailwind's scroll-utility namespace.

Local evidence filenames:

- `home-zh-desktop-light.png`
- `home-en-desktop-dark.png`
- `home-en-mobile-reduced.png`
- `post-zh-desktop-light.png`
- `post-en-mobile-reduced.png`
- `post-zh-scroll.png`
- `og-zh.png`
- `og-en.png`

Follow-up production-server checks confirmed the complete Preferences keyboard
path, theme selection, Escape dismissal and trigger-focus restoration, post
navigation, lightbox activation and focus restoration, and article-map
activation and dismissal. They also confirmed Chinese and English Projects and
Photos pages without horizontal overflow; valid nine-item Chinese and English
feeds; localized Chinese and English Open Graph images; and zero running
animations under reduced motion. A final design-contract pass also confirmed
stable selection weights and contrast, instant indicator geometry, 14-pixel
Tweet copy, the shared chrome tracking value, and the 300ms swift image reveal.
The Staging keyboard path opened Preferences with Enter, dismissed it with
Escape, and restored trigger focus. A keyboard activation from English Home to
Projects stayed within one browser navigation entry, confirming client-side
Instant Navigation; the reduced-motion path remained animation-free. Clean
Staging `/admin` navigation completed Clerk's development handshake and reached
the non-production sign-in UI. Remote link, URL-contract, discovery, and
security-boundary checks also passed against the same origin.

Final review artifacts after the accessibility corrections:

- `final-home-en-desktop.png`
- `final-preferences-en-desktop.png`
- `final-preferences-en-motion-fix.png`
- `final-home-en-mobile-reduced.png`

## Review disposition

- The missing public-link gate is closed by `pnpm verify:links` and its CI
  integration. Same-repository runs crawl every sitemap page, reject broken
  internal targets, and live-check external targets. A repeated 404 or 410 is
  a failure; transient provider or TLS failures remain visible as inconclusive
  rather than making repository release status depend on another service's
  uptime. The final aggregate run had one inconclusive X/Twitter fetch; a direct
  retry returned HTTP 200.
- PR #189 landed the keyboard-instant Preview-card, lightbox, and article-map
  paths. The Playwright production-build gate now verifies zero card and cell
  motion on keyboard Preview-card focus, synchronous lightbox open and Escape
  focus restoration, instant article-map toggles, and zero running Web
  Animations under reduced motion. Issues #184 through #186 shipped on `main`
  through PR #189 and were closed during the release-record cleanup.
- Earlier design-contract findings around selection weight, contrast, scroll
  reveals, and chrome typography are closed. The final review newly found that
  the implementation uses local and page-level numeric stacking values beyond
  the design language's closed layer scale; that finding remains open.
- The Media Library is now part of the v3 launch surface. Owner routes cover
  ingestion, review, recovery, and Photo Selection curation; public routes read
  an immutable Published Photo Selection from Bunny Renditions. The six static
  photos and their code path were removed, so release evidence must verify the
  production catalog, provider boundary, and publication rather than relying
  on a repository fallback.
- The merged Media schema's `lifecycle` column conflicted with the Media
  glossary. Rewriting merged migration `0005` would have been unsafe, so PR
  #138 resolved [#134](https://github.com/CaliCastle/cali.so/issues/134) with
  additive migration `0009`, renaming the column and constraint to Catalog
  State and aligning the schema, repositories, admin surfaces, tests, and
  glossary. State transitions and publication behavior are unchanged, and the
  Standards breach is closed.
- The final complete-diff Standards review found two stale decision conflicts.
  ADR-0011 now records credential-driven AMA capabilities, ADR-0012 records the
  removal of owner step-up prompts, and the superseded ADR and security-baseline
  text is explicit. PR #189 resolves the motion finding in code; the layer
  finding and a refreshed complete-diff review remain open.
- The final complete-diff Spec review found no scope creep. The automated
  browser-test gap is now closed locally and wired into Quality, Preview, and
  Staging. Staging still substitutes for the issue's literal Preview
  requirement, and the overstated Domain row is corrected above. Production
  and dashboard blockers remain unchanged.
- Remaining type below 14 pixels is limited to the design language's explicit
  13-pixel code exception and text printed onto physical craft objects such as
  polaroids, record sleeves, book covers, and the illustrated envelope. It is
  object artwork rather than site chrome.
- The compact localized-text component name `T` is retained as an established
  JSX convention whose `zh` and `en` props make its role explicit. The small
  duplicated Google status mapping is retained inside the owner-only AMA
  surface; neither judgement finding is a cutover defect.

## Migration and provider boundary

Migration `0000` is the immutable legacy Production baseline restored from
`main`; it remains outside the v3 Drizzle journal and must never be rerun.
Migrations `0001` through `0004` are additive AMA foundations. Migrations
`0005` through `0009` define the Media catalog, Photo Selection publication,
publication revisions, durable Purge progress, and the Catalog State rename.
Migration `0010` adds durable Preview rate-limit windows without storing raw
request keys. Migration `0011` adds the paid AMA booking tables, constraints,
and indexes. Migration `0012` expands published Rendition profiles without a
table rewrite. Their checked-in snapshots and migration tests pass. The v3
public photo surfaces require the Media migrations, production Bunny
configuration, and an active Published Photo Selection. Git remains
authoritative for writing and ordinary site content, but not for the curated
photo wall.

For the v3.0 deployment, the authorized operator confirmed the Production
runtime role has only the required CRUD grants, confirmed Vercel has no
migration credential, and isolated the direct migration credential in the
`main`-restricted GitHub Production environment. Run #29707454879 applied the
complete additive migration history before deploying the exact commit. Public
site, discovery, URL, link, security-boundary, and signed-out admin checks pass
against Production.

Signed-in owner verification, the protected Original and public Rendition path
contract in the shared Bunny Media zone, the active Published Photo Selection,
and complete
end-to-end exercises for each configured AMA provider remain operator checks.

Production database or sensitive cloud-data inspection requires two fresh,
explicit confirmations immediately before access.

## Domain and rollback expectations

The release flow is a reviewed pull request from `dev` into `main`. Every commit
reaching `main` automatically runs credential guards, the expand-only
migration check, Production migrations, and the exact Vercel deployment in that
order. The `main`-only Production environment scopes credentials without an
additional deployment reviewer. Vercel must retain `cali.so` and `www.cali.so`
on the same project. No manual DNS move is expected, but current project
ownership, aliases, certificate, and environment scopes must be verified.

Rollback must prefer promoting the last known-good Vercel production deployment
or reverting the cutover merge. The twelve additive database migrations should
remain in place during application rollback; destructive down migrations are
not part of the procedure. Record the known-good deployment identifier and an
operator before accepting a Production deployment.

## Post-release follow-ups

Maintainer-operated commands for the hosted actions below are collected in
`docs/v3-cutover-ops-runbook.md`.

1. Refresh the complete-diff Standards and Spec reviews and reconcile the
   implementation with the documented closed layer scale. Issues #184 through
   #186 are shipped and closed. The
   judgement-level `app/globals.css` divergent-change finding may remain a
   follow-up only if the maintainer records that disposition.
2. Confirm fresh Chinese and English Production pageviews are visible in the
   existing `cali-so` Analytics dashboard.
3. With two fresh confirmations, verify Staging migrations `0010` and `0011`,
   Media and AMA tables, and the runtime role's CRUD-only grants. Then sign in
   as the marked owner and prove one non-destructive read plus the required
   mutation boundaries. Until then, treat signed-in Staging admin operations as
   unvalidated.
4. In the Vercel dashboard, verify logs, drains, retention, firewall rules,
   the production-branch mapping, and the certificate.
5. Verify the Production Bunny and Neon Media boundary, run the protected live
   storage contract, and publish the intended two-photo Published Photo
   Selection through the owner admin.
6. Sign in as the marked Production owner and exercise each configured AMA
   provider workflow without exposing customer or credential data.
7. Confirm the rollback procedure against the now-recorded Production
   deployment.
