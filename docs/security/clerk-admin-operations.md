# Clerk owner-admin operations

This runbook covers hosted Clerk configuration, owner recovery, session
revocation, and Clerk credential rotation for the owner admin. It contains no
credentials or user identifiers. Perform each hosted change in one Clerk
environment at a time and verify the matching Vercel environment before moving
on.

The application authorization contract is ADR-0009: every admin page and API
loads the authoritative Clerk user on the server and requires
`publicMetadata.siteOwner` to equal the exact string `"yes"`. Email addresses,
browser state, unsafe metadata, and the durable `ADMIN_EMAIL` data namespace
never grant access.

## Environment configuration

Production, Preview, and local development use different Clerk applications or
instances and different secret keys. Never copy the Production secret into
Preview, Development, CI, or a pull request.

For each deployed environment:

1. Set `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` from the same
   Clerk instance. The publishable key is client-visible; the secret key is a
   server credential and must be sensitive and environment-scoped in Vercel.
2. Keep Production signup disabled until issue #94's policy, deletion, consent,
   and privacy-contact gates are complete. The application's retired
   `/sign-in` and `/sign-up` routes are not sufficient on their own because the
   Clerk-hosted sign-in surface is reachable from `/admin`.
3. Allow only verified email codes, Google, and X when public signup is
   eventually approved. Keep passwords, SMS, Apple, and every other social
   provider disabled.
4. Enable passkeys and register the owner as the preferred sign-in method.
   Keep at least two independently recoverable owner passkeys.
5. Mark only the intended owner record with public metadata
   `{ "siteOwner": "yes" }`. Public metadata is readable by the browser but
   writable only by the server or Clerk Dashboard. Private metadata is
   server-only. Unsafe metadata is client-writable and must never authorize
   anything.
6. Verify a signed-out admin API receives 401, a signed-in user without the
   marker receives 403, and the marked owner can open `/admin`. Confirm that
   `/api/admin/auth/request` and `/api/admin/auth/verify` remain 404.

## Step-up verification (removed July 2026)

The former high-impact reverification boundary — client-side
`verifyWithPasskey()` plus a server-checked ten-minute first-factor freshness
window before Google Calendar changes, Media Asset Purge, Photo Selection
publication, and destructive Booking actions — was removed by maintainer
decision in July 2026: on a single-owner personal site the repeated prompts
gated daily flows without a matching threat. Owner authorization is now
exclusively the server-side `siteOwner` check, still wrapped in same-origin
mutation guards, per-actor rate limits, privileged-action audit events, and
the strict admin CSP. Media Asset Purge additionally requires the literal
typed `PURGE` confirmation, validated server-side.

Alongside it, the admin's per-request nonce CSP was retired when admin
routes adopted prerendered instant-navigation shells (nonces require
dynamic rendering). Admin pages use the static site policy from
`lib/security/headers.ts`; with no client-side Clerk remaining, no
provider origins are needed in it.

Passkeys remain the recommended Clerk sign-in method, and every recovery
procedure below still applies. Reintroducing a step-up boundary would need
its own decision and should note that Clerk exposes factor ages but not the
factor strategy — a server can prove freshness, not that the factor was a
passkey.

AMA Bookings remain accountless and use private Manage Links. Do not attach a
Clerk user ID to a Booking until issue #89 has its own threat model and ships.

## Suspected owner-session exposure

Containment comes before investigation:

1. In Clerk, remove `siteOwner` from the affected user. This immediately makes
   subsequent authoritative checks return 403 without changing the stable
   Media or AMA data namespace.
2. Revoke every active session for the affected user in the Clerk Dashboard.
   The site's Sign out action revokes only the current session and is not an
   incident-wide response.
3. If the Clerk account itself may be compromised, disable the account or block
   sign-in while recovery is underway. Preserve only privacy-safe timestamps
   and identifiers needed for the incident record.
4. Inspect Clerk and Vercel audit events for unexpected admin access. Never copy
   session tokens, request bodies, email addresses, provider payloads, Booking
   Briefs, or Media Originals into tickets or logs.
5. Recover the identity provider account, remove unknown passkeys and connected
   accounts, register known passkeys, then restore
   `{ "siteOwner": "yes" }` only after the account and sessions are clean.
6. Sign in through `/admin`, verify the authoritative owner check, and exercise
   one non-destructive admin read before resuming privileged work.

If the owner device alone is lost, revoke its session and passkey from a known
device. Do not rotate application credentials unless they may also have been
exposed.

## Clerk secret-key exposure

Treat a pasted, logged, committed, or otherwise disclosed `CLERK_SECRET_KEY` as
compromised even if no misuse is visible.

1. Remove the exposed value from the immediate surface without publishing the
   credential in an issue or pull request. Report repository exposures through
   GitHub private vulnerability reporting.
2. Create a replacement secret in the affected Clerk environment.
3. Replace only that environment's `CLERK_SECRET_KEY` in Vercel and trigger a
   fresh deployment. Do not reuse the key in another environment.
4. Verify the new deployment: public pages return normally, signed-out
   `/admin` redirects to Clerk, the owner reaches `/admin`, a non-owner receives
   403, and admin API denials contain no provider detail.
5. Revoke the old secret in Clerk only after the replacement deployment is
   Ready and verified. If Clerk does not support overlap, schedule a short
   maintenance window and fail admin closed during the swap.
6. Revoke active sessions when the exposure could have allowed session or user
   manipulation. Review owner metadata and passkeys before restoring access.
7. Record the environment, detection time, rotation time, revocation time, and
   verification result without recording either key.

Rotating a secret key does not replace session revocation, owner-metadata
review, or passkey review. Rotating the publishable key is unnecessary unless
the Clerk instance or domain configuration also changes.

## Recovery proof

The operator closes an incident only after recording all applicable checks:

- affected sessions are revoked;
- the old secret is revoked and absent from Vercel;
- Production and Preview still use distinct Clerk secrets;
- exactly the intended owner has `siteOwner: "yes"`;
- the owner has independently recoverable passkeys;
- signed-out, non-owner, and owner HTTP behavior matches ADR-0009;
- logs and audit records contain no prohibited personal or credential data;
- any public-signup setting remains consistent with issue #94.

Run the repository checks after an authentication or routing change:

```sh
pnpm typecheck
pnpm test:unit
pnpm test:security
pnpm verify:security-boundary
```
