# Follow-up testing tools

Run from `C:\Users\Martin\Documents\GitHub\pmh-contentful-new` on Node 24.
Milestones 1-2 passed. Milestone 3 (opt-out/staff controls) is ready to start;
follow-up delivery remains M4. M2 originally passed 74 local and 53 SQL tests;
M2a passed the expanded 108-local/70-SQL suite, lint and production build.
See [its evidence](validation/milestone-2a.md).

## Main commands

```powershell
npm run test:follow-up
npm run follow-up:simulate -- --list
npm run follow-up:simulate -- --scenario S01 --report
npm run follow-up:simulate -- --scenario S02 --report
npm run follow-up:simulate -- --scenario S10 --report
npm run follow-up:simulate -- --scenario S13 --report
npm run follow-up:simulate -- --scenario S14 --report
npm run follow-up:simulate -- --scenario X01 --report
npm run follow-up:simulate -- --scenario X05 --report
npm run follow-up:simulate -- --scenario X14 --report
npm run test:follow-up:scheduling-database
```

The ordinary test command runs fast foundation, actual-handler replay and date
boundary tests without network access. It does not silently run or claim the
opt-in Postgres suite; run the separate database command for that gate.

The S01-S16 simulator covers the variant checklist using production handler,
signature verifier, scheduling and booking modules with a memory adapter. It
captures existing admin/fax/confirmation calls, stubs Calendar and puppy services,
and never sends follow-up mail. It cannot prove SQL locking/constraints; the real
Postgres command repeats the cases with production persistence and extra storage
checks. Reports show expected zero follow-up emails because M4 is not implemented.

`--report` saves deterministic JSON in ignored `.follow-up-reports/`.
M2 reports cover 51 variants; M2a adds X01-X16 series-configuration reports. Running the same scenario twice yields
identical JSON. Reports contain synthetic addresses/data, not live credentials.

## Foundation demonstrations

```powershell
npm run follow-up:simulate -- --scenario F03 --report
npm run follow-up:simulate -- --scenario F04
npm run follow-up:simulate -- --scenario F03 --expect-captures 2
npm run test:follow-up:database
npm run test:follow-up:database -- --target-production
```

F03 advances a clock 24 days and captures one demonstration message. It is not
the three-email sender or real templates. The deliberate expectation of two
messages exits 1. F01/F06 were accepted through joint review, not a synthetic
scenario claiming to approve PMH settings automatically.

Synthetic F04 tests the target-guard contract. Its separate Postgres command
performs two reset/seed/read cycles in the M1 fixture table and leaves zero fixture
rows. `--target-production` intentionally exits 1 before constructing a client.

## Storage isolation

The private test connection is in ignored `.env.follow-up-test.local`, as
`FOLLOW_UP_TEST_DATABASE_URL`. Database commands explicitly load that file;
they never fall back to ambient production `DATABASE_URL` or read `.env.local`.

Registered public identities are in `test/customer-follow-up/database-targets.json`.
Guards compare endpoint/database identities independently of passwords/users,
reject production aliases, unknown endpoints and query-parameter redirects,
require the approved direct test endpoint and verify its TLS certificate.

The runner applies migrations 001-002 twice on the test branch. A rolled-back
transaction proves an upgrade from populated legacy tables. It
cleans only its exact, prefix-validated synthetic breeder IDs in its own tables,
never truncating a schema/database or copying/resetting from production. The M1
fixture table remains separate. Test errors must never print private environment
files or connection URLs.

## Code and business flow

See [booking-state.md](booking-state.md) for module responsibilities, stored
states, ordering rules and the migration boundary. M1 harness helpers remain in
`test/customer-follow-up/support/harness.mjs`; real SQL rehearsal helpers are in
`support/database.mjs`. M2 adds `scheduling-environment.mjs`,
`scheduling-scenarios.mjs` and a small `memory-repository.mjs`.

Future sender/worker modules must use the same injected-clock and capture
contracts. No public clock, seed/reset or arbitrary-send endpoint is exposed.
No application route automatically migrates a database.

## Completed Milestone 2 walkthrough

1. S01: inspect one journey and its three UTC dates.
2. S02: see immediate preparation eligibility for short notice, and expiry at pickup.
3. S10: compare old-cancellation-first and replacement-creation-first outcomes.
4. S13: cancel a replacement; remaining stages stop despite its old-invitee link.
5. S14: see state survive a captured notification failure, then replay safely.

S01/S02 were reviewed, S10 was demonstrated, and Martin delegated the remaining
scenario execution on October 23. See [M2 completion evidence](validation/milestone-2.md).
Future reviews use concise milestone-level summaries; all automated cases remain required. Customer opt-out/staff pages, actual sending,
retry/claim races and deployed provider checks are later milestone gates.

The configuration-reuse tests also exercise an explicitly configured second
synthetic breeder, a different timezone, missing-env rejection, and independent
customer stops. They are local tests, not a second breeder production rollout.

## M2a series simulation

X01-X16 use the real validator, pinned journey, reconciliation and eligibility
modules. See [series editing rules](series-configuration.md) and the milestone
checklist for expected outcomes. The SQL suite repeats those cases and checks
migration/constraint/history safety. Claims and sends remain M4. No public test
endpoint or additional service was introduced.
