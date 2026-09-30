import "server-only";

import {
  getCalendlyCollection,
  getCalendlyResource,
} from "./calendly-webhook";
import sendFaxHtml from "./send-fax-html";

const MAX_UPCOMING_EVENTS = 50;

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatEventTime(value, timeZone) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Time unavailable";
  }

  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone,
    timeZoneName: "short",
  }).format(date);
}

function getEventKind(event, scheduling) {
  if (event?.event_type === scheduling.visitEventTypeUri) {
    return "visit";
  }

  if (event?.event_type === scheduling.pickupEventTypeUri) {
    return "pickup";
  }

  return null;
}

function getPuppyReference(invitee, puppy) {
  const trackedReference = invitee?.tracking?.utm_content?.trim();

  if (trackedReference) {
    return trackedReference;
  }

  const answer = [...(invitee?.questions_and_answers || [])]
    .sort(
      (left, right) =>
        (left.position ?? Number.MAX_SAFE_INTEGER) -
        (right.position ?? Number.MAX_SAFE_INTEGER)
    )
    .find((item) => item.answer?.trim())
    ?.answer.trim();

  if (answer) {
    return answer;
  }

  if (puppy?.name && puppy?.chip) {
    return `${puppy.name} (${puppy.chip})`;
  }

  if (puppy?.name) {
    return puppy.name;
  }

  const trackedChip = invitee?.tracking?.utm_term?.trim();
  return trackedChip ? `Chip ${trackedChip}` : "Not specified";
}

function createAppointmentRow(event, invitee, scheduling, puppy) {
  return {
    eventUri: event?.uri || invitee?.event || "",
    inviteeUri: invitee?.uri || "",
    startTime: event?.start_time || "",
    type: getEventKind(event, scheduling),
    puppy: getPuppyReference(invitee, puppy),
    customer: invitee?.name || invitee?.email || "Not provided",
    phone: invitee?.text_reminder_number || "Not provided",
  };
}

function eventUuid(eventUri) {
  return eventUri?.split("/").filter(Boolean).pop();
}

async function getUpcomingAppointments({
  scheduledEvent,
  invitee,
  scheduling,
  puppy,
  notificationType,
}) {
  const userUri =
    scheduledEvent.event_memberships?.[0]?.user ||
    (await getCalendlyResource("/users/me")).uri;
  const query = new URLSearchParams({
    user: userUri,
    status: "active",
    min_start_time: new Date(Date.now() - 60_000).toISOString(),
    sort: "start_time:asc",
    count: "100",
  });
  const events = await getCalendlyCollection(
    `/scheduled_events?${query.toString()}`
  );
  const relevantEvents = events
    .filter(
      (event) =>
        getEventKind(event, scheduling) &&
        !(
          notificationType === "canceled" &&
          event.uri === scheduledEvent.uri
        )
    )
    .slice(0, MAX_UPCOMING_EVENTS);
  const rows = (
    await Promise.all(
      relevantEvents.map(async (event) => {
        const isCurrentEvent = event.uri === scheduledEvent.uri;
        const invitees = isCurrentEvent
          ? [invitee]
          : await getCalendlyCollection(
              `/scheduled_events/${eventUuid(event.uri)}/invitees?status=active&count=100`
            );

        return invitees.map((eventInvitee) =>
          createAppointmentRow(
            event,
            eventInvitee,
            scheduling,
            isCurrentEvent ? puppy : null
          )
        );
      })
    )
  ).flat();
  const currentRow = createAppointmentRow(
    scheduledEvent,
    invitee,
    scheduling,
    puppy
  );

  if (
    notificationType !== "canceled" &&
    !rows.some(
      (row) =>
        row.eventUri === currentRow.eventUri &&
        row.inviteeUri === currentRow.inviteeUri
    )
  ) {
    rows.push(currentRow);
  }

  return rows.sort(
    (left, right) =>
      new Date(left.startTime).getTime() - new Date(right.startTime).getTime()
  );
}

function buildUpcomingTable(appointments, scheduling) {
  if (appointments.length === 0) {
    return `
      <h2>Upcoming Visits and Pickups</h2>
      <p>No upcoming visits or pickups are currently scheduled.</p>`;
  }

  const rows = appointments
    .map(
      (appointment) => `
        <tr>
          <td>${escapeHtml(
            formatEventTime(appointment.startTime, scheduling.timeZone)
          )}</td>
          <td>${escapeHtml(
            appointment.type === "pickup" ? "Pickup" : "Visit"
          )}</td>
          <td>${escapeHtml(appointment.puppy)}</td>
          <td>${escapeHtml(appointment.customer)}</td>
          <td>${escapeHtml(appointment.phone)}</td>
        </tr>`
    )
    .join("");

  return `
    <h2>Upcoming Visits and Pickups</h2>
    <table>
      <thead>
        <tr>
          <th>Date &amp; Time</th>
          <th>Type</th>
          <th>Puppy</th>
          <th>Customer</th>
          <th>Phone</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function buildNotificationHtml({
  eventKind,
  scheduledEvent,
  previousScheduledEvent,
  invitee,
  puppy,
  appointments,
  scheduling,
  notificationType,
}) {
  const eventLabel = eventKind === "pickup" ? "Pickup" : "Visit";
  const puppyReference = getPuppyReference(invitee, puppy);
  const location = scheduledEvent.location?.location;
  const heading = {
    scheduled: `New Puppy ${eventLabel} Scheduled`,
    rescheduled: `Puppy ${eventLabel} Rescheduled`,
    canceled: `Puppy ${eventLabel} Canceled`,
  }[notificationType];
  const dateLabel =
    notificationType === "rescheduled"
      ? "New date"
      : notificationType === "canceled"
        ? "Canceled appointment"
        : "Date";
  const previousDate = previousScheduledEvent?.start_time;
  const cancellation = invitee.cancellation;

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${heading}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; color: #111; }
          h1 { margin-bottom: 8px; }
          h2 { margin-top: 28px; }
          p { font-size: 14px; margin: 6px 0; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { border: 1px solid #333; padding: 7px; text-align: left; font-size: 12px; }
          th { background: #f2f2f2; }
        </style>
      </head>
      <body>
        <h1>${heading}</h1>
        ${
          previousDate
            ? `<p><strong>Previous date:</strong> ${escapeHtml(
                formatEventTime(previousDate, scheduling.timeZone)
              )}</p>`
            : ""
        }
        <p><strong>${dateLabel}:</strong> ${escapeHtml(
          formatEventTime(scheduledEvent.start_time, scheduling.timeZone)
        )}</p>
        <p><strong>Puppy:</strong> ${escapeHtml(puppyReference)}</p>
        <p><strong>Customer:</strong> ${escapeHtml(
          invitee.name || "Not provided"
        )}</p>
        <p><strong>Phone:</strong> ${escapeHtml(
          invitee.text_reminder_number || "Not provided"
        )}</p>
        <p><strong>Email:</strong> ${escapeHtml(
          invitee.email || "Not provided"
        )}</p>
        ${
          cancellation?.canceled_by
            ? `<p><strong>Canceled by:</strong> ${escapeHtml(
                cancellation.canceled_by
              )}</p>`
            : ""
        }
        ${
          cancellation?.reason
            ? `<p><strong>Cancellation reason:</strong> ${escapeHtml(
                cancellation.reason
              )}</p>`
            : ""
        }
        ${
          location
            ? `<p><strong>Location:</strong> ${escapeHtml(location)}</p>`
            : ""
        }
        ${buildUpcomingTable(appointments, scheduling)}
      </body>
    </html>`;
}

function getContactEmailRecipients() {
  const configuredEmails =
    process.env.CONTACT_EMAIL || process.env.CONTACT_EMAIL_ADDRESS || "";
  const recipients = configuredEmails
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean);

  if (recipients.length === 0) {
    throw new Error(
      "CONTACT_EMAIL or CONTACT_EMAIL_ADDRESS is required when CONTACT_PREFERENCE=email"
    );
  }

  return recipients;
}

function getAdminEmailRecipients(scheduling) {
  const recipients = (scheduling.adminRecipients || [])
    .map((email) => email.trim())
    .filter(Boolean);

  if (recipients.length === 0) {
    throw new Error("At least one scheduling administrator email is required");
  }

  return recipients;
}

function excludeDuplicateRecipients(recipients, excludedRecipients) {
  const excluded = new Set(
    excludedRecipients.map((email) => email.toLowerCase())
  );

  return recipients.filter((email) => !excluded.has(email.toLowerCase()));
}

async function sendEmail({ from, to, subject, html, idempotencyKey }) {
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
    body: JSON.stringify({
      from,
      to,
      subject,
      html,
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    throw new Error(`Breeder scheduling email failed (${response.status})`);
  }
}

async function sendFax(html, notificationType) {
  await sendFaxHtml(html, `puppy-schedule-${notificationType}.html`);
}

export async function sendBreederSchedulingNotification({
  eventKind,
  scheduledEvent,
  previousScheduledEvent = null,
  invitee,
  puppy,
  scheduling,
  notificationType = "scheduled",
}) {
  let appointments;

  try {
    appointments = await getUpcomingAppointments({
      scheduledEvent,
      invitee,
      scheduling,
      puppy,
      notificationType,
    });
  } catch (error) {
    console.error("Unable to build the upcoming Calendly schedule:", error);
    appointments =
      notificationType === "canceled"
        ? []
        : [createAppointmentRow(scheduledEvent, invitee, scheduling, puppy)];
  }

  const html = buildNotificationHtml({
    eventKind,
    scheduledEvent,
    previousScheduledEvent,
    invitee,
    puppy,
    appointments,
    scheduling,
    notificationType,
  });
  const eventId = (invitee.uri || scheduledEvent.uri)
    .split("/")
    .filter(Boolean)
    .pop();
  const eventLabel = eventKind === "pickup" ? "Pickup" : "Visit";
  const actionLabel = {
    scheduled: "scheduled",
    rescheduled: "rescheduled",
    canceled: "canceled",
  }[notificationType];
  const idempotencyPrefix =
    notificationType === "scheduled" ? "schedule" : notificationType;
  const subject = `${eventLabel} ${actionLabel} for ${getPuppyReference(
    invitee,
    puppy
  )}`;
  const adminRecipients = getAdminEmailRecipients(scheduling);

  await sendEmail({
    from: scheduling.emailFrom,
    to: adminRecipients,
    subject: `${subject} (${scheduling.name})`,
    html,
    idempotencyKey: `${idempotencyPrefix}-admin/${eventId}`,
  });

  if (process.env.CONTACT_PREFERENCE?.trim().toLowerCase() === "email") {
    try {
      const contactRecipients = excludeDuplicateRecipients(
        getContactEmailRecipients(),
        adminRecipients
      );

      if (contactRecipients.length > 0) {
        await sendEmail({
          from: scheduling.emailFrom,
          to: contactRecipients,
          subject,
          html,
          idempotencyKey: `${idempotencyPrefix}-contact/${eventId}`,
        });
      }
    } catch (error) {
      console.error(
        "Unable to send the secondary scheduling contact email:",
        error
      );
    }

    return;
  }

  try {
    await sendFax(html, notificationType);
  } catch (error) {
    console.error("Unable to send the secondary scheduling fax:", error);
  }
}

export { getEventKind };
