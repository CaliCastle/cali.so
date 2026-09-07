# AMA booking operations

The paid AMA booking system (issue #79, slices #82 through #87) is fully
implemented and enabled by default. There are no capability switches: each
provider-backed capability turns on when its credential pair is configured
and its routes fail closed with 503 while it is not. This document records
the environment contract and the operating lifecycle. No secret values
belong in this file, in the repository, or in issue threads.

## Environment contract

Runtime application validation lives in `lib/ama/server-env-schema.ts`, while
`PUBLIC_SITE_URL` is validated when `lib/seo.ts` initializes public discovery.
Misconfiguration fails at startup with field names only. `.env.example`
mirrors this table.

| Variable | Required when | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | always | CRUD-only Postgres role. Never the migration credential. |
| `ADMIN_EMAIL` | always | Owner data namespace and Google Calendar owner. |
| `AMA_ENCRYPTION_KEY` | always | 32-byte base64 key: Google refresh-token envelopes and Manage Link token derivation. |
| `RATE_LIMIT_HASH_KEY` | always | 32-byte base64 key pseudonymizing rate-limit and audit actors, including public booking clients. |
| `PUBLIC_SITE_URL` | optional | Public discovery identity for canonical links, feeds, alternates, and social metadata. Production builds default to `https://cali.so`; forks should set their own public origin. |
| `SITE_URL` | Production and custom aliases | Operational origin for links, provider return URLs, and same-origin mutation checks. Ordinary Vercel Previews derive it from Vercel's system deployment URL; custom environments such as Staging must set it to their stable alias. |
| `CRON_SECRET` | scheduled work | Bearer secret for `/api/internal/ama/work` (and media reconcile). Vercel injects it for cron invocations. |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | availability + calendar | OAuth client for free/busy and calendar event writes. Slots and meeting creation are unavailable until configured. |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | payments | Checkout Session and refund API access; the webhook secret signs `/api/ama/stripe/webhook` (the webhook, never the return URL, is authoritative for payment). Checkout and webhook routes return 503 until configured. |
| `RESEND_API_KEY` / `AMA_EMAIL_FROM` | booking finalization | Transactional email delivery; sender accepts `Name <address@domain>`. Finalization and Manage Link mutations return 503 until configured. |
| `TENCENT_MEETING_MCP_URL` / `TENCENT_MEETING_MCP_TOKEN` | Tencent Meeting | Server-only MCP bridge; the token travels as `X-Tencent-Meeting-Token` and never reaches logs or errors. |
| `AMA_PUBLIC_RATE_LIMIT_MAX_REQUESTS` / `_WINDOW_SECONDS` | optional | Public mutation rate limit (defaults 10 per 60s). Backend follows the environment: Upstash in Production, Neon windows in Preview, process-local elsewhere. |
| `ADMIN_MUTATION_RATE_LIMIT_MAX_REQUESTS` / `_WINDOW_SECONDS` | optional | Owner admin mutation limit. |

Capability posture (maintainer decision, July 2026): the former
`AMA_*_ENABLED` launch switches are removed. Public booking mutations (Slot
Holds and Alternate Time Requests) are always enabled. Payments, booking
finalization, Google, and Tencent derive their availability from the
credential pairs above; each pair must be complete or entirely absent (a
half pair fails startup validation), and a route whose provider is
unconfigured returns 503 before touching provider code.

## Lifecycle summary

1. `/ama` presents the offer; `/ama/book` collects intake and shows slots from
   the availability engine (recurring owner windows and replacing Date
   Overrides in the configured Schedule Time Zone, Google free/busy, active
   Slot Holds, Bookings, 24h notice, 30-day horizon, and 15-minute buffers).
2. Selecting a time creates a 15-minute Slot Hold. Postgres enforces
   non-overlap through an exclusion constraint on the buffered interval, so
   racing guests cannot both win.
3. Checkout is Stripe-hosted (US$99), idempotent per hold. The signed webhook
   converts the hold into a Booking exactly once; provider event ids are
   persisted before side effects. A payment that lands after hold expiry
   either reclaims the interval or parks the paid Booking in
   `needs_reschedule` for the guest to pick a new time.
4. Finalization runs as durable operations (leases, bounded backoff, terminal
   failure states): meeting creation (Google Meet through the Calendar
   conference contract with a deterministic event id; Tencent Meeting through
   the MCP bridge with the link carried in an ordinary calendar event),
   confirmation email with the private Manage Link, 24h and 1h reminders, and
   a Booking Brief purge 90 days after the session.
5. Guests manage Bookings through the Manage Link: reschedule or cancel until
   24 hours before the session; eligible cancellations refund automatically
   and idempotently. Admin (`/admin/ama`) operates Bookings, Alternate Time
   Requests, refund exceptions, retries, and manual resolution. The Bookings
   ledger provides attention, upcoming, past, and cancelled views with
   owner-side filters and paginated totals.

## Scheduled work

`vercel.json` runs `/api/internal/ama/work` every thirty minutes with
`CRON_SECRET` bearer auth. Each run releases expired Slot Holds and drains due
durable operations under leases; an interrupted worker's lease expires and the
next run reclaims the work, so no step depends on a healthy previous run.

Successful booking mutations also start a background drain of due operations.
Its shared 240-second deadline cancels in-flight provider requests and prevents
new claims or handlers from starting after expiry; interrupted operations use
the normal durable retry path. Reminders, retry backoff, and expired Slot Hold
release still rely on the scheduled sweep, so due work may wait up to thirty
minutes for its next scheduled run. Media reconciliation runs hourly.

## Local confirmation previews

In `next dev`, these URLs exercise the real public confirmation page and API
contract without a database record. They add no preview-only page chrome:

- Confirmed: `/en/ama/book/confirmation?hold=00000000-0000-4000-8000-000000000001`
- Finalizing: `/en/ama/book/confirmation?hold=00000000-0000-4000-8000-000000000002`
- Needs reschedule: `/en/ama/book/confirmation?hold=00000000-0000-4000-8000-000000000003`

The same hold ids work on the unprefixed Chinese confirmation route. Outside
the development server, they are ordinary unknown ids and never return fixture
data.

## Recovery

- A paid Booking whose provider work keeps failing stays `finalizing`
  (Finalizing Booking) and appears in the admin attention list with retry and
  manual-resolution actions. Payment success is never presented as failure.
- Refund failures park as `refund_status=failed` with a terminal operation;
  admin can retry or grant the refund manually in Stripe and mark the
  operation resolved.
- Tencent Meeting exposes no guaranteed room deletion or rescheduling.
  Cancellation removes the Google Calendar event and attempts Tencent
  cleanup when the bridge offers a cancel tool; rescheduling cancels the old
  room best-effort and recreates the room and invitation for the new time.
  The limitation is recorded on the lifecycle event.

## Privacy

- Manage Link tokens are derived per Booking with HMAC under
  `AMA_ENCRYPTION_KEY`; only SHA-256 hashes are stored, and tokens never
  appear in logs, analytics, or Stripe metadata (which carries opaque ids
  only).
- Funnel analytics (`lib/analytics.ts`) emit event names only, with no
  identity, topics, brief, URL, payment, or token context.
- Booking Brief text and links are purged 90 days after the session while
  financial and scheduling records remain for reconciliation.
