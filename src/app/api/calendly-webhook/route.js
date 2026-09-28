import {
  extractPuppyChip,
  getCalendlyResource,
  verifyCalendlyWebhookSignature,
} from "../../../utils/calendly-webhook";
import { getBreederScheduling } from "../../../data/scheduling";
import { sendPickupScheduledEmails } from "../../../utils/pickup-scheduled-email";
import {
  getEventKind,
  sendBreederSchedulingNotification,
} from "../../../utils/scheduling-notification";
import {
  getManagedPuppy,
  updatePuppy,
} from "../../../utils/update-puppy";

export const runtime = "nodejs";

export async function POST(req) {
  const rawBody = await req.text();
  const signature = req.headers.get("calendly-webhook-signature");

  if (
    !verifyCalendlyWebhookSignature(
      rawBody,
      signature,
      process.env.CALENDLY_WEBHOOK_SIGNING_KEY
    )
  ) {
    return new Response("Invalid webhook signature", { status: 401 });
  }

  let webhook;

  try {
    webhook = JSON.parse(rawBody);
  } catch {
    return new Response("Invalid JSON payload", { status: 400 });
  }

  if (
    webhook.event !== "invitee.created" &&
    webhook.event !== "invitee.canceled"
  ) {
    return new Response(null, { status: 200 });
  }

  try {
    let invitee = webhook.payload;

    if (webhook.payload.uri) {
      try {
        invitee = await getCalendlyResource(webhook.payload.uri);
      } catch (error) {
        console.error(
          "Unable to refresh the Calendly invitee; using webhook data:",
          error
        );
      }
    }

    const scheduledEvent = await getCalendlyResource(invitee.event);
    const scheduling = getBreederScheduling();
    const eventKind = getEventKind(scheduledEvent, scheduling);

    if (!eventKind) {
      return new Response(null, { status: 200 });
    }

    // A replacement invitee keeps old_invitee even if that new appointment is
    // later canceled normally. For canceled webhooks, Calendly's rescheduled
    // flag is the authoritative distinction between a cancellation and the
    // cancellation half of a reschedule.
    const isReschedule =
      webhook.event === "invitee.canceled"
        ? invitee.rescheduled === true
        : Boolean(invitee.rescheduled || invitee.old_invitee);

    // Calendly emits both a canceled webhook for the old appointment and a
    // created webhook for the replacement. The created webhook below sends
    // the single reschedule notification with the new appointment details.
    if (webhook.event === "invitee.canceled" && isReschedule) {
      return new Response(null, { status: 200 });
    }

    const notificationType =
      webhook.event === "invitee.canceled"
        ? "canceled"
        : isReschedule
          ? "rescheduled"
          : "scheduled";
    const puppyChip = extractPuppyChip(invitee);

    if (eventKind === "pickup" && !puppyChip) {
      console.error("Calendly pickup booking is missing its puppy chip");
      return new Response("Puppy chip is missing", { status: 422 });
    }

    let puppy = null;

    if (puppyChip) {
      try {
        puppy = await getManagedPuppy(puppyChip);
      } catch (error) {
        if (eventKind === "pickup") {
          throw error;
        }

        console.error("Unable to match Calendly visit to a puppy:", error);
      }
    }

    if (
      webhook.event === "invitee.created" &&
      eventKind === "pickup" &&
      puppy.pickupScheduled &&
      !isReschedule
    ) {
      return new Response(null, { status: 200 });
    }

    let previousScheduledEvent = null;

    if (notificationType === "rescheduled" && invitee.old_invitee) {
      try {
        const previousInvitee = await getCalendlyResource(
          invitee.old_invitee
        );
        previousScheduledEvent = await getCalendlyResource(
          previousInvitee.event
        );
      } catch (error) {
        console.error(
          "Unable to load the previous Calendly appointment:",
          error
        );
      }
    }

    const notifications = [
      sendBreederSchedulingNotification({
        eventKind,
        scheduledEvent,
        previousScheduledEvent,
        invitee,
        puppy,
        scheduling,
        notificationType,
      }),
    ];

    if (eventKind === "pickup" && webhook.event === "invitee.created") {
      notifications.push(
        sendPickupScheduledEmails({
          puppy,
          invitee,
          scheduledEvent,
          scheduling,
          notificationType,
        })
      );
    }

    await Promise.all(notifications);

    if (eventKind === "pickup") {
      await updatePuppy(puppyChip, {
        pickupScheduled: webhook.event === "invitee.created",
      });
    }

    return new Response(null, { status: 200 });
  } catch (error) {
    console.error("Error processing Calendly webhook:", error);
    return new Response("Failed to process Calendly webhook", { status: 500 });
  }
}
