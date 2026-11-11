# Milestone 2a: Configurable series foundation

Date: October 23, 2026. **Status: passed; ready for milestone 3.**
Martin explicitly requested this change before M3 and delegated testing.
M2's original three-stage completion evidence remains historical and unchanged.

## Delivered

Versioned env-selected definitions, normalized enrollment snapshots, generic
stage dates/IDs, shared reconciliation, current-config eligibility and durable
stop reasons. Migration 002 preserves immutable migration 001. Storage protects
sent/stopped rows. X01-X16 cover adding a fourth stage, removals, disabling,
versions, reschedules, cancellation, suppression, tenant isolation, concurrent
updates, empty series and retained/orphaned history. CLI reports are repeatable.
See [series editing instructions](../series-configuration.md).

## Verification

| Check | Result |
| --- | --- |
| Local follow-up suite | 108 passed; zero failures/skips (74 original plus 34 series tests) |
| Guarded real Postgres suite | 70 passed; zero failures/skips; all 51 original replay cases plus 16 series cases and 3 storage/migration checks |
| Existing scenario reports | S01-S16: 51 replay variants; refreshed and run twice with identical output |
| New series reports | X01-X16: all passed; refreshed and run twice with identical output |
| CLI dispatch/exit status | X01 exits 0/passed; unsupported X99 exits 1/failed |
| Focused follow-up ESLint | Passed |
| Production build | Passed with existing site warnings; changed follow-up modules compiled successfully |
| Migration safety | 001 unchanged; 001-002 checksum-verified rerun; forward upgrade from populated synthetic legacy tables preserves sent history |
| Test cleanup | Zero synthetic M2/M2a rows remain in the five application tables |
| Customer follow-up mail sent | Zero |
| Production schema/settings/deployment changed | None |

The first local build compiled but prerender failed because local env pointed
read requests at an absent localhost:3000 server. The successful rerun supplied
`ORIGIN_URL=https://www.pmhpuppies.com` and `FOLLOW_UP_ENABLED=false` only
for that command. No saved env file or Vercel setting changed. Existing warnings
include the sendSMS re-export, CSS compatibility, image lint and Browserslist data.

SQL used only the registered isolated Neon test branch. Tests cleaned their named
synthetic breeders. The populated forward-upgrade rehearsal used its own schema
inside a rolled-back transaction. No production SQL, truncation or branch reset
was performed. Reconciliation and rescheduling raced through the real production
repository and retained the stage stop/current dates.

Ignored JSON reports are in `.follow-up-reports/`; the build output is in
`build-series.log` in that directory. Code/docs remain uncommitted and undeployed.

## Remaining scope

Reconciliation is a tested shared entry point, with no public route or automatic
deployment hook. M4 must wire it into the worker/deployment workflow, render the
configured content and recheck settings after claims before provider submission.
D19-D20 retain those delivery-specific gates; M2a does not claim provider sends or
claim races are tested. Customer opt-out pages and staff interfaces remain M3.

Resume M3 on this configurable foundation. Keep production enrollment, Cron and
customer follow-up delivery disabled until the separate M5 launch gate.
