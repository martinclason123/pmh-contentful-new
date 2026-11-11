# PMH pilot settings

Status: Milestones 1-2 and M2a passed; Milestone 3 ready to start. Follow-ups remain disabled. Public settings only;
store credentials directly in local/Vercel environment settings, never here.

## Confirmed by Martin

| Setting | Value / status |
| --- | --- |
| Active repository | `C:\Users\Martin\Documents\GitHub\pmh-contentful-new` |
| Breeder ID | `pawPrintsOnMyHeart`, matching the repository's scheduling configuration |
| Public domain | `https://www.pmhpuppies.com`, present in the PMH sitemap configuration |
| Customer reply inbox | `hello@pmhpuppies.com` |
| Google review URL | `https://g.page/r/CY790YOY8l0sEBM/review` |
| Email content | Draft placeholder copy is authorized for technical tests; refine and approve before live customer sends |
| Check-in expiry | 7 days after its due time |
| Review expiry | 14 days after its due time |
| Overdue email spacing | At least 48 hours; normal on-time sends retain their original dates |
| Retry limit | At most five total attempts, including the initial attempt, within 24 hours; stage expiry and stop conditions can end attempts sooner |
| Repeated DST time | First occurrence |
| Nonexistent DST time | Next valid local time |
| Enrollment cutover | Set a UTC activation timestamp at launch; no historical backfill |
| Vercel project | `pmh-contentful-new`, confirmed by Martin |
| Initial live cohort | Five new PMH pickups; Martin monitors replies and failed sends |
| Series selection | Planned pilot: `FOLLOW_UP_SERIES_KEY=standard-v1`; required before enabled mode |
| Disabled stage IDs | `FOLLOW_UP_DISABLED_STAGES` optional; unset/blank for the initial full series |

## Verified in local PMH code/settings

- Time zone: `America/Detroit`.
- Sender: Paw Prints on My Heart `<support@pmhpuppies.com>`.
- Pickup page: `https://calendly.com/martinclason123/puppy-pickup`.
- Pickup event type: `https://api.calendly.com/event_types/eda5020e-6e7d-409a-9753-fb04e300b535`.
- The local configuration has Calendly signing, Resend and Contentful settings.
  Presence is verified; provider validity and deployed settings are not yet verified.
- No local `DATABASE_URL` was configured when inspected. This does not establish
  whether a database already exists in the Vercel account.

## Verified in Vercel on October 8, 2026

- Project: [pmh-contentful-new](https://vercel.com/martinclason123-s-team/pmh-contentful-new),
  linked to `martinclason123/pmh-contentful-new`; production domains include
  `pmhpuppies.com` and `www.pmhpuppies.com`.
- Build/runtime setting: Node 22.x. No runtime setting or deployment was changed.
- Calendly signing/access settings, pickup event settings, Resend and Contentful
  variable names are present. Values stayed masked; this confirms presence,
  not credential validity. Existing live-provider checks belong to M5.
- Created `pmh-follow-ups` through the existing Vercel Neon integration on its
  **Free** plan in Washington, D.C. (`iad1`), with Neon Auth disabled.
  Neon project ID: `steep-flower-70030380`.
- Connected that database to PMH **Production only**, using the `DATABASE`
  prefix and sensitive credentials, including `DATABASE_URL`. Preview and
  Development were excluded. No application migration, query or email ran.
- The unrelated existing Vercel storage resource was left untouched.
- Neon requires email activation before its dashboard opens. The isolated test
  branch was created after Martin activated the Vercel-linked identity.
- Access is verified through `Open in Neon`, under `Vercel: martinclason123's Team`.
  A separate personal Google login does not automatically access this installation.
  Vercel-managed CLI access requires API-key authentication. See the
  [official integration guide](https://neon.com/docs/guides/vercel-managed-integration).
- Production branch: `main` (`br-hidden-bird-b8al463f`). Test branch:
  `follow-up-test` (`br-rough-sun-b8gp434w`), created using schema-only branching
  so no customer rows were copied. Both are on Free, with 0.25 CU computes;
  the test branch has no automatic expiry while milestone testing is ongoing.
- Neon reports region `aws-us-east-1` (N. Virginia), corresponding to the Vercel
  integration's `iad1` location. Postgres version 18.
- Public endpoint/database identities are registered in PMH's
  `test/customer-follow-up/database-targets.json`. The direct test credential is
  stored only in ignored `.env.follow-up-test.local`, under
  `FOLLOW_UP_TEST_DATABASE_URL`; existing `.env.local` was not modified.
- Real test seed/read/reset cycles passed and repeat identically. Only the
  dedicated `follow_up_test.foundation_fixtures` table was used. Production was
  rejected before connection; no production query or migration was performed.
  Preview/Development still have no production database credentials.

## Milestone 1 review

Martin approved the foundation, PMH settings and operating policies on October 21,
2026, and explicitly requested the start of Milestone 2. Enrollment remains off.

Fixture tests use a fake puppy service and no live Contentful records. Prepare
the real-provider rehearsal environment in M5.

Final food/checklist/crate wording and actual inbox/link/sender delivery checks
remain launch requirements. They do not block the synthetic harness work.

## M2a configuration prerequisite

The series values above document intended launch settings. No private env file
or Vercel setting was changed during M2a. Configure/verify them in the M5 runbook
before enabling enrollment. Use the [series editing rules](series-configuration.md)
for later changes.
