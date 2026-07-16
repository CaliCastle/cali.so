# Security verification

Last checked: 2026-07-16. This note separates repository evidence from hosted
settings. Do not paste credentials, scan findings, or exploit details here;
use GitHub private vulnerability reporting.

## Local repository

- [x] `SECURITY.md` directs coordinated disclosure to GitHub private
  vulnerability reporting.
- [x] Dependabot covers pnpm/npm dependencies and GitHub Actions.
- [x] `.github/workflows/security.yml` runs Quality and advanced CodeQL for
  pull requests, `v2`, `main`, and the weekly schedule.
- [x] Workflow permissions default to read-only. Only CodeQL adds
  `security-events: write`.
- [x] Third-party Actions are pinned to full reviewed commit SHAs.
- [x] Gitleaks 8.30.1 scanned all 402 commits reachable from local branches
  and tags with redaction enabled. The only match was Clerk's public
  publishable key in the CI fixture; its exact fingerprint is documented in
  `.gitleaksignore`. The repeat scan reported no leaks.
- [x] Application security tests cover CSP and headers, same-origin mutation
  policy, route limits, fail-closed AMA capabilities, privacy-safe audit
  events, and the owner-admin boundary.

Local recheck:

```sh
pnpm typecheck
pnpm test:unit
pnpm test:ama
pnpm test:security
pnpm audit:prod
pnpm verify:security-boundary
gitleaks git --redact --no-banner --log-opts='--branches --tags' --verbose
git grep -nE 'uses: [^#[:space:]]+@(v|main|master|[0-9a-f]{1,39})([[:space:]]|$)' -- '.github/workflows/*.yml'
```

The production dependency audit queries OSV from the installed pnpm graph.
Public CI reports only the finding count; re-run privately with
`AUDIT_DETAILS=true` for package and advisory identifiers. Security scan output
must remain private.

## GitHub

Repository API checks on 2026-07-16 verified:

- [x] Private vulnerability reporting, secret scanning, push protection, and
  Dependabot security updates are enabled.
- [x] Default Actions workflow permissions are read-only and workflows cannot
  approve pull requests.
- [x] Actions must be pinned to a full commit SHA.
- [x] The `v2` ruleset requires pull requests, blocks force pushes and branch
  deletion, and limits the audited emergency bypass to repository
  administrators. It requires no approving review while the project has one
  maintainer.
- [ ] Require the successful GitHub Actions checks named `Quality` and
  `CodeQL` on both `v2` and `main`.
- [x] CodeQL default setup is disabled so the committed advanced workflow is
  the single analysis source.
- [ ] Non-provider secret patterns and validity checks are unavailable in the
  repository's current GitHub product mode. Recheck after a product or plan
  change.
- [x] Fork pull requests cannot receive Vercel secrets, and the GitHub Actions
  workflow uses committed non-secret fixtures instead of repository secrets.

## Vercel

Project API checks on 2026-07-16 verified:

- [x] `cali-so` is accessible in the `Cali` Pro workspace. Its production
  branch remains `main`, and Git fork protection is enabled.
- [x] Production and Preview have distinct database variables. Preview uses a
  disposable Neon branch and a pooled CRUD-only runtime role; migrations use a
  separate direct credential that is absent from Vercel.
- [x] Preview explicitly sets all five optional AMA capability switches to
  `false`. Owner admin has no capability switch and remains protected by Clerk
  authentication plus the exact server-side `siteOwner: "yes"` marker.
- [ ] Add the five explicit false AMA capability switches to Production before
  the v3 cutover.
- [ ] Add an isolated Preview `CLERK_SECRET_KEY`; never expose the Production
  Clerk secret to Preview.
- [ ] Split the shared Resend and Marketplace KV credentials so Preview and
  Production never receive the same provider secret.
- [ ] Remove the obsolete `Admin Security` challenge for the removed
  `POST /api/admin/auth/request` route.
- [x] Vercel reports no configured log drains for the workspace. A grouped,
  payload-free Preview query confirmed runtime-log access. The Pro workspace
  has Observability Plus enabled for this project, so Vercel's documented
  runtime-log retention is 30 days with a maximum 14-day query window.
- [ ] At cutover, replace the legacy Production database variable with the
  verified Neon runtime role and verify its grants under issue #107. Production
  database inspection still requires two fresh explicit confirmations.

Clerk provider configuration and owner recovery remain tracked by issue #93.
Production provider values remain a cutover concern until v3 replaces the
historical site on `main`.
