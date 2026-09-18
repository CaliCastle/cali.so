# Private résumé

`/resume` (Chinese) and `/en/resume` (English) are direct-link pages. They use
the site's paper, type, section marks, and light/dark palette, with no public
dock, footer, analytics, or social requests. Only these private pages link to
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
résumé. The passphrase and session secret remain on the server. Protected
content is absent from signed-out HTML and React Server Component responses.
The cookie is HttpOnly, SameSite=Lax, and Secure on HTTPS, with an eight-hour
expiry. Rotating either credential invalidates existing sessions. Lock résumé
clears this browser's cookie. Like any shared-passphrase document, someone
with access can retain a copy or share their access.

Both POST endpoints check the configured origin and Fetch Metadata. Unlock
allows five attempts per client in fifteen minutes, using the existing
pseudonymous rate limiter; backend failures deny access. Form bodies have a
4 KiB limit. Private pages and endpoints use `private, no-store` responses.
Print / save PDF uses the authenticated browser document; no public PDF exists.

## Content

The initial edition uses the existing `lib/personal.ts` work history,
`lib/projects.ts` project registry, and homepage introduction. It adds no
unverified education, accomplishments, dates, or metrics.

Edit the layout and private copy in `app/_views/resume-content.tsx`. Keep any
future sensitive content in server-only modules and out of `public/` or client
components. This repository's visibility still determines who can read source;
the website gate does not protect committed source from repository readers.

## Checks

```sh
pnpm exec vitest run lib/resume app/site-document.test.tsx lib/security
pnpm typecheck
pnpm build
pnpm test:browser --project=chromium tests/browser/resume.spec.ts
```

The browser suite uses explicit local test credentials, never hosted secrets.
