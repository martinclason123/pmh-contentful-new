# PMH pickup email release

New PMH pickup bookings after the launch timestamp enroll for every puppy on
the site. The approved welcome email is the preparation stage. For a pickup
booked within three calendar days, Calendly attempts delivery immediately.
Otherwise Vercel's hourly job sends the email once it is due. Both paths use
the same durable attempt and delivery records. Every customer send BCCs
Martin. The other two stages are recorded but only the preparation stage can
send in this release.

## Production settings

Set these on the PMH Vercel project's **Production** environment. Verify the
existing Calendly pickup event type, signing key, Contentful access, Resend
sender and Neon production connection in that project.

| Variable | Value |
| --- | --- |
| `FOLLOW_UP_ENABLED` | `false` for the first deployment, then `true` at activation |
| `FOLLOW_UP_ENROLL_AFTER` | Actual launch instant in UTC, such as the result of `date -u +%FT%TZ` |
| `FOLLOW_UP_PILOT_LIMIT` | `unlimited` |
| `FOLLOW_UP_SERIES_KEY` | `standard-v1` |
| `FOLLOW_UP_CONTENT_KEY` | `pmh-welcome` |
| `FOLLOW_UP_DELIVERY_STAGES` | `preparation` |
| `FOLLOW_UP_AUDIT_EMAIL` | `martin@martinclason.net` |
| `BREEDER_ID` | `pawPrintsOnMyHeart` |
| `BREEDER_NAME` | `Paw Prints on My Heart` |
| `ORIGIN_URL` | `https://www.pmhpuppies.com` |
| `SCHEDULING_TIME_ZONE` | `America/Detroit` |
| `SCHEDULING_EMAIL_FROM` | `Paw Prints on My Heart <support@pmhpuppies.com>` |
| `FOLLOW_UP_REPLY_TO` | `hello@pmhpuppies.com` |
| `GOOGLE_REVIEW_URL` | `https://g.page/r/CY790YOY8l0sEBM/review` |
| `FOLLOW_UP_CHECK_IN_EXPIRY_DAYS` | `7` |
| `FOLLOW_UP_REVIEW_EXPIRY_DAYS` | `14` |
| `FOLLOW_UP_CATCH_UP_SPACING_HOURS` | `48` |
| `FOLLOW_UP_MAX_ATTEMPTS` | `5` |
| `FOLLOW_UP_RETRY_WINDOW_HOURS` | `24` (sender caps ambiguous retries at 23 hours) |
| `FOLLOW_UP_DST_REPEATED_TIME` | `first` |
| `FOLLOW_UP_DST_MISSING_TIME` | `next-valid` |
| `CRON_SECRET`, `FOLLOW_UP_LINK_SECRET` | Two independent secrets of at least 32 characters |
| `DATABASE_URL`, `RESEND_API_KEY`, `CALENDLY_PICKUP_EVENT_TYPE_URI` | Verified project settings |

Leave `FOLLOW_UP_DISABLED_STAGES` blank. It permanently stops existing stages.
The delivery allowlist controls which scheduled stages send. To pause mail
while continuing to record bookings, set `FOLLOW_UP_DELIVERY_STAGES` to blank
and redeploy. Keep the link secret stable so preference links keep working.

Apply migrations using the direct Neon production URL in a private, ignored
environment file. The runner rejects the test branch and unregistered hosts.

```sh
mise exec node@24 -- node --env-file=.env.production.local scripts/migrate-pmh-follow-ups.mjs --pmh-production
```

Verify an authenticated worker call with enrollment disabled before activation.
After activating, check the first booking receipt and first Resend delivery.
Confirm the audit copy in Martin's inbox. The webhook and worker log failure
counts. An unresolved delivery whose booking changed after an attempt, or whose
retry window closed, needs review in the delivery-attempt table and Resend
before sending manually.

A later stage needs a renderer, a timing and audit test, and an update to the
delivery allowlist. Already-enrolled journeys retain all three planned stages.
Review due dates and expiry before enabling any newly released stage.
