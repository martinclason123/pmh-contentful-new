import "server-only";

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatPickupTime(startTime, timezone, fallbackTimeZone) {
  const date = new Date(startTime);

  if (Number.isNaN(date.getTime())) {
    return "the selected time";
  }

  try {
    return new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZone: timezone || fallbackTimeZone,
      timeZoneName: "short",
    }).format(date);
  } catch {
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "full",
      timeStyle: "short",
      timeZone: fallbackTimeZone,
    }).format(date);
  }
}

async function sendResendEmail(email, idempotencyKey) {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not configured");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey.slice(0, 256),
    },
    body: JSON.stringify(email),
    cache: "no-store",
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    throw new Error(`Resend email request failed (${response.status})`);
  }
}

export async function sendPickupScheduledEmails({
  puppy,
  invitee,
  scheduledEvent,
  scheduling,
  notificationType = "scheduled",
}) {
  const customerEmail = invitee.email || puppy.buyerEmail;

  if (!customerEmail) {
    throw new Error("No customer email is available for the pickup booking");
  }

  const puppyName = puppy.name || "your puppy";
  const inviteeName = invitee.name || puppy.buyerName || "Customer";
  const pickupTime = formatPickupTime(
    scheduledEvent.start_time,
    invitee.timezone,
    scheduling.timeZone
  );
  const location = scheduledEvent.location?.location;
  const locationMessage = location
    ? `<p><strong>Location:</strong> ${escapeHtml(location)}</p>`
    : "";
  const manageLinks = [
    invitee.reschedule_url
      ? `<a href="${escapeHtml(invitee.reschedule_url)}">reschedule</a>`
      : null,
    invitee.cancel_url
      ? `<a href="${escapeHtml(invitee.cancel_url)}">cancel</a>`
      : null,
  ].filter(Boolean);
  const manageMessage = manageLinks.length
    ? `<p>If needed, you can ${manageLinks.join(" or ")} this appointment.</p>`
    : "";
  const eventId = (invitee.uri || `${puppy.chip}-${scheduledEvent.start_time}`)
    .split("/")
    .filter(Boolean)
    .pop();
  const isReschedule = notificationType === "rescheduled";

  const customerEmailData = {
    from: scheduling.emailFrom,
    to: customerEmail,
    subject: `Pickup ${isReschedule ? "rescheduled" : "scheduled"} for ${puppyName}`,
    html: `<p>Hi ${escapeHtml(inviteeName)},</p><p>Your pickup for <strong>${escapeHtml(
      puppyName
    )}</strong> ${isReschedule ? "has been rescheduled" : "is scheduled"} for <strong>${escapeHtml(
      pickupTime
    )}</strong>.</p>${locationMessage}${manageMessage}<p>If you have any questions, please call or text ${escapeHtml(
      scheduling.supportPhone
    )}. We look forward to seeing you!</p>`,
  };
  await sendResendEmail(
    customerEmailData,
    `pickup-${isReschedule ? "rescheduled-" : ""}customer/${eventId}`
  );
}
