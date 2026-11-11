# Editing the follow-up series

Implemented as M2a before M3. Rendering, delivery and worker wiring remain M4.
Production follow-ups remain disabled.

## Configuration and versioning

Shared definitions live in `src/lib/customer-follow-up/series-definitions.mjs`.
Each breeder's required `FOLLOW_UP_SERIES_KEY` selects one. PMH starts with
`standard-v1`. Branding, timezone, content-set selection and credentials remain
in env; shared definitions contain no breeder identity or secrets.

Copy a published definition to a new version key, edit its entries, run tests,
then select the key in the breeder's env and deploy. Keep old definitions for
reference; journeys also store a self-contained normalized snapshot. There is
no editing UI in this MVP.

## Add an email

Add an entry to the new definition, for example:

```js
{
  id: "first-month",
  enabled: true,
  offsetDays: 30,
  template: "update",
  contentKey: "first-month",
  expiry: { anchor: "due", days: 7 },
  requiresPickup: true,
  sendImmediatelyIfDue: false,
}
```

Offsets and expiry use calendar days in the breeder timezone. Negative offsets
are before pickup. Expiry is relative to pickup or due time. Standard check-in
and review entries resolve the existing expiry-policy env values at enrollment;
new stages can use a numeric window. `sendImmediatelyIfDue` marks eligibility
for the future immediate send path, without bypassing due/expiry or stop checks.

Supported template keys define the M4 renderer contract: `preparation`,
`check-in`, `review`, `update`. Rendering is not implemented yet.
A stage using a supported layout needs an entry and matching content in the
breeder's selected content set. A new layout needs a renderer, but no scheduling
branch or database migration.

IDs start with a lowercase letter and contain lowercase letters, digits and
hyphens (maximum 64 characters). Never reuse an ID for a different email.
Validation rejects duplicate IDs, unknown template keys, missing flags and invalid
timing/expiry. Empty series are allowed and create no messages.

## Remove or disable an email

Remove its ID or set `enabled: false` in the new selected definition. To block
an ID independently, use the optional comma-separated env value
`FOLLOW_UP_DISABLED_STAGES=check-in,first-month`; unset/blank adds no blocks.
All three forms block that ID across previously enrolled versions too.

Current-config eligibility blocks removed/disabled mail immediately, without
waiting for a webhook or database reconciliation. Reconciliation saves a stopped
row with a reason and preserves history. Re-enabling can include the stage in new
journeys but cannot revive stopped rows on old ones. Already-sent history stays
unchanged. M4 must wire reconciliation into the worker/deployment workflow and
recheck current settings immediately before submission. No configuration change
can recall mail already submitted to a provider.

## Existing pickups

Each journey retains its enrollment snapshot. Added stages and timing/content or
expiry-policy edits affect new journeys only. Rescheduling moves eligible unsent
dates using the saved rules. Sent/stopped rows remain unchanged. Cancellation,
staff stop and customer suppression survive version changes. No automatic
backfill or version-transfer operation is included.

## Verify a change

```powershell
npm run test:follow-up
npm run test:follow-up:scheduling-database
npm run follow-up:simulate -- --scenario X01 --report
npm run follow-up:simulate -- --scenario X05 --report
npm run follow-up:simulate -- --scenario X14 --report
```

X01-X16 run the actual scheduling/reconciliation code in memory and through the
production Postgres adapter. The DB runner permits only the registered isolated
test endpoint. Migration 002 is versioned/checksummed; further stages need no
schema change. Rehearsals use synthetic customers and send no follow-up mail.
