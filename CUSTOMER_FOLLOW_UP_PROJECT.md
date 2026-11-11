# Customer follow-up automation

Status: Milestones 1-2 and M2a passed; ready to start Milestone 3 | First pilot: PMH Puppies | Updated: October 23, 2026

Working flowchart: [Email Logic Flow Chart in FigJam](https://www.figma.com/board/HosfTJ0a10eRVFLcyq2NDy/Email-Logic-Flow-Chart?node-id=18-139).
One connected MVP flowchart covers booking updates, per-breeder storage, immediate
and hourly sending, the three email stages, retries, staff controls, and opt-out.
Its Mermaid source lives in `docs/customer-follow-up/mvp-flow.mmd`. Reconcile
agreed board changes into this source and this plan before implementation.
The chart summarizes eligibility and retry handling; the rules below define them.

## Architecture at a glance

1. The customer schedules puppy pickup in Calendly. That pickup booking enrolls
   the follow-up series; the existing checkout provides the scheduling link.
2. A signed webhook in the breeder's Next.js/Vercel site saves the booking and
   the selected series and email dates in that breeder's Neon Postgres database. Calendly also
   sends cancellations and date changes through this webhook.
3. One shared sender will handle immediate preparation for short-notice bookings
   and the hourly Vercel Cron worker. Resend will deliver preparation (-3 days),
   check-in (+7 days), and the Google review request (+21 days).
4. Cancellation stops remaining mail; rescheduling moves unsent dates. The
   customer opt-out page and staff controls will update the same saved state,
   which the sender must recheck before every submission.
5. The same follow-up modules are reused on each breeder's existing site. Brand,
   sender/reply address, time zone, pickup event, review link, content selection,
   service credentials and database connection come from explicit environment
   settings. Each breeder has separate storage and customer preferences.

Milestone 2 completes booking state and scheduling. M2a adds configurable series
before milestone 3. Milestone 3 builds opt-out
and staff controls; milestone 4 builds the worker, email templates and delivery
recovery; milestone 5 rehearses real delivery before the five-pickup PMH pilot.
Give Martin a concise architecture/progress summary at milestone boundaries.
Run the full test checklist autonomously; individual scenario sign-offs are no
longer required. Keep production enrollment off until the separate launch gate.

## Goal and initial scope

Build a reusable, breeder-configured email flow around puppy pickup. Start with
three emails, prioritizing customer care and Google reviews:

| Email | Trigger | Content |
| --- | --- | --- |
| Pickup preparation | 3 days before pickup; immediately when booked inside that window | What to bring, the puppy's current food and transition instructions, and breeder-approved crate training recommendations |
| New-home check-in | 7 days after pickup | Ask how things are going; invite a reply with pictures and a short story |
| Google review request | 21 days after pickup | A friendly request for an honest review, with the breeder's direct Google review link |

Use a monitored reply-to address. Collect pictures/stories through email replies
initially and obtain explicit permission before using them on social media.
Send the same neutral review request to eligible customers regardless of their
check-in response; do not offer review incentives. [Google's review guidance](https://support.google.com/business/answer/3474122)

Initial scope includes cancellation, rescheduling, unsubscribe, manual suppression,
delivery records, and safe retries. Defer SMS, photo upload forms, automatic social
posting, review reminders, review detection, and a full administration dashboard.

## Recommendation: database and hourly worker

For the initial rollout to four breeders, prefer the original database-and-worker
approach. An hourly send window fits emails timed in days, and avoiding empty
checks alone does not justify another scheduling provider. Martin confirmed the
existing Vercel account is on Pro, which supports hourly Cron; this design does
not require a hosting plan upgrade or a separate scheduler service.

Calendly webhooks immediately update bookings, cancellations, and reschedules.
The hourly worker only finds due mail; it is not polling Calendly for changes.
Opt-out takes effect immediately through its own endpoint. The unified FigJam
flowchart reflects this recommendation.

**Calendly webhook -> durable follow-up records -> scheduled worker -> Resend.**

Use the existing signed Calendly webhook to create or update the schedule. Keep
pending emails in a small managed Postgres database. The revised proposal is to
run a worker hourly to send eligible, due emails through the existing Resend
integration. Routine sends may arrive up to an hour after their due time;
short-notice preparation is still attempted immediately.
For short-notice bookings, persist the preparation email first, then attempt it
immediately through the same sending function; the worker can retry failures.
Await that immediate attempt rather than starting detached work in the webhook.

The database owns the current schedule, and every email checks the latest state
just before submission. Date
changes and opt-outs update that state instead of requiring three remote timers
to be canceled and recreated. Contentful remains the puppy/content source; the
new database stores scheduling and delivery state.

Use Vercel Cron on the confirmed existing Pro plan. Vercel does not retry failed
cron invocations, so due records must remain available for later runs.
[Cron limits](https://vercel.com/docs/cron-jobs/usage-and-pricing),
[failure handling](https://vercel.com/docs/cron-jobs/manage-cron-jobs)

### Scheduler cost and cadence

Vercel Cron has no separate scheduling fee, but each run consumes Function usage.
An hourly worker runs 720 times in a 30-day month per breeder deployment; a
five-minute worker runs 8,640 times. At the published Fluid Compute invocation
rate of $0.60 per million, the invocation component alone is approximately
$0.000432 versus $0.005184. CPU, memory, database, and email charges are additional;
the actual bill depends on runtime configuration, plan, and remaining usage credit.
[Function pricing](https://vercel.com/docs/functions/usage-and-pricing)

Across four breeder deployments, hourly checks total 2,880 runs per 30-day month.
Their invocation component is approximately $0.001728 at the same rate, before
usage credit. This is not an estimate of the total bill. Database hosting may
matter much more than the checker invocations; no Pro upgrade is needed.

The existing Pro plan supports hourly Cron and includes $20 in monthly usage
credit. Remaining credit and runtime settings have not been verified; other
website usage shares that credit. No separate scheduler subscription is proposed.
[Vercel pricing](https://vercel.com/pricing)

Hourly checking fits emails measured in days. The worker exits after one indexed
due-record query when there is no work; it should not fetch every puppy or scan
Contentful on every run. An external scheduler still consumes Function usage if
it calls a Vercel endpoint.

Both scheduling designs need persistent opt-out, schedule, and delivery state.
PMH's Neon project is provisioned and connected to Vercel Production; an isolated
`follow-up-test` branch passes the foundation rehearsal. Versioned customer-journey schema/migrations are implemented and tested on that
isolated branch, but have not been applied to Production. Use one small
Neon Postgres project per breeder, connected to that breeder's Vercel project
through the Marketplace. Vercel's former own-brand Postgres product has
been replaced by provider integrations that provision storage and inject
connection environment variables. Separate Vercel deployments do not themselves
provide a database. [Postgres on Vercel](https://vercel.com/docs/postgres)

Use the same schema, versioned migrations, and application logic for all four
databases, with a separate `DATABASE_URL` per deployment. This isolates customer
records, opt-outs, and credentials between breeders. Each schema change must be
applied to all four databases; document that rollout as part of deployment.
A shared database is optional, not a requirement, and four databases do not
automatically mean four paid subscriptions.

As checked on October 8, 2026, Neon advertises 100 Free projects, 1 GB of Postgres
storage per project, and 100 CU-hours of compute per project per month. The small
records in this workflow should fit comfortably within the storage allowance;
free operation is an expectation to validate during the pilot, not a guarantee.
Confirm the actual Marketplace plan and limits before provisioning. Hourly
checks allow the database to sleep between runs; frequent checks can consume
compute even when no emails are due. Monitor storage and compute, and surface
worker failures if a quota prevents processing.
[Neon Free plan](https://neon.com/blog/neon-free-plan-1-gb-per-project),
[compute and scale-to-zero limits](https://github.com/neondatabase/website/blob/main/content/docs/introduction/plans.md)

Alternatives considered:

- **Schedule everything in Resend:** convenient, but scheduling is limited to
  30 days ahead. A pickup booked 30 days ahead puts the review email 51 days
  away, and opt-outs/date changes still need application state and coordination.
  [Resend scheduling](https://resend.com/docs/dashboard/emails/schedule-email)
- **One-off jobs / durable workflows:** technically viable, but deferred for v1.
  Webhooks can create/cancel jobs instead of using a periodic worker. This adds
  another provider, job identifiers, and coordination between database state and
  external jobs. QStash supports future jobs and cancellation, with a seven-day
  delay limit on free and one year on pay-as-you-go. Reconsider if tighter timing
  or more complex workflows create a concrete benefit.
  [Delayed jobs](https://upstash.com/docs/qstash/features/delay),
  [cancellation](https://upstash.com/docs/qstash/api-reference/messages/cancel-a-message)

## Existing foundation and integration points

- `src/app/api/calendly-webhook/route.js` already recognizes pickup creation,
  cancellation, and rescheduling, and matches the booking to a puppy chip.
- `src/utils/pickup-scheduled-email.js` already sends pickup confirmations via
  Resend. Keep those confirmations separate from the new preparation email.
- `src/data/scheduling.js` already exposes breeder settings through environment
  overrides. Follow the same pattern for this feature.
- The subscription setup already requests `invitee.created` and `invitee.canceled`.

The webhook currently returns early for the cancellation half of a reschedule
and for some already-scheduled pickups. Follow-up state must be persisted before
those notification-specific exits. Enrollment should also survive an unrelated
fax/confirmation failure without producing duplicate follow-ups.

## Scheduling and stop rules

- Enroll newly booked **pickups only** after launch. Do not automatically enroll
  old customers or puppy visits; any backfill is a separate reviewed operation.
- Calculate offsets as calendar days in the breeder's configured time zone,
  preserving the local pickup time, then store due timestamps in UTC.
- A future pickup booked less than three days away gets preparation immediately.
  Never send preparation after pickup has passed.
- Rescheduling moves every unsent email to the new dates. An already-sent stage
  stays sent; the existing reschedule confirmation communicates the new date.
- Calendly emits both cancellation and creation events for a reschedule. Link
  `old_invitee`/`new_invitee` into one pickup journey and handle either arrival
  order. Stop the old schedule while replacement details are pending; a late old
  cancellation must not cancel the replacement. [Calendly reschedule payloads](https://developer.calendly.com/docs/api-guides/see-how-webhook-payloads-change-when-invitees-reschedule-events)
- A true cancellation stops pending emails. A mistaken booking can be suppressed
  manually. Replacement bookings must not silently clear suppression.
- Every follow-up includes an unsubscribe link requiring no login. Stop this
  optional flow for that customer across that breeder's pickup journeys, including
  reschedules and future bookings. Do not alter existing payment/booking messages
  or automatically subscribe the customer to newsletters.
- Provide a breeder-wide runtime pause and a per-journey stop action through a
  small authenticated internal interface. Recheck both immediately before send.
  Messages already submitted to the email provider cannot be recalled.
- Permanent bounces and complaints suppress future follow-ups. Temporary failures
  receive bounded retries; unresolved failures are visible to administrators.

### Customer-facing opt-out

Every follow-up must have a visible **Do not email me again** link, with nearby
copy explaining that it stops optional follow-up emails from this breeder. The
link opens a minimal page with one stop button. Require no account, login, email
entry, reason, or further confirmation. Show a success message after saving.

Persist the preference for the breeder and normalized customer email, immediately
stop pending messages, and check that preference before every send and retry.
Rebooking or rescheduling must not re-enable emails. This applies to all three
follow-up stages; payment receipts and booking confirmations remain separate.
An administrator must also honor opt-out requests received by reply.

Use a signed link and a POST for the actual preference change; opening the link
alone must not unsubscribe someone when an email-security scanner visits it.
The opt-out endpoint is independent of the hourly worker and takes effect as soon
as the customer submits the button. Provider submissions already in progress
cannot be recalled.

**Confirmed pickup rule:** Assume pickup happened once the latest scheduled
pickup time has passed, unless the booking was canceled, rescheduled, or marked
otherwise by staff. Anchor the two post-pickup emails to that latest scheduled
time. Staff must be able to mark a no-show or other exception to stop pending
emails; no positive "picked up" confirmation is required.

## Flexible email series

Adding/removing emails is an MVP requirement, confirmed October 23, 2026. Its
foundation moved from milestone 4 into **M2a, before milestone 3**, so controls
and sending use generic stages from the start. See [series editing rules](docs/customer-follow-up/series-configuration.md).

One shared versioned definition lists each email's stable ID, enabled flag,
pickup-relative offset, template/content reference, expiry and short-notice rule.
`FOLLOW_UP_SERIES_KEY` selects it per breeder. Initially, editing means a
configuration-file change and deployment. No administration editor is included.
The first definition is `standard-v1`: preparation (-3), check-in (+7), review
(+21). Adding entries needs no scheduling branch or further schema migration.

Journeys retain a normalized enrollment snapshot. Added stages and timing/content
or expiry-policy edits apply to new journeys only; eligible unsent dates still
move when pickup is rescheduled. No automatic backfill or version-transfer tool
is included. Stable IDs must not be reused for a different email.

Removing an ID from the selected definition, disabling it, or listing it in
`FOLLOW_UP_DISABLED_STAGES` blocks it across older versions too. Eligibility
requires current config, so another Calendly event is unnecessary. Reconciliation
stops pending/held records with a reason, retaining history. Sent/stopped rows
cannot be revived by re-enabling stages, changing versions or rescheduling.
Cancellation, staff stops and customer suppression remain protected.

Migration 002 adds generic stage storage and pinned definitions without changing
migration 001. Only isolated test storage is migrated. M4 must wire reconciliation
into the worker/deployment workflow and recheck current config after claims,
immediately before submission. Rendering, provider sends and claim races remain
M4 deliverables; M2a does not claim those are implemented.

## Minimal state and breeder configuration

Store a pickup journey (breeder ID, puppy reference, customer/email, current
Calendly invitee, pickup time, status, schedule version and series snapshot),
message records for the selected series
(stage, due time, state, attempt count, provider ID, sent time), and customer
suppression. Retain invitee links/event receipts to resolve retries and reschedules.

Use a unique journey/stage constraint and an atomic claim with an expiring lease
so webhook/worker overlap cannot send the same stage concurrently. Preserve the
rendered message and a stable Resend idempotency key across send retries. Resend
keeps keys for 24 hours; keep our own durable sent history, and flag ambiguous
outcomes beyond that window for review instead of blindly retrying.
[Resend idempotency](https://resend.com/docs/dashboard/emails/idempotency-keys)

One common implementation and database schema should run in each breeder
deployment, with its own database connection and all
queries and identifiers scoped to a stable breeder ID. Configuration should reuse
`BREEDER_NAME`, `ORIGIN_URL`, `SCHEDULING_TIME_ZONE`, `SCHEDULING_EMAIL_FROM`,
and `RESEND_API_KEY`, and add proposed settings:

| Setting | Purpose |
| --- | --- |
| `BREEDER_ID` | Stable namespace for journeys, opt-outs, and delivery records |
| `FOLLOW_UP_ENABLED` | Explicit production enablement; default off |
| `FOLLOW_UP_ENROLL_AFTER` | Original booking creation cutover in UTC; set at launch, no backfill |
| `FOLLOW_UP_PILOT_LIMIT` | Explicit cohort cap; five for the first PMH pilot |
| `FOLLOW_UP_REPLY_TO` | Monitored inbox for replies and pictures |
| `GOOGLE_REVIEW_URL` | This breeder's direct review link |
| `FOLLOW_UP_CONTENT_KEY` | Breeder-approved checklist, food information, and crate guidance |
| `FOLLOW_UP_SERIES_KEY` | Required versioned series selection; PMH starts with `standard-v1` |
| `FOLLOW_UP_DISABLED_STAGES` | Optional comma-separated stable IDs to block across enrolled versions |
| `DATABASE_URL` | Connection to this breeder's persistent follow-up database |
| `CRON_SECRET`, `FOLLOW_UP_LINK_SECRET` | Worker authentication and signed unsubscribe links |

Validate required configuration when enabled. Do not fall back to another
breeder's branding, food, sender, or review link. Start with versioned content
files selected by the content key; Contentful editing can come later. Preview
deployments must use test recipients/storage and never send to real customers.

## Code quality and documentation

The implementation must be understandable and maintainable by someone who did
not write it. These are delivery requirements:

- Keep webhook and worker routes thin. Separate booking updates, date calculation,
  eligibility checks, database access, email rendering, and provider delivery
  into focused modules with clear inputs and outputs.
- Share scheduling and sending logic between the immediate preparation path and
  the periodic worker. Keep breeder differences in validated configuration and
  content, with no duplicated breeder-specific business logic.
- Document the flow, stored states, module responsibilities, environment settings,
  and operating procedures for stopping mail or investigating failed sends.
  Keep the documentation and diagrams current with implementation changes.
- Use descriptive names and consistent formatting/linting. Document public
  function contracts using the project's language conventions. Comments should
  explain intent, assumptions, and tricky behavior, especially reschedule ordering,
  duplicate prevention, time zones, and retries.
- Test business rules and failure boundaries: date changes, stop conditions,
  duplicate/concurrent processing, and ambiguous delivery outcomes. Use a
  controllable clock and fake email delivery for these tests.
- Review the business flowchart together before implementation; connect each
  major step to its responsible module as the code is built. Keep the initial
  design small and avoid abstractions without a concrete use in this flow.

## Milestones

PMH Puppies is the first rollout. Build and review one milestone at a time with
Martin. Each gate requires passing automated scenarios, saved evidence and a
concise milestone-level review. Martin may delegate the remaining scenario
walkthroughs; separate approval for every test is not required. Implementation may
proceed inside the current milestone; customer enrollment stays off until the
PMH launch gate. A failed gate is repaired and retested before advancing.

The detailed [milestones and testing checklist](docs/customer-follow-up/milestones-and-testing.md)
defines scenario IDs, expected outcomes, simulation tools, and review evidence.
These scenarios are release requirements, not optional examples.

| Milestone | Deliverable / testing gate |
| --- | --- |
| 1. PMH setup and test foundation | Confirm the PMH repository/deployment, branding, service settings and launch policies; establish isolated fixtures, fake clock, captured emails and scenario reports; pass F01-F06 |
| 2. Booking state and scheduling | Persist journeys and process creation, cancellation and rescheduling; verify dates, ordering, duplicates and integration failures; pass S01-S16 against isolated storage |
| 2a. Configurable series foundation | Versioned definitions, pinned journeys and generic stage storage; pass X01-X16, validation and migration checks before M3 |
| 3. Opt-out and staff controls | Build the customer stop page, breeder pause and journey stop; verify persistence, access controls and suppression scope; pass C01-C12 |
| 4. Worker, templates and delivery recovery | Consume the M2a series rules and reconcile configuration changes; use one sender for immediate and hourly paths; verify templates, claims, retries, provider outcomes and stop/date/configuration races; pass D01-D20 and rerun earlier scenarios |
| 5. PMH rehearsal with controlled recipients | Exercise deployed routes, actual Cron, real provider delivery and complete simulated timelines; jointly review P01-P08 and the full regression report |
| 6. PMH live pilot, then breeder reuse | Enable new PMH pickups, observe all three stages and operating controls, then validate a second breeder with separate settings/storage; pass R01-R06 before wider rollout |

Build the simulation tools incrementally in milestones 1-4 using the real
application modules, rather than a separate approximation of the scheduling
logic. Advance an injected clock to exercise the entire pickup-to-review journey
in minutes. Use fake external services by default; real Postgres integration
tests prove constraints and concurrent claims. Controlled provider delivery is
a separate milestone-5 mode restricted to explicit test recipients.

Settle delayed-email expiry, catch-up spacing, retry limits, and the enrollment
cutover in milestone 1; test their exact boundary values before launch.
Preparation always expires at pickup. Provide a basic status listing and a
visible warning for worker failures/stalled pending mail; a full dashboard can
wait. Preserve a record of each milestone's automated and joint review results.

Milestone 1 passed with Martin's explicit approval on October 21, 2026.
Milestone 2 passed on October 23: 74 local tests, 53 Postgres tests, and all
16 scenario reports (51 replay variants) pass. M2a then passed with the expanded
108-local/70-SQL suite; see [M2a evidence](docs/customer-follow-up/validation/milestone-2a.md).
Milestones 3-6 and production
enrollment remain pending. See [PMH settings](docs/customer-follow-up/pmh-launch-settings.md)
and [foundation evidence](docs/customer-follow-up/validation/milestone-1.md).

## Resume in a new chat

Use `C:\Users\Martin\Documents\GitHub\pmh-contentful-new` as the working
repository. This plan and its linked documents in PMH are the authoritative
handoff; `pcp-contentful-deployment` was the original planning workspace.
The unrelated Merrell CSS discussion is outside this project's scope.

Read these documents before continuing:

- [PMH settings and database setup](docs/customer-follow-up/pmh-launch-settings.md)
- [Milestones and scenario criteria](docs/customer-follow-up/milestones-and-testing.md)
- [Implemented test commands and module responsibilities](docs/customer-follow-up/testing-tools.md)
- [Milestone 1 approval](docs/customer-follow-up/validation/milestone-1.md)
- [Booking state implementation](docs/customer-follow-up/booking-state.md)
- [Milestone 2 completion evidence](docs/customer-follow-up/validation/milestone-2.md)
- [Series editing rules](docs/customer-follow-up/series-configuration.md)
- [M2a flexibility evidence](docs/customer-follow-up/validation/milestone-2a.md)
- [Authorized test-only email content](docs/customer-follow-up/pmh-draft-content.json)

As of October 23, milestones 1-2 are passed. S01 and S02 were reviewed with
Martin; S10 was demonstrated, and he delegated the remaining scenario execution
and requested a milestone-level summary. All automated checks passed afterward.
M2a flexibility passed before M3: 108 local tests, 70 Postgres tests, focused
lint, production build and 32 repeatable S/X reports. See its completion evidence.
The feature and schema changes remain uncommitted and undeployed. The later
Node and missing-record 404 deployments did not include this email-flow work.

Neon setup is complete; no new database is needed for PMH. The existing
`follow-up-test` branch is isolated from production. Public endpoint identities
are registered in `test/customer-follow-up/database-targets.json`; private test
credentials remain only in ignored `.env.follow-up-test.local`. The versioned
journey schema has been applied only to that test branch. Do not change live
schema, enable enrollment, add Cron or send customer follow-ups during M3.

**Next step:** Implement milestone 3: customer opt-out and small authenticated
staff stop/pause controls, including provider bounce/complaint suppression.
Run C01-C12 plus earlier regression checks. Present a brief architecture and
behavior summary when ready, rather than walking through every test separately.
The launch gate remains milestone 5, followed by five new PMH pickups with no
backfill and Martin monitoring replies/failures. Final content and the launch
cutover timestamp remain launch inputs.

Inspect Git status and preserve unrelated changes. Do not reset the repository
or assume every local file belongs to this feature. The inherited package name
does not identify the breeder; verify the PMH repository and environment.

Suggested first message in a new chat:

> Resume PMH customer follow-ups in
> `C:\Users\Martin\Documents\GitHub\pmh-contentful-new`. Read this project plan
> and M2/M2a completion evidence. After both gates pass, implement M3 opt-out and
> staff controls. Breeder-specific settings must stay in env. Run scenarios
> autonomously and report milestone-level architecture/progress. Keep production
> follow-ups disabled and preserve unrelated local work.
