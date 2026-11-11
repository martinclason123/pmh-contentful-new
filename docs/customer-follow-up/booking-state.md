# Booking state and scheduling (Milestone 2)

Milestone 1 was approved October 21, 2026; milestone 2 passed October 23. M2 adds durable scheduling
state; it does not add the follow-up sender, Cron, customer opt-out page or staff
interface. Those remain milestones 3-4. M2a configurable series passed before M3;
see the final section and linked evidence. Production enrollment remains disabled.

## Where to read the implementation

| Module | Responsibility |
| --- | --- |
| `src/app/api/calendly-webhook/route.js` | Thin server-only composition of the existing services and shared handler |
| `src/lib/customer-follow-up/calendly-handler.mjs` | Signature/JSON checks and existing notification flow; persist follow-up state before cancellation/reschedule/already-scheduled early returns |
| `signature.mjs` | Verify exact signed bytes and the existing 180-second tolerance; injectable time for replay |
| `runtime.mjs` | Read/validate explicit server settings, return immediately when disabled, select real providers/storage when enabled |
| `booking-service.mjs` | Validate provider identities and puppy match; hydrate original signup history; convert provider data into minimal facts |
| `booking-state.mjs` | Resolve the linked journey, enrollment, cancellation, stops and unsent message dates in one transaction |
| `schedule.mjs` | Generic calendar-day dates and current-config eligibility |
| `series-definitions.mjs`, `series.mjs` | Shared versioned definitions, validation and normalized snapshots selected by env |
| `reconcile-series.mjs` | Shared reconciliation; stop removed/disabled mail and preserve sent/stopped history |
| `postgres.mjs` | Parameterized breeder-scoped persistence and transaction lifetime |
| `migrate.mjs`, `migrations/001-booking-state.sql`, `002-configurable-series.sql` | Explicit versioned/checksummed schema; never migrate from a webhook |

The test adapters inject Calendar/puppy lookups, notifications, storage and time.
They call the production handler, signature verifier, service, reducer and date
rules. They do not implement their own scheduling algorithm. Real Postgres tests
repeat the same replay cases and additionally verify actual constraints/rollback.

## Stored state

Everything is scoped to `breeder_id`, including unique keys and all queries.

- **Journeys:** one stable identity based on the original invitee, current invitee,
  customer email, puppy chip, latest pickup date, status, stop reason and schedule
  version plus a normalized series snapshot. A replacement keeps the identity,
  enrolled series and pilot membership.
- **Bookings:** minimal durable facts for each invitee and its previous/next links.
  Cancellation facts are monotonic; delayed creation cannot undo them.
- **Messages:** one record per enabled stage in the enrolled definition. Each has
  a stable ID, UTC due/expiry dates, state, stop reason and schedule version.
  Sent/stopped rows retain their dates
  and history; only unsent rows are reconciled. Delivery attempts/leases/provider
  outcomes are deliberately deferred to the worker milestone.
- **Event receipts:** durable processing outcomes keyed by a hash of event identity.
  A failed transaction leaves no successful receipt; a safe replay can retry.
- **Suppressions:** normalized email and reason per breeder. Existing suppression
  and journey stops are honored; the real customer/staff controls arrive in M3.
- **Migrations:** applied version and SQL checksum; changing applied SQL fails
  rather than silently rewriting the schema.

The short per-breeder transaction lock serializes updates and cohort enrollment.
Primary/unique keys independently prevent duplicate journeys/stages. Connections
are short-lived and always closed; this MVP does not maintain an idle application
pool. This is appropriate for the small webhook workload; the due-email worker
and its claim locking are separate M4 work.

## Booking and rescheduling rules

Only signed pickup events qualify. Visits/unknown types do not enroll. A matching
puppy, valid customer email, explicit timestamp and original signup history are
required. The original booking's creation time must be at or after the configured
cutover; an old booking's new replacement date does not make it a new customer.
The configured pilot limit is checked atomically. Set `FOLLOW_UP_PILOT_LIMIT=5`
for the first PMH cohort; replacement events do not take another slot.

Root signup history is resolved through the linked ancestors, with a bounded
100-invitee chain. Missing provider history returns a retryable webhook failure
rather than guessing an enrollment date. Credentials and raw provider errors are
not included in the runtime's follow-up error.

Calendly sends both the old cancellation and new creation for a reschedule.
The cancellation's signed `rescheduled` flag distinguishes that event from an
ordinary cancellation. An old-invitee reference on a replacement does not make
its later ordinary cancellation another reschedule.
[Calendly's payload contract](https://developer.calendly.com/docs/api-guides/see-how-webhook-payloads-change-when-invitees-reschedule-events).

An unknown replacement holds all unsent stages. Both arrival orders end at the
same current pickup and dates. Newer forward links found in a refreshed provider
record also hold stale work until the replacement details arrive. Late events
cannot move the journey back to an earlier invitee. Existing stop reasons and
customer suppression survive replacement events.

State/receipt persistence completes before confirmation/admin/fax work starts.
A notification failure still returns an error for replay, but cannot erase the
saved journey. Existing transactional confirmations are captured during replay;
this milestone does not redesign their delivery/idempotency.

## Dates and eligibility

Offsets are -3, +7 and +21 calendar days in the configured breeder timezone, with
UTC storage. Local pickup time is preserved across ordinary DST changes.
Repeated times use the first occurrence; a nonexistent time uses the next valid
local instant (02:30 in a 02:00-03:00 gap becomes 03:00, not 03:30).

Short-notice preparation keeps its original due timestamp for history and becomes
eligible immediately after persistence. Preparation expires at pickup; delayed
processing cannot send it afterward. Check-in/review expiry use the approved
7/14 calendar-day windows. At the exact expiry instant, the stage is expired.

Eligibility uses the latest journey/version and explicit message state. Passing
pickup needs no positive staff confirmation. Canceled, held, stopped, suppressed
or already-sent work is ineligible. Pausing, final send-time checks, claim races,
retry windows and catch-up spacing are integrated with delivery in M3-M4.

## Migration and rehearsal boundary

The real test runner validates the independently registered test endpoint before
creating a pool. It applies the migration twice to prove safe rerun, runs signed
scenarios, and deletes only its explicitly named `synthetic-m2-*` breeders.
No truncation, branch reset or production SQL is used.

```powershell
npm run test:follow-up
npm run follow-up:simulate -- --scenario S10 --report
npm run test:follow-up:scheduling-database
```

The schema is applied only on the isolated Neon `follow-up-test` branch. There
is no production migration command or automatic migration in the application.
Production migration credentials, the operator migration command, final settings
and customer-send enablement must be reviewed with the M5 launch runbook.

## Breeder portability boundary

The follow-up modules contain no PMH identity, sender, review link or timezone
defaults. Enabled mode requires those settings explicitly through
`getFollowUpConfig`; `FOLLOW_UP_CONTENT_KEY` selects the later content set.
The existing `src/data/scheduling.js` retains legacy booking defaults for the
website, but the new follow-up configuration does not use those as fallbacks.
Copy the common modules/schema and set each deployment's own env and database;
do not copy PMH credentials or customer records. Regression checks prove that
a second synthetic profile uses its own settings/timezone and one breeder's
customer suppression does not stop another breeder's journey. Real rollout to
a second breeder remains the M6 gate.

## Configurable series foundation (M2a)

Fixed stage names/offsets and the SQL stage list were replaced before M3.
`FOLLOW_UP_SERIES_KEY` selects a definition; `FOLLOW_UP_DISABLED_STAGES`
optionally blocks IDs across versions. A journey stores its resolved definition,
including numeric expiry windows, so later settings cannot add or retime stages
on enrolled journeys. Pickup reschedules still use that saved definition.

`reconcileSeries(config, repository)` processes existing journeys inside the
breeder transaction. It never enrolls customers or transfers series versions.
Booking updates use the same per-journey reconciliation. Removed/disabled stages
stop without deleting history; the storage adapters also preserve sent/stopped
rows. Eligibility requires current config and checks whether the selected series
still allows the ID, without waiting for another Calendly event.

This shared entry point has no public route or automatic deployment hook yet.
M4 must call it in the worker/deployment path, load current suppression/pause state
and recheck config before submission. Rendering, claims and sends remain M4.

Migration 002 adds series JSON, generic stage IDs and message stop reasons.
Migration 001 remains immutable. The legacy backfill uses the approved standard
7/14-day policy; populated upgrades are rehearsed in a rolled-back transaction.
There are no live follow-up rows being migrated. See [editing rules](series-configuration.md)
and [M2a evidence](validation/milestone-2a.md).
