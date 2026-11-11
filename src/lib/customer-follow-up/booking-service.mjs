import { createHash } from "node:crypto";
import { instant } from "./schedule.mjs";
import { normalizeEmail, recordBookingEvent } from "./booking-state.mjs";

function inviteeUri(value) {
  try {
    const url = new URL(value);
    if (
      url.origin === "https://api.calendly.com" &&
      /^\/scheduled_events\/[^/]+\/invitees\/[^/]+$/.test(url.pathname) &&
      !url.search &&
      !url.hash &&
      !url.username &&
      !url.password
    )
      return value;
  } catch {
    /* Invalid input is reported without reflecting payload values. */
  }
  throw new Error("Invalid Calendly invitee URI");
}

function facts(
  invitee,
  {
    created = false,
    canceled = false,
    fallbackCreatedAt = null,
    pickupAt = null,
    puppyChip = null,
  } = {},
) {
  const email = normalizeEmail(invitee.email);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    throw new Error("Invalid customer email");
  const createdAt = invitee.created_at ?? fallbackCreatedAt;
  if (createdAt) instant(createdAt, "booking creation time");
  return {
    uri: inviteeUri(invitee.uri),
    previousUri: invitee.old_invitee ? inviteeUri(invitee.old_invitee) : null,
    nextUri: invitee.new_invitee ? inviteeUri(invitee.new_invitee) : null,
    // A signed cancellation includes the original signup timestamp too.
    // Persist it even if the created webhook has not arrived yet.
    seenCreated: created || Boolean(invitee.created_at),
    canceled,
    rescheduled: Boolean(
      invitee.new_invitee || (canceled && invitee.rescheduled === true),
    ),
    createdAt,
    pickupAt,
    email: email || null,
    puppyChip,
  };
}

/** Adapt provider data into minimal booking facts; never store whole webhook bodies. */
export function createBookingService({
  config,
  repository,
  clock,
  getCalendlyResource,
  getPuppy,
  extractPuppyChip,
}) {
  return async ({ webhook, currentInvitee, scheduledEvent }) => {
    if (!config.enabled) return { outcome: "disabled" };
    if (scheduledEvent?.event_type !== config.pickupEventTypeUri)
      return { outcome: "not-pickup" };
    const invitee = webhook.payload;
    if (
      !invitee ||
      !["invitee.created", "invitee.canceled"].includes(webhook.event)
    )
      throw new Error("Invalid booking event");
    const chip = extractPuppyChip(invitee);
    if (!chip || !normalizeEmail(invitee.email))
      throw new Error("Missing booking identity");
    const puppy = await getPuppy(chip);
    if (!puppy || String(puppy.chip).trim() !== chip)
      throw new Error("Puppy does not match booking");
    instant(scheduledEvent.start_time, "pickup time");
    const first = facts(invitee, {
      created: webhook.event === "invitee.created",
      canceled: webhook.event === "invitee.canceled",
      fallbackCreatedAt:
        webhook.event === "invitee.created" ? webhook.created_at : null,
      pickupAt: new Date(scheduledEvent.start_time).toISOString(),
      puppyChip: chip,
    });
    if (currentInvitee) {
      if (currentInvitee.uri !== first.uri)
        throw new Error("Refreshed invitee identity does not match");
      // A delayed creation may already have a later replacement at Calendly.
      // Retain that forward link and hold mail until its details arrive.
      if (currentInvitee.new_invitee) {
        first.nextUri = inviteeUri(currentInvitee.new_invitee);
        first.rescheduled = true;
        first.canceled = true;
      } else if (currentInvitee.status === "canceled") {
        first.canceled = true;
        first.rescheduled ||= currentInvitee.rescheduled === true;
      }
    }
    const bookings = [first];
    // Resolve original signup age even when a replacement is the first delivery.
    // A missing ancestor is retried instead of enrolling an old booking as new.
    let parent = first.previousUri;
    const visited = new Set([first.uri]);
    while (parent) {
      if (visited.has(parent) || visited.size >= 100)
        throw new Error("Invalid reschedule chain");
      visited.add(parent);
      const ancestor = await getCalendlyResource(parent);
      if (ancestor.uri !== parent)
        throw new Error("Calendly ancestor does not match");
      const ancestorChip = extractPuppyChip(ancestor);
      if (ancestorChip && ancestorChip !== chip)
        throw new Error("Reschedule changed puppy identity");
      const ancestorEvent = await getCalendlyResource(ancestor.event);
      if (ancestorEvent.event_type !== config.pickupEventTypeUri)
        throw new Error("Reschedule changed event type");
      instant(ancestorEvent.start_time, "pickup time");
      bookings.unshift(
        facts(ancestor, {
          created: true,
          canceled: ancestor.status === "canceled",
          pickupAt: new Date(ancestorEvent.start_time).toISOString(),
          puppyChip: chip,
        }),
      );
      parent = ancestor.old_invitee;
    }
    const receiptKey = createHash("sha256")
      .update(
        JSON.stringify([
          webhook.event,
          invitee.uri,
          webhook.created_at,
          invitee.rescheduled,
          invitee.old_invitee,
          invitee.new_invitee,
        ]),
      )
      .digest("hex");
    return recordBookingEvent(
      { receiptKey, inviteeUri: first.uri, bookings },
      config,
      repository,
      clock,
    );
  };
}
