# Local deposit walkthrough

Use Node 24 and the Stripe CLI. The launcher uses Stripe test keys from
`.env.local` and passes the CLI's webhook signing secret to the dev server.
The server listens on loopback. Set `LOCAL_TEST_EMAIL` in `.env.local`
to the single inbox that should receive both test emails.

1. Run `npm run dev:checkout` and open [the test deposit page](http://127.0.0.1:3000/deposit/0000).
2. Fill the agreement with made-up buyer details. Use card number
   `4242 4242 4242 4242`, a future expiry, and any three-digit CVC.
3. Wait for the Stripe webhook to return HTTP 200. Check the configured inbox
   for the buyer confirmation and admin notification, each marked `[LOCAL TEST]`.
   The synthetic puppy's reservation is saved to `.local-checkout/puppy.json`.
4. Open the pickup link on the success page and click **Simulate pickup booking**.
   This runs the signed Calendly webhook scenario with synthetic fixtures and
   displays the three pending follow-ups for the sample appointment.

Local checkout mode routes deposit emails to the configured inbox, skips faxes,
and saves the reservation locally. The pickup simulation uses an in-memory
repository and stubs external services. Stop the launcher with Ctrl+C.
To clear the reservation between runs, stop the launcher and remove
`.local-checkout/puppy.json` if it exists.

Run `npm run follow-up:preview-preparation` to book a synthetic pickup for
tomorrow and send the due preparation email to the local test inbox. You can
pass a specific date and time with a UTC offset after `--`. The command
requires `FOLLOW_UP_AUDIT_EMAIL` to match `LOCAL_TEST_EMAIL`. Preview mode
delivers one copy to that address. The shared customer delivery helper adds
the audit address as BCC.
