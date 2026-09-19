# Private résumé

`/resume` (Chinese) and `/en/resume` (English) are direct-link pages, with no
public dock, footer, analytics, or social requests. Both documents share a
standalone Swiss grid: a 1120px page, an asymmetric twelve-column layout,
generous section spacing, and neutral sans-serif type. It uses its own
stylesheet and system light/dark palette, without the site's paper texture or
decorative chrome. On phones it becomes a single reading column; print uses
a compact A4 layout. Each language keeps its own content and section labels.
Only these private pages link to
each other. They are absent from navigation, the sitemap, feeds, and `llms.txt`.
The routes send `noindex, nofollow, noarchive, nosnippet` and a `same-origin`
referrer policy. This keeps the private URL out of external requests while
preserving the Origin header needed by native same-origin form submissions.
There is deliberately no `robots.txt` entry advertising their URLs.

## Configuration

Set these **server-only** environment values in the intended deployment:

- `RESUME_PASSPHRASE`: a unique passphrase, 16–256 characters.
- `RESUME_SESSION_SECRET`: a separate random secret, at least 32 characters.
  Generate it with `openssl rand -hex 32`.

Missing, incomplete, or weak credentials leave the page locked. Neither value
belongs in `NEXT_PUBLIC_*`, committed source, client props, or a URL. The
passphrase is case-sensitive; spaces are significant. Redeploy after changing
deployment environment values. Share the URL and passphrase directly.

The existing `SITE_URL`, `RATE_LIMIT_HASH_KEY`, and rate-limit backend must also
be configured. The browser-test config sets `SITE_URL` to the local test server;
the browser origin must match the configured mutation origin. Production uses
Upstash; Preview/Staging use their isolated database; Local/CI use memory.
No new database schema is required. This feature does not change remote settings.

## Access boundary

The server validates an expiring HMAC-signed cookie before rendering the
résumé. Passphrase comparisons and session signing use an asynchronous
scrypt-derived key bound to both credentials. The passphrase and session
secret remain on the server. Protected
content is absent from signed-out HTML and React Server Component responses.
The cookie is HttpOnly, SameSite=Lax, and Secure on HTTPS, with an eight-hour
expiry. Rotating either credential invalidates existing sessions. Both footers
offer only printing, with no manual lock control. Like any shared-passphrase
document, someone with access can retain a copy or share their access.

Both POST endpoints check the configured origin and Fetch Metadata. Unlock
allows five attempts per client in fifteen minutes, using the existing
pseudonymous rate limiter. Each server process allows at most two concurrent
passphrase verifications, rejecting excess work with a generic 503 instead of
queuing expensive derivations. Backend failures deny access. Form bodies have a
4 KiB limit. Private pages and endpoints use `private, no-store` responses.
Print / save PDF uses the authenticated browser document; no public PDF exists.

## Content

Each language has an independent full CV setting: `RESUME_ZH_CONTENT_BASE64`
for Chinese and `RESUME_EN_CONTENT_BASE64` for English. When a locale's setting
is absent, that locale uses the initial draft from `lib/personal.ts`,
`lib/projects.ts`, and the homepage introduction. Invalid configured content
fails with a generic error instead of silently showing an old draft. Only the
requested locale's configuration is parsed, so an invalid Chinese setting
cannot affect English, and vice versa.

The supplied masters are kept in `.private/resume.zh.json` and
`.private/resume.en.json`, ignored local files. **Do not commit these files or
their encoded values.** This repository
is public, and the website passphrase cannot protect material in Git history.
The content is parsed only after the page checks the visitor's session.

To prepare the deployment value locally:

```sh
node -e 'process.stdout.write(require("node:fs").readFileSync(".private/resume.en.json").toString("base64"))'
```

Set the result as `RESUME_EN_CONTENT_BASE64` in the intended server environment
and redeploy. For Chinese, encode its own file:

```sh
node -e 'process.stdout.write(require("node:fs").readFileSync(".private/resume.zh.json").toString("base64"))'
```

Set that result as `RESUME_ZH_CONTENT_BASE64`, preserving the English setting.
Base64 is only a transport encoding, not encryption; handle the
value as private content. No remote configuration is changed by this work.

The English JSON has `name`, `title`, `summary`, `experience`, `capabilities`, and
`education` fields. Each experience has `company`, `role`, `period`, `bullets`,
and optional `engagements` (`name`, `role`, optional `note`, and `bullets`).
`period` accepts either one string or an array of date/location lines.
Experience entries can include a `selectedClients` array of up to 20 names,
each at most 100 characters, rendered as a compact line below the role's bullets.
Capabilities have `label` and `description`; education has `institution`,
`qualification`, and optional `notes`. Optional `openSource` entries contain
`name`, `technology`, `description`, and an optional HTTPS `url`;
`educationNote` holds the closing education paragraph. Earlier documents
without these additions remain valid.
The schema lives in `lib/resume/content.ts`. English bullets support
`**bold emphasis**` and `*italics*`; HTML and executable MDX are never interpreted.

Both editions accept an optional top-level `phone` field containing an
international number starting with `+`. Spaces and hyphens are allowed for
display and removed from the tap-to-call link. Keep the actual number in the
private JSON, never in tracked source files. It appears only after unlocking
the résumé and is included when printing.

The Chinese schema in `lib/resume/content-zh.ts` uses the same top-level fields,
with required `openSource` and an optional `educationNote`. Each experience has a
`periods` array instead of `period`, and supports an optional `description`
for roles presented as a paragraph; either the description or bullets must be
present. The same optional `selectedClients` array is supported.
Open-source entries have `name`, `technology`, `description`, and an
optional HTTPS `url`. A configured URL makes the project name a link in either
language; existing entries without URLs stay as text.
Each education entry also has a `notes` array.
Chinese bullets support bold emphasis.

The layouts are in `app/_views/resume-content-en.tsx` and
`app/_views/resume-content-zh.tsx`. They preserve each master's experience and
project order, with readable page breaks when printed. Both root layouts use
`ResumeDocument` and load only `app/_components/resume.css`; neither uses
`SiteDocument` or the public site styles. Their unconfigured drafts and
passphrase forms share the same standalone layout.
Interview notes and editorial recommendations surrounding the CV are omitted.
Tests use synthetic content instead of private career or commercial details.

## Checks

```sh
pnpm exec vitest run lib/resume app/site-document.test.tsx lib/security
pnpm typecheck
pnpm build
pnpm test:browser --project=chromium tests/browser/resume.spec.ts
```

The browser suite uses explicit local test credentials, never hosted secrets.
