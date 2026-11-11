import { createHmac } from "node:crypto";
import { getFollowUpConfig } from "../../../src/lib/customer-follow-up/config.mjs";
import { createCalendlyWebhookHandler } from "../../../src/lib/customer-follow-up/calendly-handler.mjs";
import { createBookingService } from "../../../src/lib/customer-follow-up/booking-service.mjs";
import { verifyCalendlyWebhookSignature } from "../../../src/lib/customer-follow-up/signature.mjs";
import {
  createFixtureEnvironment,
  FIXTURE_NOW,
  FIXTURE_SIGNING_KEY,
} from "./fixtures.mjs";
import { createTestClock } from "./harness.mjs";
import { createMemoryRepository } from "./memory-repository.mjs";

export function createSchedulingEnvironment({
  repository = createMemoryRepository(),
  breederId = "synthetic-m2-rules",
  overrides = {},
  seriesDefinitions,
} = {}) {
  const settings = {
    ...createFixtureEnvironment(),
    BREEDER_ID: breederId,
    CALENDLY_WEBHOOK_SIGNING_KEY: FIXTURE_SIGNING_KEY,
    ...overrides,
  };
  const config = getFollowUpConfig(settings, { seriesDefinitions });
  const clock = createTestClock();
  const resources = new Map();
  let counter = 0;
  const env = {
    repository,
    breederId,
    settings,
    config,
    clock,
    notifications: [],
    updates: [],
    errors: [],
    failures: new Set(),
    alreadyScheduled: false,
  };
  const extractPuppyChip = (invitee) =>
    invitee.tracking?.utm_term?.trim() || null;
  const getCalendlyResource = async (uri) => {
    if (env.failures.has("calendly"))
      throw new Error("Synthetic Calendly outage");
    if (!resources.has(uri))
      throw new Error("Unknown synthetic Calendly resource");
    return structuredClone(resources.get(uri));
  };
  const getPuppy = async (chip) => {
    if (env.failures.has("contentful"))
      throw new Error("Synthetic Contentful outage");
    if (chip !== "synthetic-chip") throw new Error("Unknown synthetic puppy");
    return {
      chip,
      name: "Synthetic Puppy",
      pickupScheduled: env.alreadyScheduled,
    };
  };
  const service = createBookingService({
    config,
    repository,
    clock,
    getCalendlyResource,
    getPuppy,
    extractPuppyChip,
  });
  const handler = createCalendlyWebhookHandler({
    env: settings,
    extractPuppyChip,
    getCalendlyResource,
    verifyCalendlyWebhookSignature: (body, header, key) =>
      verifyCalendlyWebhookSignature(body, header, key, clock.now()),
    getBreederScheduling: () => ({
      pickupEventTypeUri: settings.CALENDLY_PICKUP_EVENT_TYPE_URI,
      visitEventTypeUri: "https://api.calendly.com/event_types/synthetic-visit",
    }),
    getEventKind: (event, scheduling) =>
      event.event_type === scheduling.pickupEventTypeUri
        ? "pickup"
        : event.event_type === scheduling.visitEventTypeUri
          ? "visit"
          : null,
    getManagedPuppy: getPuppy,
    updatePuppy: async (chip, data) => {
      env.updates.push({ chip, data });
    },
    sendBreederSchedulingNotification: async () => {
      env.notifications.push("admin/fax");
      if (env.failures.has("notification"))
        throw new Error("Synthetic fax failure");
    },
    sendPickupScheduledEmails: async () => {
      env.notifications.push("confirmation");
      if (env.failures.has("confirmation"))
        throw new Error("Synthetic confirmation failure");
    },
    recordFollowUp: async (input) => {
      if (env.failures.has("database"))
        throw new Error("Synthetic database failure");
      return service(input);
    },
    logger: { error: (message) => env.errors.push(message) },
  });
  env.book = (
    name = "a",
    pickupAt = "2026-10-18T16:00:00Z",
    {
      previous = null,
      createdAt = FIXTURE_NOW,
      eventType = settings.CALENDLY_PICKUP_EVENT_TYPE_URI,
    } = {},
  ) => {
    const uri = `https://api.calendly.com/scheduled_events/synthetic-${name}/invitees/synthetic-customer`;
    const event = `https://api.calendly.com/scheduled_events/synthetic-${name}`;
    const payload = {
      uri,
      event,
      email: "customer@pmh.test",
      name: "Synthetic Customer",
      created_at: createdAt,
      status: "active",
      rescheduled: false,
      old_invitee: previous?.payload.uri ?? null,
      new_invitee: null,
      tracking: { utm_term: "synthetic-chip" },
    };
    resources.set(uri, structuredClone(payload));
    resources.set(event, {
      uri: event,
      event_type: eventType,
      start_time: pickupAt,
    });
    if (previous) {
      const old = resources.get(previous.payload.uri);
      resources.set(old.uri, {
        ...old,
        status: "canceled",
        rescheduled: true,
        new_invitee: uri,
      });
    }
    return {
      event: "invitee.created",
      created_at: new Date(clock.now() + counter++).toISOString(),
      payload,
    };
  };
  env.cancel = (booking, { rescheduled = false, replacement = null } = {}) => {
    const payload = {
      ...structuredClone(booking.payload),
      status: "canceled",
      rescheduled,
      new_invitee: replacement?.payload.uri ?? null,
    };
    resources.set(payload.uri, { ...resources.get(payload.uri), ...payload });
    return {
      event: "invitee.canceled",
      created_at: new Date(clock.now() + counter++).toISOString(),
      payload,
    };
  };
  env.post = async (
    webhook,
    {
      rawBody = JSON.stringify(webhook),
      signature = null,
      signatureTime = clock.now(),
    } = {},
  ) => {
    const timestamp = Math.floor(signatureTime / 1000);
    const header =
      signature ??
      `t=${timestamp},v1=${createHmac("sha256", FIXTURE_SIGNING_KEY).update(`${timestamp}.${rawBody}`).digest("hex")}`;
    return handler(
      new Request("https://pmh.test/api/calendly-webhook", {
        method: "POST",
        headers: { "calendly-webhook-signature": header },
        body: rawBody,
      }),
    );
  };
  env.snapshot = () => repository.snapshot(breederId);
  env.setResource = (uri, value) => resources.set(uri, structuredClone(value));
  env.getResource = (uri) => structuredClone(resources.get(uri));
  return env;
}
