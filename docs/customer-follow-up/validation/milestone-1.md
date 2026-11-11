# Milestone 1 evidence

Initial evidence: October 8, 2026. Current status: **passed**, approved October 21, 2026.
Implementation target: `C:\Users\Martin\Documents\GitHub\pmh-contentful-new`.
No production enrollment, optional email sends or live puppy changes performed.

## Completed

- Martin confirmed the active PMH repository, `hello@pmhpuppies.com`, direct Google
  review URL, placeholder technical-test copy and the recovery/DST policies.
- PMH identity, local scheduling settings and service-variable presence inspected;
  public settings documented without copying credentials.
- Vercel project/repository/domains verified. Node 22.x is selected; Calendly,
  Resend and Contentful variable names are present with values masked.
- Neon `pmh-follow-ups` created on Free in `iad1`, Auth disabled, connected to
  PMH Production only with sensitive `DATABASE_URL` credentials. Preview and
  Development excluded; no deployment or production database query performed.
- Five new PMH pickups with Martin monitoring replies/failures confirmed.
- Explicit configuration contract with disabled default and field-only errors.
- Controlled clock, independent signed synthetic fixtures, fake services, captured
  transport and network guard covering fetch and native network clients.
- Vercel-linked Neon account activated; project access verified. Created isolated
  schema-only `follow-up-test` branch, with a private ignored test environment
  file and independently registered test/production endpoint identities.
- Database guards reject production, different credentials, pooler aliases,
  unknown endpoints and query-parameter redirects before constructing a client.
- Real Postgres seed/read/reset rehearsal passed twice with identical reports;
  each run performs two cycles and leaves zero synthetic fixture rows. Dedicated
  test schema only; no database/schema-wide truncation or production SQL.
- CLI production-target negative check exits 1 with a sanitized refusal report.
- Added `pg` as a development dependency for the database rehearsal. No production
  route imports it yet. New follow-up code is consistently formatted.
- Node **24.19.0**: **14 tests passed**, zero failures or skips. Reports repeat
  identically; deliberately wrong CLI expectation exits 1 as required.
- Focused ESLint check passed on all new modules, test files and simulator script.
- F03 demonstrates a 24-day clock advance and one captured synthetic message.
  It is a harness demonstration, not evidence of the M2-M4 scheduling behavior.

## Gate status

| Criterion | Status |
| --- | --- |
| F01: PMH settings and authorized draft copy | Local inputs and deployed project/provider-variable presence verified; draft copy marked test-only; live credential validity deferred to M5 |
| F02: configuration/disabled default | Foundation tests pass; route integration belongs to subsequent milestones |
| F03: isolated fixtures and transport | Foundation tests pass; actual webhook route replay is added in M2 |
| F04: test storage/cleanup | Passed against the isolated Neon branch; repeatable narrow reset/seed verified; production rejected before connection; reports contain no credentials |
| F05: repeatability and failing assertions | Foundation tests pass |
| F06: policies/cutover/pilot | Recovery and DST approved; five new pickups with Martin monitoring confirmed; activation timestamp deferred until launch |
| Joint walkthrough | Passed with Martin on October 21, 2026 |

## Original pre-review requirements (resolved by the approval below)

Complete the foundation walkthrough with Martin and record his milestone review.
The synthetic F04 scenario proves the guard contract; the separate Postgres
rehearsal proves actual persistent seed/reset behavior. The customer journey
schema and scheduling boundary behavior are added in M2, and the real opt-out
path in M3; the M1 tools do not claim those flows are already implemented.
Confirm final customer-facing copy before
the M5 customer-send launch gate. Milestone 2 has not started.

## Walkthrough verification: October 21, 2026

Status: automated checks rerun successfully; presented for Martin's joint review.
The milestone is not marked passed until his review is recorded.

- Repository HEAD: `22949a947199cf77aa7a3942811621b2d8ae659f`, with uncommitted
  foundation files and unrelated local changes preserved. This is a working-tree
  verification; the HEAD alone does not contain all tested files.
- Runtime: bundled Node `24.19.0`. The default shell resolves Node `20.19.6`;
  checks explicitly used the existing bundled Node 24 executable without
  changing the machine's default runtime or installing anything.
- `node --test test/customer-follow-up/*.test.mjs`: 14 passed, zero failures,
  skips or cancellations.
- `node scripts/simulate-follow-up.mjs --scenario F03`: passed. The fixture clock
  moves from `2026-10-08T16:00:00.000Z` to `2026-11-01T16:00:00.000Z` (24 days).
  Exactly one synthetic message is captured for `customer@pmh.test`, with subject
  `Harness capture demonstration`. No customer message is submitted.
- The same demo with `--expect-captures 2` exits 1 and reports `1 !== 2`.
  This expected failure confirms that a wrong outcome cannot pass silently.
- `node scripts/check-follow-up-database.mjs --target-production` exits 1 with
  `Refusing production database target`, before a client is constructed.
- The isolated Postgres rehearsal passed twice with identical sanitized reports.
  Each run completes two reset/seed/read cycles and reports `rowsAfterReset: 0`.
  The initial sandboxed attempt could not connect; the same command passed with
  network access. No credential changes or production database access occurred.
- PMH's source scheduling defaults still identify `pawPrintsOnMyHeart`, the
  puppy-pickup event, `America/Detroit` and `support@pmhpuppies.com` as sender.
  Approved reply-to, review link, recovery policies and five-pickup pilot remain
  documented in `pmh-launch-settings.md`; those inputs were not changed here.
- Draft copy remains explicitly `approvedForLiveCustomers: false`. Live delivery,
  sender/inbox verification and final content approval remain M5 requirements.
- No follow-up module is integrated into application routes and no Cron
  configuration has been added. This walkthrough did not enable or deploy mail.

For this run, commands above used:
`C:\Users\Martin\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe`.
The database command additionally supplied `--env-file=.env.follow-up-test.local`;
that private file was loaded by Node and never printed or copied into reports.

The F03 demo proves clock/capture/isolation tooling. The signed fixtures are not
being replayed through the real Calendly route yet, and a captured demonstration
message does not prove stage scheduling or opt-out behavior. M2 adds real booking
state/scheduling, M3 adds customer/staff controls, and M4 adds sending/recovery.
Martin's review and the normal timeline/opt-out discussion remain the joint gate.

## Joint review completed: October 21, 2026

Martin explicitly approved: "Let's mark milestone 1 complete and get started on
milestone 2." The walkthrough covered PMH settings, the normal three-email
timeline, opt-out behavior, the five-pickup boundary, recovery policies, the 14
passing foundation tests and the guarded repeatable Postgres rehearsal. F01-F06
and the joint review are accepted for this foundation gate. Earlier pending
statements above are historical and superseded by this review.

The Node 24 upgrade was separately committed as `842f689` and Vercel reported a
successful deployment; live homepage/listing checks passed. Milestone 2 may now
proceed. Final copy, the activation timestamp and production enrollment still
belong to the later launch gate.
