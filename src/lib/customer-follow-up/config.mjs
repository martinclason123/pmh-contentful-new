import { resolveSeries, parseDisabledStages } from "./series.mjs";

/**
 * Validate explicit breeder settings without reading process.env or connecting
 * to services. Server routes supply their environment explicitly.
 * Error messages name fields only: connection strings and secrets stay private.
 */
export function getFollowUpConfig(env, { seriesDefinitions } = {}) {
  const enabled = env.FOLLOW_UP_ENABLED ?? "false";
  if (enabled !== "true" && enabled !== "false") {
    throw new Error("FOLLOW_UP_ENABLED must be true or false");
  }
  if (enabled === "false") {
    return Object.freeze({ enabled: false });
  }

  const required = [
    "BREEDER_ID",
    "BREEDER_NAME",
    "ORIGIN_URL",
    "SCHEDULING_TIME_ZONE",
    "SCHEDULING_EMAIL_FROM",
    "CALENDLY_PICKUP_EVENT_TYPE_URI",
    "FOLLOW_UP_REPLY_TO",
    "GOOGLE_REVIEW_URL",
    "FOLLOW_UP_CONTENT_KEY",
    "FOLLOW_UP_SERIES_KEY",
    "DATABASE_URL",
    "RESEND_API_KEY",
    "CRON_SECRET",
    "FOLLOW_UP_LINK_SECRET",
    "FOLLOW_UP_ENROLL_AFTER",
    "FOLLOW_UP_PILOT_LIMIT",
    "FOLLOW_UP_CHECK_IN_EXPIRY_DAYS",
    "FOLLOW_UP_REVIEW_EXPIRY_DAYS",
    "FOLLOW_UP_CATCH_UP_SPACING_HOURS",
    "FOLLOW_UP_MAX_ATTEMPTS",
    "FOLLOW_UP_RETRY_WINDOW_HOURS",
    "FOLLOW_UP_DST_REPEATED_TIME",
    "FOLLOW_UP_DST_MISSING_TIME",
  ];
  const missing = required.filter((key) => !String(env[key] ?? "").trim());
  if (missing.length) {
    throw new Error(`Missing follow-up settings: ${missing.join(", ")}`);
  }

  function requireValid(key, valid) {
    if (!valid) {
      throw new Error(`Invalid follow-up setting: ${key}`);
    }
  }
  function url(key, protocols) {
    let parsed;
    try {
      parsed = new URL(env[key]);
    } catch {
      requireValid(key, false);
    }
    requireValid(
      key,
      protocols.includes(parsed.protocol) && Boolean(parsed.hostname),
    );
    return parsed;
  }
  function positiveInteger(key) {
    requireValid(key, /^\d+$/.test(env[key]));
    const value = Number(env[key]);
    requireValid(key, Number.isSafeInteger(value) && value > 0);
    return value;
  }

  requireValid("BREEDER_ID", /^[a-zA-Z][a-zA-Z0-9_-]*$/.test(env.BREEDER_ID));
  url("ORIGIN_URL", ["https:"]);
  url("GOOGLE_REVIEW_URL", ["https:"]);
  const eventType = url("CALENDLY_PICKUP_EVENT_TYPE_URI", ["https:"]);
  requireValid(
    "CALENDLY_PICKUP_EVENT_TYPE_URI",
    eventType.hostname === "api.calendly.com" &&
      /^\/event_types\/[^/]+$/.test(eventType.pathname),
  );
  const database = url("DATABASE_URL", ["postgres:", "postgresql:"]);
  requireValid(
    "DATABASE_URL",
    Boolean(database.username) && database.pathname.length > 1,
  );
  requireValid(
    "FOLLOW_UP_REPLY_TO",
    /^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(env.FOLLOW_UP_REPLY_TO),
  );
  requireValid(
    "SCHEDULING_EMAIL_FROM",
    /(?:^|<)[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+>?$/.test(env.SCHEDULING_EMAIL_FROM),
  );
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: env.SCHEDULING_TIME_ZONE });
  } catch {
    requireValid("SCHEDULING_TIME_ZONE", false);
  }
  requireValid("CRON_SECRET", env.CRON_SECRET.length >= 32);
  requireValid("FOLLOW_UP_LINK_SECRET", env.FOLLOW_UP_LINK_SECRET.length >= 32);
  const cutover = env.FOLLOW_UP_ENROLL_AFTER;
  requireValid(
    "FOLLOW_UP_ENROLL_AFTER",
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(cutover) &&
      Number.isFinite(Date.parse(cutover)),
  );
  // Date.parse normalizes some impossible dates. Reject those rather than
  // silently moving the enrollment boundary to another calendar day.
  requireValid(
    "FOLLOW_UP_ENROLL_AFTER",
    new Date(cutover).toISOString() ===
      (cutover.includes(".") ? cutover : cutover.replace("Z", ".000Z")),
  );
  requireValid(
    "FOLLOW_UP_DST_REPEATED_TIME",
    ["first", "second"].includes(env.FOLLOW_UP_DST_REPEATED_TIME),
  );
  requireValid(
    "FOLLOW_UP_DST_MISSING_TIME",
    env.FOLLOW_UP_DST_MISSING_TIME === "next-valid",
  );

  const policy = Object.freeze({
    checkInExpiryDays: positiveInteger("FOLLOW_UP_CHECK_IN_EXPIRY_DAYS"),
    reviewExpiryDays: positiveInteger("FOLLOW_UP_REVIEW_EXPIRY_DAYS"),
    catchUpSpacingHours: positiveInteger("FOLLOW_UP_CATCH_UP_SPACING_HOURS"),
    maxAttempts: positiveInteger("FOLLOW_UP_MAX_ATTEMPTS"),
    retryWindowHours: positiveInteger("FOLLOW_UP_RETRY_WINDOW_HOURS"),
    repeatedTime: env.FOLLOW_UP_DST_REPEATED_TIME,
    missingTime: env.FOLLOW_UP_DST_MISSING_TIME,
  });
  const series = resolveSeries(
    env.FOLLOW_UP_SERIES_KEY,
    policy,
    seriesDefinitions,
  );
  const disabledStages = parseDisabledStages(env.FOLLOW_UP_DISABLED_STAGES);

  return Object.freeze({
    enabled: true,
    series,
    disabledStages,
    breederId: env.BREEDER_ID,
    breederName: env.BREEDER_NAME,
    originUrl: env.ORIGIN_URL,
    timeZone: env.SCHEDULING_TIME_ZONE,
    emailFrom: env.SCHEDULING_EMAIL_FROM,
    pickupEventTypeUri: env.CALENDLY_PICKUP_EVENT_TYPE_URI,
    replyTo: env.FOLLOW_UP_REPLY_TO,
    reviewUrl: env.GOOGLE_REVIEW_URL,
    contentKey: env.FOLLOW_UP_CONTENT_KEY,
    databaseUrl: env.DATABASE_URL,
    resendApiKey: env.RESEND_API_KEY,
    cronSecret: env.CRON_SECRET,
    linkSecret: env.FOLLOW_UP_LINK_SECRET,
    enrollAfter: env.FOLLOW_UP_ENROLL_AFTER,
    pilotLimit: env.FOLLOW_UP_PILOT_LIMIT === "unlimited"
      ? Infinity
      : positiveInteger("FOLLOW_UP_PILOT_LIMIT"),
    policy,
  });
}
