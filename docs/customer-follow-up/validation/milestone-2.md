# Milestone 2 evidence

Initial evidence: October 21, 2026. Completed: October 23, 2026.
Status: **passed**; milestone 3 is ready to start.
Milestone 1 was explicitly approved by Martin.

Repository: `C:\Users\Martin\Documents\GitHub\pmh-contentful-new`.
Current website base: `ea1e780` (the independently deployed 404 fix).
All email milestone code/documents remain uncommitted working-tree
changes. Unrelated local edits are preserved. Runtime: Node 24.22.1.

## Delivered and verified

- Versioned/checksummed schema applied only to the isolated Neon test branch.
- Per-breeder journeys, invitee links, unique stages, event receipts and suppression.
- Calendar-day scheduling/expiry with first repeated time and next-valid gap time.
- Atomic duplicate/cohort handling; sent/stopped history preserved.
- Shared production Calendly handler with injected services for signed replay.
- Durable state hook before notification-specific early exits.
- CLI scenarios S01-S16 with 51 independently asserted variants.
- Existing `pg` driver promoted from dev-only to production for the server route.
- Focused module descriptions and state/migration rules in
  [booking-state.md](../booking-state.md).

## Results

| Check | Outcome |
| --- | --- |
| `npm run test:follow-up` | 74 passed October 23; zero failures/skips: 14 foundation checks, 51 replay cases, seven date/eligibility checks and two breeder-configuration regressions |
| S01-S16 reports | 16 passed October 23; all 51 variants; every report refreshed and compared with an identical second replay |
| `npm run test:follow-up:scheduling-database` | 53 passed October 23; zero failures/skips: all 51 replay cases on real Postgres, storage constraint/rollback/isolation test, and final cleanup check |
| Migration rerun | Same checksum accepted twice without recreating tables or resetting records |
| SQL cleanup | Zero `synthetic-m2-*` rows remain in journeys/messages/bookings/receipts/suppression tables |
| `npm run lint` | Passed with existing site image/Hook warnings |
| Focused ESLint for follow-up modules/tests/CLI | Passed October 23, including the new configuration-reuse tests |
| Production build | Passed on Node 24.22.1 using a process-only reachable PMH origin |
| Built production server smoke | Homepage 200 with PMH branding; actual webhook route rejects invalid signature with 401; temporary server stopped |

Reports: `.follow-up-reports/S01.json` through `S16.json` (ignored, synthetic
data only). The real DB runner checks the independently registered test endpoint
before creating a pool. Existing M1 production/alias guard regressions still pass.

The initial 47-test SQL suite and five added ordering/stop regressions passed
during development. A final combined 53-test run passed after the delayed-event
fix and formatting. The final schema remains on branch `follow-up-test`
(`br-rough-sun-b8gp434w`), project `steep-flower-70030380`.

## Scenario coverage

| IDs | Tested outcomes |
| --- | --- |
| S01-S04 | Normal dates; exact short-notice boundaries; preparation at/after pickup expires; DST fold/gap, year/month ends, leap day and fractional-hour zone |
| S05-S06 | Visit/unknown/pre-cutover/history exclusions; five-pickup limit; disabled mode; invalid/stale signatures, malformed/null JSON, missing identity/date and unmatched puppy |
| S07-S09 | Concurrent/repeated events create one journey/three stages; already-scheduled notification exit still enrolls; earlier/later/inside-window moves; sent stage retained |
| S10-S11 | Both reschedule orders; replacement before original webhook; A-B-C late/duplicate events; refreshed invitee's later replacement holds old schedule |
| S12-S13 | Cancellation before/after earlier stages; cancellation before creation; ordinary cancellation of a replacement never becomes another reschedule |
| S14 | Calendly/puppy/database/notification failures and replay; missing replacement details held; ancestor outage retains an existing hold |
| S15-S16 | Real uniqueness, rollback, new-client persistence, breeder isolation; pickup assumed after latest date; later reschedule, staff no-show and suppression block inappropriate eligibility |

Two additional tests deliberately failed before their fixes: cancellation before
creation initially returned 500, and a refreshed forward replacement initially
left the old booking active. Their regression cases now pass in both adapters.

The build retains the previously observed `sendSMS`, CSS/Browserlist, image/Hook,
dependency-deprecation and caught dynamic-rendering notices. The public origin
override fixes local self-fetch connectivity for the build; saved env files and
page-fetching code were not changed.

## Joint review progress

October 23, 2026: S01 was rerun successfully and Martin accepted the normal
booking schedule: "Yes, that looks right. Let's move on to S02." One active
journey and three pending stages were inspected; no follow-up mail was sent.

S02 was rerun successfully on October 23 (all four short-notice/boundary variants).
Martin accepted its timing and requested S10. The preparation cutoff at pickup
and one journey/three stages after duplicate delivery were also inspected.

S10 was demonstrated with all three arrival orders producing the same active
schedule. Martin then requested: "Go ahead and run the rest of your tests, I
don't think I need to review each one. let me know when you are ready for the
next milestone." The remaining S13/S14 walkthroughs were therefore delegated,
and the full local, report/repeatability, lint and isolated Postgres checks above
were completed successfully. No additional per-scenario approval is outstanding.

## Configuration audit and goal alignment

- Pickup scheduling enrolls the flow; visits and pre-cutover bookings do not.
- Cancellation, rescheduling, late/duplicate events and preserved sent history
  pass both local replay and real Postgres checks.
- Breeder identity, sender/reply address, origin, timezone, pickup event, review
  URL, content-selection key, provider credentials and DB connection are required
  env settings. Missing values fail instead of adopting PMH settings.
- Two additional local tests prove a second synthetic breeder uses its explicit
  profile/timezone and that stops for the same customer stay scoped by breeder.
- Legacy website booking defaults remain separate; no fallback was added to the
  reusable follow-up modules. Actual second-breeder rollout remains M6.

M2 is complete. M3 builds the customer opt-out page, staff controls and provider
suppression handling. M4 adds sending, claims and recovery; neither milestone's
delivery or interface requirements are claimed complete by these scheduling tests.

All synthetic M2 rows were cleaned from the isolated test DB. No production
schema, feature setting, Cron or customer mail changed. No email milestone
commit/deployment was performed. Enrollment stays off until the M5 launch gate.
