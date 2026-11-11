/** Shared production handler; tests inject every external service and capture side effects. */
export function createCalendlyWebhookHandler({
  env,
  extractPuppyChip,
  getCalendlyResource,
  verifyCalendlyWebhookSignature,
  getBreederScheduling,
  sendPickupScheduledEmails,
  getEventKind,
  sendBreederSchedulingNotification,
  getManagedPuppy,
  updatePuppy,
  recordFollowUp,
  logger = console,
}) {
  return async function POST(req) {
    const rawBody = await req.text();
    const signature = req.headers.get("calendly-webhook-signature");

    if (
      !verifyCalendlyWebhookSignature(
        rawBody,
        signature,
        env.CALENDLY_WEBHOOK_SIGNING_KEY,
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

    if (!webhook || typeof webhook !== "object")
      return new Response("Invalid payload", { status: 400 });

    if (
      webhook.event !== "invitee.created" &&
      webhook.event !== "invitee.canceled"
    ) {
      return new Response(null, { status: 200 });
    }

    if (
      !webhook.payload ||
      typeof webhook.payload !== "object" ||
      !webhook.payload.uri ||
      !webhook.payload.event
    ) {
      return new Response("Missing invitee identity", { status: 422 });
    }

    try {
      let invitee = webhook.payload;

      if (webhook.payload.uri) {
        try {
          invitee = await getCalendlyResource(webhook.payload.uri);
        } catch (error) {
          logger.error(
            "Unable to refresh the Calendly invitee; using webhook data:",
            error,
          );
        }
      }

      const scheduledEvent = await getCalendlyResource(invitee.event);
      const scheduling = getBreederScheduling();
      const eventKind = getEventKind(scheduledEvent, scheduling);

      if (!eventKind) {
        return new Response(null, { status: 200 });
      }

      // Follow-up state is durable before notification-only early returns.
      // Signed event facts, rather than a later refresh, determine cancellation.
      await recordFollowUp({
        webhook,
        currentInvitee: invitee,
        scheduledEvent,
        scheduling,
        eventKind,
      });

      // A replacement invitee keeps old_invitee even if that new appointment is
      // later canceled normally. For canceled webhooks, Calendly's rescheduled
      // flag is the authoritative distinction between a cancellation and the
      // cancellation half of a reschedule.
      const isReschedule =
        webhook.event === "invitee.canceled"
          ? webhook.payload.rescheduled === true
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
        logger.error("Calendly pickup booking is missing its puppy chip");
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

          logger.error("Unable to match Calendly visit to a puppy:", error);
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
            invitee.old_invitee,
          );
          previousScheduledEvent = await getCalendlyResource(
            previousInvitee.event,
          );
        } catch (error) {
          logger.error(
            "Unable to load the previous Calendly appointment:",
            error,
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
          }),
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
      logger.error("Error processing Calendly webhook:", error);
      return new Response("Failed to process Calendly webhook", {
        status: 500,
      });
    }
  };
}
