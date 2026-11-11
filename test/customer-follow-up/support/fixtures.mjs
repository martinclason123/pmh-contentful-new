import { createHmac } from "node:crypto";

export const FIXTURE_VERSION = 1;
export const FIXTURE_NOW = "2026-10-08T16:00:00.000Z";
export const FIXTURE_SIGNING_KEY =
  "synthetic-webhook-key-never-use-in-production";

/** All values are synthetic. This fixture is not PMH's production configuration. */
export function createFixtureEnvironment() {
  return {
    FOLLOW_UP_ENABLED: "true",
    BREEDER_ID: "syntheticPmh",
    BREEDER_NAME: "PMH test fixture",
    ORIGIN_URL: "https://pmh.test",
    SCHEDULING_TIME_ZONE: "America/Detroit",
    SCHEDULING_EMAIL_FROM: "PMH test fixture <sender@pmh.test>",
    CALENDLY_PICKUP_EVENT_TYPE_URI:
      "https://api.calendly.com/event_types/synthetic-pmh-pickup",
    FOLLOW_UP_REPLY_TO: "replies@pmh.test",
    GOOGLE_REVIEW_URL: "https://reviews.test/synthetic-pmh",
    FOLLOW_UP_CONTENT_KEY: "synthetic-pmh",
    FOLLOW_UP_SERIES_KEY: "standard-v1",
    DATABASE_URL: "postgresql://synthetic:fixture@test-db.test/follow_up_test",
    RESEND_API_KEY: "synthetic-resend-key",
    CRON_SECRET: "synthetic-cron-key-32-characters-minimum",
    FOLLOW_UP_LINK_SECRET: "synthetic-opt-out-key-32-characters-minimum",
    FOLLOW_UP_ENROLL_AFTER: FIXTURE_NOW,
    FOLLOW_UP_PILOT_LIMIT: "5",
    FOLLOW_UP_CHECK_IN_EXPIRY_DAYS: "7",
    FOLLOW_UP_REVIEW_EXPIRY_DAYS: "14",
    FOLLOW_UP_CATCH_UP_SPACING_HOURS: "48",
    FOLLOW_UP_MAX_ATTEMPTS: "5",
    FOLLOW_UP_RETRY_WINDOW_HOURS: "24",
    FOLLOW_UP_DST_REPEATED_TIME: "first",
    FOLLOW_UP_DST_MISSING_TIME: "next-valid",
  };
}

/** A pickup, its cancellation and linked replacement share synthetic identities. */
export function createEventFixtures() {
  const oldUri =
    "https://api.calendly.com/scheduled_events/synthetic-old/invitees/synthetic-customer";
  const newUri =
    "https://api.calendly.com/scheduled_events/synthetic-new/invitees/synthetic-customer";
  const payload = {
    uri: oldUri,
    created_at: FIXTURE_NOW,
    status: "active",
    event: "https://api.calendly.com/scheduled_events/synthetic-old",
    email: "customer@pmh.test",
    name: "Synthetic Customer",
    rescheduled: false,
    old_invitee: null,
    new_invitee: null,
    tracking: { utm_term: "synthetic-chip" },
  };
  return {
    booked: {
      event: "invitee.created",
      created_at: FIXTURE_NOW,
      payload: structuredClone(payload),
    },
    canceled: {
      event: "invitee.canceled",
      created_at: FIXTURE_NOW,
      payload: structuredClone(payload),
    },
    rescheduleCanceled: {
      event: "invitee.canceled",
      created_at: FIXTURE_NOW,
      payload: {
        ...structuredClone(payload),
        rescheduled: true,
        new_invitee: newUri,
      },
    },
    replacement: {
      event: "invitee.created",
      created_at: FIXTURE_NOW,
      payload: {
        ...structuredClone(payload),
        uri: newUri,
        event: "https://api.calendly.com/scheduled_events/synthetic-new",
        old_invitee: oldUri,
      },
    },
    resources: {
      [payload.event]: {
        uri: payload.event,
        event_type: createFixtureEnvironment().CALENDLY_PICKUP_EVENT_TYPE_URI,
        start_time: "2026-10-18T16:00:00.000Z",
        name: "Synthetic puppy pickup",
      },
      "https://api.calendly.com/scheduled_events/synthetic-new": {
        uri: "https://api.calendly.com/scheduled_events/synthetic-new",
        event_type: createFixtureEnvironment().CALENDLY_PICKUP_EVENT_TYPE_URI,
        start_time: "2026-10-20T16:00:00.000Z",
        name: "Synthetic puppy pickup",
      },
    },
    puppy: {
      chip: "synthetic-chip",
      name: "Synthetic Puppy",
      pickupScheduled: false,
    },
  };
}

/** Signs exactly the bytes supplied to the webhook; never uses a live secret. */
export function signFixtureEvent(event, clock) {
  const rawBody = JSON.stringify(event);
  const timestamp = Math.floor(clock.now() / 1000);
  const digest = createHmac("sha256", FIXTURE_SIGNING_KEY)
    .update(`${timestamp}.${rawBody}`)
    .digest("hex");
  return { rawBody, signature: `t=${timestamp},v1=${digest}` };
}
