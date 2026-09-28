export const schedulingByBreeder = {
  pawPrintsOnMyHeart: {
    name: "Paw Prints on My Heart",
    calendlyUrl: "https://calendly.com/martinclason123/puppy-visit",
    visitEventTypeUri:
      "https://api.calendly.com/event_types/462e06d9-5a64-4351-95ce-6229f9c34670",
    pickupCalendlyUrl:
      "https://calendly.com/martinclason123/puppy-pickup",
    pickupEventTypeUri:
      "https://api.calendly.com/event_types/eda5020e-6e7d-409a-9753-fb04e300b535",
    pickupWindowDays: 30,
    timeZone: "America/Detroit",
    emailFrom: "Paw Prints on My Heart <support@pmhpuppies.com>",
    adminRecipients: ["martin@martinclason.net", "karaclason@gmail.com"],
    supportPhone: "(616) 613-6801",
    trackingSource: "paw_prints_on_my_heart",
  },
};

export function getBreederScheduling(breederId = "pawPrintsOnMyHeart") {
  const defaults = schedulingByBreeder[breederId];

  if (!defaults) {
    return null;
  }

  const pickupWindowDays = Number.parseInt(
    process.env.CALENDLY_PICKUP_WINDOW_DAYS || "",
    10
  );
  const adminRecipients = (process.env.SCHEDULING_ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean);

  return {
    ...defaults,
    name: process.env.BREEDER_NAME || defaults.name,
    calendlyUrl: process.env.CALENDLY_VISIT_URL || defaults.calendlyUrl,
    pickupCalendlyUrl:
      process.env.CALENDLY_PICKUP_URL || defaults.pickupCalendlyUrl,
    visitEventTypeUri:
      process.env.CALENDLY_VISIT_EVENT_TYPE_URI ||
      defaults.visitEventTypeUri,
    pickupEventTypeUri:
      process.env.CALENDLY_PICKUP_EVENT_TYPE_URI ||
      defaults.pickupEventTypeUri,
    pickupWindowDays:
      Number.isInteger(pickupWindowDays) && pickupWindowDays > 0
        ? pickupWindowDays
        : defaults.pickupWindowDays,
    timeZone: process.env.SCHEDULING_TIME_ZONE || defaults.timeZone,
    emailFrom: process.env.SCHEDULING_EMAIL_FROM || defaults.emailFrom,
    adminRecipients:
      adminRecipients.length > 0
        ? adminRecipients
        : defaults.adminRecipients,
    supportPhone:
      process.env.SCHEDULING_SUPPORT_PHONE || defaults.supportPhone,
    trackingSource:
      process.env.SCHEDULING_TRACKING_SOURCE || defaults.trackingSource,
  };
}

export function formatGoHomeDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) {
    return value || "your puppy's go-home date";
  }

  const [year, month, day] = value.split("-").map(Number);

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

export function getPickupSchedulingUrl(
  puppy,
  invitee = {},
  breederId = "pawPrintsOnMyHeart",
  baseUrl
) {
  const scheduling = getBreederScheduling(breederId);
  const url = new URL(baseUrl || scheduling.pickupCalendlyUrl);
  const puppyReference = `${puppy.name} (${puppy.chip})`;

  url.searchParams.set("a1", puppyReference);
  url.searchParams.set("utm_source", scheduling.trackingSource);
  url.searchParams.set("utm_medium", "payment_confirmation");
  url.searchParams.set("utm_campaign", "puppy_pickup");
  url.searchParams.set("utm_content", puppyReference);
  url.searchParams.set("utm_term", puppy.chip);

  if (/^\d{4}-\d{2}-\d{2}$/.test(puppy.available || "")) {
    url.searchParams.set("month", puppy.available.slice(0, 7));
    url.searchParams.set("date", puppy.available);
  }

  if (invitee.name) {
    url.searchParams.set("name", invitee.name);
  }

  if (invitee.email) {
    url.searchParams.set("email", invitee.email);
  }

  return url.toString();
}
