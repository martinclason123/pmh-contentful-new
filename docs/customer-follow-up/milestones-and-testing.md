# Customer follow-up: milestones and testing

Status: Milestone 1 passed with Martin's approval on October 21, 2026.
Milestone 2 passed October 23: 74 local and 53 Postgres tests pass.
M2a passed October 23 before M3: 108 local and 70 SQL tests, focused lint,
production build and 32 deterministic S/X reports. See [M2a evidence](validation/milestone-2a.md).
Milestones 3-6 remain pending. See [M2 evidence](validation/milestone-2.md).
First pilot: **PMH Puppies**. Owner for joint milestone review: Martin.

Use alongside [the project plan](../../CUSTOMER_FOLLOW_UP_PROJECT.md) and
[the single MVP flowchart](https://www.figma.com/board/HosfTJ0a10eRVFLcyq2NDy/Email-Logic-Flow-Chart?node-id=18-139).

## How we work through each milestone

1. Build only the current milestone's deliverables and associated tests.
2. Run its scenario checklist plus regression tests for completed milestones.
3. Provide a concise milestone-level architecture and behavior summary; use
   synthetic walkthroughs when useful, without requiring review of each test.
4. Record results, open issues and Martin's review/delegation in the evidence.
5. Advance after the gate passes. Production enrollment requires the separate
   PMH launch review in milestone 5.

For every scenario below, verify both stored state and external effects: which
messages were created, moved, sent, held or suppressed, and why. A successful
HTTP response alone is insufficient. Where a row lists variants, exercise and
report each variant independently. Unexpected recipients, duplicate emails,
unexplained state changes or unresolved delivery outcomes fail the gate.

Milestones begin **pending**. A planned simulation is not a passing test.

## Simulation tools to build

Build a small command-line harness first; an interactive dashboard is unnecessary
for the MVP. Extend it as the production modules become available.
The foundation commands are now available; full journeys and database integration
are added in subsequent milestones. See [tool usage](testing-tools.md).

| Tool | Required behavior | Introduced |
| --- | --- | --- |
| Scenario runner: `follow-up:simulate --scenario <id>` | Seed synthetic data, perform events, advance time, invoke real business logic and report expected versus actual state and captured emails; exit nonzero on failure | M1 scaffold; M2-M4 implementations |
| Controlled clock | Set and advance time without sleeping; schedule calculation and worker eligibility use the same injected clock; production uses real time | M1 |
| Event fixtures and replay | Generate signed booking/cancel/reschedule payloads; reorder, duplicate and delay events; stub Calendly resource lookups and puppy data | M1 fixtures; M2 route tests |
| Captured email transport | Save rendered messages, intended recipients, reply-to, links and idempotency keys; simulate acceptance, rejection and uncertain outcomes without network sends | M1 interface; M4 behavior |
| Isolated Postgres tests | Apply real migrations to a test database, test constraints/transactions and concurrent claims, reset only synthetic test records | M2; expanded M4 |
| Failure and race controls | Pause after claim/before provider submission, inject schedule/stop changes, interrupt a worker, and fail database or provider operations | M2 failures; M4 races |
| Full journey: `follow-up:simulate --journey normal` | Replay booking through preparation, pickup, check-in and review; produce a readable timeline and captured email previews | M4 |
| Regression run: `test:follow-up` | Execute all implemented scenario variants deterministically, including Postgres integration tests; separate configuration failures from test failures | M1 onward |
| Evidence report | Include scenario ID, fixture/config version, simulated time, expected/actual records, send counts and pass/fail; omit secrets and use synthetic personal data | Every milestone |

The harness must call the same scheduling, eligibility, persistence and sending
modules as the application. Do not implement a second scheduler for the demo.
Use a small in-memory adapter for fast rule tests only; it cannot prove database
locking or uniqueness. Test those using actual Postgres.

Simulated webhook tests must also fake existing confirmation emails, breeder
notifications/faxes, Calendly and Contentful calls. They must not modify live
puppy records or contact existing customer/admin recipients. Test fixtures and
database credentials must be visibly distinct from production.

Clock controls belong in local tests. Do not expose an unauthenticated clock,
seed/reset endpoint or arbitrary send endpoint in production. Deployed rehearsals
use test storage and controlled due records; the public production worker uses
real time. Test cleanup must refuse a production database.

## Milestone 1: PMH setup and test foundation

**Deliverables:** Identify the PMH repository and Vercel project; document PMH's
breeder ID, domain, time zone, pickup event type, sender, reply inbox, puppy data
source, review URL and content. Confirm the Neon integration/plan and separate
test versus production connections. Add the harness foundation, fixtures, fake
clock and email capture contract. Production follow-ups remain disabled.

The original planning workspace defaults to Peaceful Country Pets; executable
implementation lives in `pmh-contentful-new`. Do not assume another breeder's
defaults or service credentials belong to PMH. Verify the target before deployment.

Decide together before scheduling implementation:

- Exact enrollment cutover: which newly created pickup bookings qualify. Existing
  customers and old bookings are excluded; no automatic backfill.
- Check-in/review expiry windows and catch-up spacing so an outage cannot release
  several old stages at once. Preparation always expires at pickup.
- Retry attempt/time limits, treatment of confirmed permanent failures, and the
  operator action for ambiguous sends beyond the provider's idempotency window.
- DST handling for an ambiguous or nonexistent local due time. Calendar-day
  offsets must preserve local pickup time wherever that time exists.
- Controlled test recipients, PMH pilot cohort size and named person monitoring
  failures/replies. Dates and limits remain launch inputs, not invented defaults.

| ID | Scenario | Passing outcome |
| --- | --- | --- |
| F01 | PMH settings and content | Correct PMH branding, pickup event, time zone, sender, reply inbox and review link; no silent fallback to PCP; authorized draft food/crate/checklist copy is marked test-only, with final approval required in M5 |
| F02 | Missing/invalid enabled configuration | Clear actionable error; zero email attempts; disabled mode does not enroll or send follow-ups |
| F03 | Synthetic scenario isolation | Clock advances instantly; external calls are captured/stubbed; no real customer mail, fax or live puppy changes |
| F04 | Test storage and cleanup guard | Test records can be reset repeatably; reset/seed refuses a production connection; credentials are absent from reports |
| F05 | Repeatability | Same fixture and clock produce the same report and assertions after reset; a deliberately wrong expectation fails the run |
| F06 | Policies and rollout boundary | Cutover, expiry, spacing, retry and DST decisions have concrete values/rules with boundary fixtures; PMH remains disabled |

**Joint review:** Walk through the normal timeline and one opt-out example using
the fixtures. Review PMH settings and policy decisions. Gate: F01-F06 pass and
the target deployment is verified.

## Milestone 2: Booking state and scheduling

**Deliverables:** Versioned schema/migrations, pickup journeys, three stage records,
customer suppression state and event receipts. Integrate the signed Calendly
webhook before its notification-specific early returns. Add timezone-aware date
calculation and replay scenarios. External sends remain captured.

| ID | Scenario | Passing outcome |
| --- | --- | --- |
| S01 | Normal future pickup | One journey and three stage records; preparation at -3 calendar days, check-in at +7 and review at +21; correct local time and UTC storage |
| S02 | Short notice and exact boundary | Book inside three days, exactly at the preparation due time, just outside the window, and just before pickup; preparation becomes immediately eligible only when due, is saved before an attempt, and never duplicates |
| S03 | Pickup time already passed / preparation delayed past pickup | No preparation send; delayed old booking does not bypass the enrollment cutover; post-pickup handling follows the agreed policy |
| S04 | Timezone/date boundaries | Spring/fall DST, month/year end and leap day; calendar-day offsets and local-time policy hold, rather than assuming every day is 24 hours |
| S05 | Enrollment exclusions | Visit, unknown event type, pre-cutover booking and historical replay do not enroll; eligible newly booked pickup does |
| S06 | Invalid webhook/input | Missing/bad/stale signature, malformed JSON, missing email/chip/date or unmatched puppy cannot create a sendable journey; error or ignored reason is visible |
| S07 | Duplicate booking events | Repeated and simultaneous delivery of the same event creates one journey and one record per stage; notification early exits do not prevent legitimate enrollment |
| S08 | Reschedule earlier and later | One linked journey; every unsent date follows the latest pickup; old dates are ineligible; moving inside the preparation window makes unsent preparation due now |
| S09 | Reschedule after a stage was sent | Sent stages remain sent and are not recreated; only unsent stages move; current pickup controls remaining follow-ups |
| S10 | Both reschedule arrival orders | Old cancellation first and replacement creation first lead to the same current schedule; old schedule is held while replacement details are missing |
| S11 | Repeated/late reschedule events | A to B to C with duplicates and late A/B cancellation or creation does not revert C or cancel it |
| S12 | True cancellation at every stage | Cancel before preparation, between preparation/check-in and between check-in/review; remaining stages stop while sent history remains |
| S13 | Cancel the replacement booking | Ordinary cancellation of a replacement stops it even though it has an old-invitee link; it is not mistaken for another reschedule |
| S14 | Integration failures and replay | Calendly/Contentful unavailable, incomplete replacement details, fax/confirmation failure or database write failure cannot lose acknowledged scheduling state; retry completes safely without duplicate enrollment |
| S15 | Storage correctness | Clean migration, unique stage constraint, durable event receipts and restart/reload preserve dates and history; rerunning migration is safe |
| S16 | Pickup assumption | Passing the latest pickup time requires no affirmative staff confirmation; a later date, cancellation or recorded no-show prevents inappropriate post-pickup eligibility |

**Review completed October 23:** S01/S02 reviewed, S10 demonstrated, and Martin
delegated remaining scenario execution. S01-S16, foundation regressions and real
Postgres checks pass. See the M2 evidence; M3 is ready to start.

## Milestone 2a: Configurable series foundation

**Required before M3.** Introduce env-selected versioned definitions, normalized
journey snapshots, generic stage IDs via migration 002, current-config eligibility
and shared reconciliation. No sender or live enrollment is introduced here.

| ID | Passing outcome (memory and real Postgres) |
| --- | --- |
| X01 | Fourth email and cancel-first reschedule: four unique records and correct due/expiry dates |
| X02 | Fourth email and create-first reschedule: same result despite late cancellation |
| X03 | New stages/timing affect new journeys; enrolled journeys keep their rules through reschedule |
| X04 | Env disable blocks eligibility immediately; reconciliation is durable; re-enable/reschedule cannot revive stopped mail |
| X05 | Remove a stage: preserve a stopped history row and omit new enrollment; repeatable reconciliation |
| X06 | Definition enabled=false blocks old versions and omits new messages |
| X07 | Cancellation and sent history survive version changes |
| X08 | Staff journey stop survives reconciliation |
| X09 | Customer suppression blocks pending work and new enrollments on another series |
| X10 | Held reschedule retains a disabled-stage stop after replacement and duplicates |
| X11 | Empty series stops old pending stages and creates no new messages |
| X12 | Expiry-policy edits do not rewrite enrolled expiry windows |
| X13 | Another breeder remains unchanged |
| X14 | Concurrent reconciliation/rescheduling preserve latest dates and the stage stop |
| X15 | Removing a sent stage preserves its entire history |
| X16 | Orphaned pending row stops with a reason; history retained |

Also reject duplicate/unsafe IDs, unknown template keys, malformed timing/expiry
or flags, missing selection and invalid disabled-stage syntax. Check exact
zero-day expiry during a repeated DST hour, populated forward migration,
checksum-verified rerun, unique stage IDs, rollback and zero synthetic rows.

Gate: X01-X16 plus earlier F/S regressions, focused lint and production build.
Evidence: [M2a](validation/milestone-2a.md). Keep the schema test-only.

## Milestone 3: Customer opt-out and staff controls

**Deliverables:** Signed stop links, minimal stop page and POST, persistent
customer suppression, small authenticated staff stop/pause interface and basic
status listing. Do not build a full admin dashboard. Add provider suppression
handling and its signature verification; delivery integration is tested again in M4.

| ID | Scenario | Passing outcome |
| --- | --- | --- |
| C01 | Easy stop page | Every template offers Do not email me again; page needs no login, email entry or reason; one button saves and shows success |
| C02 | Stop at each stage | Opt out before preparation or after either earlier email; every remaining stage and retry is blocked immediately, independent of the next Cron run |
| C03 | Scanner and repeated requests | GET/prefetch alone does not suppress; valid POST does; repeated POST is harmless and confirms the saved state |
| C04 | Invalid/tampered link or save failure | Invalid signature does not alter preferences; failed save shows an honest failure and can be retried, rather than claiming success |
| C05 | Rebooking and rescheduling after opt-out | Suppression survives replacement events, fresh pickup booking and deployment/restart; never silently re-enables the customer |
| C06 | Customer preference scope | Trimmed/case-normalized email matches the agreed normalization rule; multiple PMH pickup journeys for that customer stop; unrelated customers and other breeders are unaffected |
| C07 | Staff stop and no-show | Mistaken pickup or no-show stops the journey; linked reschedules cannot clear that stop; unrelated journeys remain eligible |
| C08 | Breeder pause/resume | Pause holds all due sends, including immediate preparation and retries; resume retains opt-outs and applies expiry/catch-up rules without a stale-email burst |
| C09 | Staff authorization | Unauthenticated/unauthorized stop, resume and status requests are denied; valid staff actions work and record who changed what |
| C10 | Reply requests and transactional messages | Staff can honor Do not email me again received by reply; suppression stops optional follow-ups while existing booking/payment messages still behave normally |
| C11 | Provider bounce/complaint | Verified permanent bounce or complaint suppresses future follow-ups; duplicate events are harmless; invalid provider signature cannot change state; temporary failures follow retry rules |
| C12 | Control persistence and history | Stops, pause and suppression survive restart; staff can see held/stopped reasons and sent history; clearing a breeder pause cannot clear customer opt-out |

**Joint review:** Use the customer page on desktop/mobile, demonstrate scanner GET
versus button POST, then staff stop and pause/resume. Gate: C01-C12 plus F/S
regression pass. Race checks are required in milestone 4 once a worker exists.

## Milestone 4: Worker, templates and delivery recovery

**Deliverables:** Consume the M2a definitions and enrolled snapshots. Wire
reconciliation into the worker/deployment workflow and recheck current config
before every submission. Build rendering for validated template/content keys.
Hourly worker, one shared sender used by the short-notice path,
atomic claims/leases, send-time checks, rendered templates, durable provider
outcomes and bounded retries. Complete the simulated 24-day-plus journey and
failure controls. Test default transport remains fake; no production enrollment.

| ID | Scenario | Passing outcome |
| --- | --- | --- |
| D01 | Full normal journey | At the exact due times all three stages send once in order; no early sends; no positive pickup confirmation needed; later runs send nothing after completion |
| D02 | Hourly due boundaries and empty queue | Run just before/at/after each due time; only eligible records send; empty run exits without Calendly/Contentful polling; normal hourly delay is at most one interval when services are healthy |
| D03 | Immediate preparation and worker overlap | Short-notice booking attempts after saving; immediate sender and hourly worker racing claim one stage, producing one provider submission |
| D04 | Templates and recipients | PMH sender/reply-to/content/review URL, escaped customer/puppy text, working visible opt-out and plain-text alternative; no unrelated recipients; negative/no check-in response does not gate review requests |
| D05 | Duplicate invocations and concurrent workers | Repeated runs, two workers and duplicate webhook requests cannot concurrently submit the same stage; assert provider capture count and real database claims |
| D06 | Schedule/stop changes after claim | Inject reschedule, cancellation, opt-out, staff stop, no-show and pause after claim but before final send check; old/blocked stage is not submitted and is released or suppressed appropriately |
| D07 | Expired preparation and stale schedule version | Preparation reaching pickup, a replaced schedule version or a stage already sent is skipped; unsent current schedule remains available when appropriate |
| D08 | Confirmed temporary failure | Rate limit, temporary server failure and definite connection failure before submission retry with bounded attempts/backoff and a stable rendered request/key; eventual acceptance records one send |
| D09 | Confirmed permanent failure | Invalid recipient/request/configuration failure does not loop indefinitely; message outcome and actionable reason are visible; recipient suppression applies where appropriate |
| D10 | Uncertain provider outcome | Simulate accepted request followed by lost response; no blind fresh-key resend; reuse the same request/key within the supported window or reconcile; beyond the window hold for review |
| D11 | Provider accepted but recording failed | Provider acceptance followed by DB failure/restart cannot cause a fresh duplicate submission; durable attempt state supports same-key recovery or review |
| D12 | Worker crash and expired lease | Crash before submission releases recoverable work after lease expiry; crash during/after submission is treated as uncertain, not permission for unconditional resend |
| D13 | Failed worker/Cron/database | Missed invocation, DB outage or suspended compute leaves pending work intact and becomes visible; a later successful run recovers eligible work without assuming Cron itself retries |
| D14 | Long outage and overdue stages | Recovery after multiple due dates skips expired stages and enforces the chosen spacing; no late preparation or burst of three emails |
| D15 | Worker and deployment safety | Missing/wrong worker secret is denied; disabled feature and test mode cannot send real customer mail; persisted history and suppression survive deployment |
| D16 | Send already submitted when stop arrives | Stop blocks future submissions; UI/logs do not promise to recall mail already accepted/in progress; record that outcome honestly |
| D17 | Multiple journeys and batch progress | Different puppies/customers remain independent; same customer with two genuine pickups has separate journey history; one failing message cannot starve the rest; bounded batch resumes remaining work |
| D18 | Retry versus customer/provider stop | Opt-out, permanent bounce or complaint between attempts prevents the next submission; reordered/duplicate provider events cannot turn suppression off or regress a confirmed sent state |
| D19 | Deliver a configured additional stage (M2a regression plus sender) | Add a fourth stage using only a definition and template/content; no scheduler/sender branch or further schema change. Verify due time, expiry, rescheduling, one send, and independent breeder selection. Invalid IDs, duplicate IDs, unknown templates and missing/invalid series settings fail safely before enrollment or sending |
| D20 | Disable/remove stages during delivery (M2a regression plus claims/retries) | Disabling blocks existing pending work, including a claim before its final send check, and preserves sent history. Retain referenced versions; removal cannot orphan pending work. New entries/timing edits affect new enrollments by default; existing journeys retain their version unless explicitly reconciled. Re-enabling/version changes cannot resend sent stages, clear opt-outs, revive canceled/stopped journeys or backfill historical stages |

**Joint review:** Advance a normal booking through all stages, then run a race,
uncertain send, expired lease and outage recovery. Inspect captured messages and
counts together. Gate: D01-D20 and all earlier scenarios pass, including Postgres
concurrency tests; lint/build and relevant automated checks pass.

## Milestone 5: Deployed PMH rehearsal

**Deliverables:** PMH test deployment with separate storage, allowlisted test
recipients and verified test puppy/service configuration. Run deployed routes and
real Resend delivery under controlled conditions. Verify actual hourly Cron;
simulate the long customer timeline locally and seed due test records for deployed
checks instead of speeding up production time. Prepare the launch/stop runbook.

| ID | Scenario | Passing outcome |
| --- | --- | --- |
| P01 | Deployed Calendly create/change/cancel | Controlled pickup booking and both changes reach the PMH webhook with verified signature; correct puppy/journey and state; visits remain excluded |
| P02 | Actual Cron and immediate path | Observe a scheduled hourly invocation and a short-notice attempt; worker authentication and outcomes visible; no dependency on a local process |
| P03 | Real email delivery | Allowlisted recipients receive all three templates; check desktop/mobile readability, links, sender, reply routing, review destination and spam/delivery status |
| P04 | Deployed opt-out and staff stops | Valid signed link saves without login; scanner GET does nothing; saved preference blocks a subsequent due record; staff stop and pause/resume work |
| P05 | Recipient/data isolation | A non-allowlisted recipient is blocked in rehearsal; test storage is distinct; related confirmation/fax actions also target approved test destinations or are stubbed |
| P06 | Status and failure recovery | Failed/stalled records and last worker result are visible; operator can diagnose retry versus manual review and demonstrate a pause and safe recovery |
| P07 | Full scenario regression | F/S/C/D reports pass against the release candidate; walkthrough covers normal, short notice, reschedule, cancellation, opt-out and outage outcomes |
| P08 | PMH launch review | Approved copy/policies, verified production settings, separate production DB, enrollment cutover, monitoring owner, test-mode removal and stop/rollback steps documented; Martin agrees to the initial customer cohort |

**Joint review:** Inspect actual inbox messages and database state together. Test
the kill switch before enabling customer mail. Gate: P01-P08 pass, with recorded
PMH launch approval. Keep other breeders disabled.

## Milestone 6: PMH live pilot and breeder reuse

**Deliverables:** Enable only the agreed new PMH pickups; monitor scheduling,
delivery, opt-outs, failures and database usage. Keep cohort membership stable
through rescheduling. Complete the first real pickup-to-review cycle before
widening to other breeders. Prepare the second breeder as an isolated rehearsal.

| ID | Scenario | Passing outcome |
| --- | --- | --- |
| R01 | Production enrollment boundary | Only eligible new PMH pilot bookings enroll; old customers, visits, out-of-cohort bookings and other breeders stay out; rescheduling retains cohort eligibility |
| R02 | Actual three-stage lifecycle | Observe a real pilot through preparation, +7 check-in and +21 review with matching timestamps/recipients and no duplicates; simulated success alone is not completion |
| R03 | Live operating evidence | Monitor failures, stalls and available usage; no unexplained sends or unresolved delivery outcomes; customer requests are honored and replies reach the monitored inbox |
| R04 | Stop and deployment recovery | Demonstrate authorized breeder pause; stopping further sends preserves preferences, schedule and history; recovery applies latest dates/expiry rules; rollback does not drop suppression |
| R05 | Second breeder reuse | Same implementation/migrations with a different database and configuration passes the same regression/rehearsal; branding/review links/time zones are correct and cross-breeder customer data/opt-outs stay isolated |
| R06 | Expansion review | Review PMH's complete lifecycle, incident handling and second-breeder rehearsal together; approve each remaining breeder's inputs and launch before enabling it |

**Joint review:** Examine PMH's actual pilot outcomes and issues. Gate: R01-R04
finish the PMH pilot; R05-R06 are required for wider rollout. No need to wait
weeks during implementation tests, but the final live pilot includes a real cycle.

## Evidence and completion records

Add a short record per milestone under `docs/customer-follow-up/validation/` as
work completes. Include the code revision, environment, scenario variants/results,
report paths, redacted screenshots or synthetic email previews, known issues and
joint review date/outcome. Never commit real customer payloads or credentials.

For each milestone track: **pending -> in progress -> ready for joint review ->
passed**. A blocked launch input is listed explicitly; untested scenarios remain
pending. Code quality, understandable comments, formatting and documentation from
the project plan are part of each gate, not a final cleanup milestone.
