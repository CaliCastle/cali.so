# cali.so

Source for [Cali Castle's personal site](https://cali.so). The ground-up v3
source release reached `main` on July 20, 2026. The 2024 site remains the
historical v2 release, Git `dev` is the protected long-lived Staging and
integration branch, and `main` is Production.

This repository documents and builds cali.so itself. It is not maintained as a
general-purpose blog template.

## Architecture

- Next.js 16.3, React 19, TypeScript, and Tailwind CSS v4
- Base UI primitives with the `@fluid` component registry
- MDX posts and colocated media under `content/blog/`
- Release routing keeps Chinese at its existing unprefixed URLs and gives
  English the matching `/en` route family
- Static public pages with ISR-backed social data and committed fallback
  snapshots
- An always-available owner admin for Media and AMA operations, protected by
  Clerk authentication, exact owner metadata, origin checks, and rate limits;
  provider-backed AMA capabilities follow complete credential pairs and fail
  closed when their pair is absent
- A Bunny-backed Media Library with owner review and curation in admin; its
  active Published Photo Selection powers `/photos` and the homepage preview
  while CDN path rules expose only immutable Renditions
- CSP, same-origin mutation checks, rate limits, fail-closed provider controls,
  security automation, and isolated Staging, Preview, and Production credentials

The public route and launch contract is preserved in closed
[issue #98](https://github.com/CaliCastle/cali.so/issues/98) and the
[cutover record](docs/v3-cutover-readiness.md). PR
[#195](https://github.com/CaliCastle/cali.so/pull/195) promoted v3 to `main`;
future releases continue through reviewed `dev` to `main` pull requests.

## Local development

Use the pnpm version declared in `package.json` and isolated development
credentials. Never copy production data or secrets into a local or Preview
environment.

```bash
corepack enable
pnpm install --frozen-lockfile
cp .env.example .env.local
pnpm dev
```

`.env.example` documents the runtime variables and fail-closed provider
boundaries. The application database credential must be a CRUD-only runtime
role. Supply `MIGRATION_DATABASE_URL` only to an explicit migration command;
do not store it in `.env.local` or Vercel.

```bash
MIGRATION_DATABASE_URL=postgresql://... pnpm db:migrate
```

## Validation

Run the checks relevant to a change throughout development. Before release,
the full suite and production build must pass from a frozen-lockfile install.

```bash
pnpm typecheck
pnpm test:unit
pnpm test:localization
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
pnpm build
pnpm verify:legacy-urls
pnpm verify:links
pnpm verify:public-discovery
pnpm verify:security-boundary
pnpm audit:prod
```

## Deployment constraints

- Feature pull requests target `dev`; reviewed releases promote `dev` to
  `main`.
- GitHub Actions is the sole deployment controller. Vercel Git deployments are
  disabled so migrations finish before the matching commit is deployed.
- `dev` automatically migrates and deploys persistent Staging. Internal feature
  branches receive persistent Neon `preview/<git-branch>` children of Staging;
  fork pull requests receive code-only CI.
- Production uses a separate Neon project and a `main`-only GitHub environment
  for its migration and deployment credentials. After required pull-request
  checks pass and a commit reaches `main`, GitHub automatically migrates and
  deploys that exact commit.
- Next.js preview versions stay pinned exactly and require explicit review,
  a lockfile update, and the complete validation suite.
- Staging and Previews use a separate non-production Neon project and disposable
  or irreversibly sanitized data. Production credentials cannot reach it, and
  its automation credentials cannot reach Production.
- Redis is Production-only. Staging and Preview rate limits use Neon; Local and
  ordinary CI use process-local limits.
- The Vercel runtime never receives migration credentials.
- Production migrations are expand-only in the normal release workflow.
  Reviewed migrations are hash-locked, and future SQL must match the explicit
  allowlist. Destructive contract migrations require a later, separately
  approved release.
- Owner admin remains available in every environment and relies on
  Clerk authentication plus the server-checked
  `publicMetadata.siteOwner = "yes"` marker rather than an environment switch.
  Public AMA mutations are enabled by default. Payments, booking finalization,
  Google, and Tencent turn on only when their complete Production credential
  pairs are configured and otherwise fail closed with 503.
- The public photo surfaces depend on migrations `0005` through `0008`, the
  protected Original and public Rendition path boundary in the shared Bunny
  Media zone, and an active Published Photo Selection. The retired static photo
  fallback is not part of v3.
- Production database or sensitive cloud-data access requires two fresh
  confirmations immediately before access.

See [docs/security/baseline.md](docs/security/baseline.md) for the enforced
boundary and [docs/security/verification.md](docs/security/verification.md)
for hosted controls that require current evidence.

## Documentation

- [docs/handoff.md](docs/handoff.md): current architecture, release gates,
  commands, and gotchas
- [docs/design-language.md](docs/design-language.md): visual and interaction
  contract
- [CONTEXT-MAP.md](CONTEXT-MAP.md): domain contexts and vocabulary
- [docs/adr/](docs/adr/): system-wide architectural decisions
- [docs/asset-sources.md](docs/asset-sources.md): third-party cover sources
- [AGENTS.md](AGENTS.md): repository-specific agent agreements

The 2023/2024 cloning article is preserved as historical content for the
legacy v2 stack. Its Sanity, Clerk, comments, guestbook, and Studio setup does
not describe v3.

## Release history

- **v3.0** (July 20, 2026): ground-up, repository-owned source release promoted
  through PR #195 and described by issue #98
- **v2.0** (2024-03-13): legacy Sanity and Next.js 14 site
- **v1.1** (2024-03-10): migrated the legacy database from PlanetScale to Neon

## License and content rights

Original application source code is available under the [MIT License](LICENSE).
The MIT grant does not cover Cali's personal writing, photographs, artwork,
identity, likeness, logos, branding, personal data, or third-party assets.
Those materials remain subject to their respective rights and may not be
reused except with separate permission or as allowed by law. Examples include
authored work under `content/blog/`, personal media under `public/images/`,
biographical and taste data, and the third-party covers recorded in
`docs/asset-sources.md`. A fork must replace or omit these materials and supply
its own identity, analytics identifiers, credentials, and deployment settings.
