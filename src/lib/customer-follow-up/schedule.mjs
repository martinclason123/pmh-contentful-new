import { isStageEnabled, validateSeries } from "./series.mjs";

const DAY = 86400000;
const formatters = new Map();

export function instant(value, field = "timestamp") {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d{1,9})?(?:Z|[+-][0-2]\d:[0-5]\d)$/.test(
      value,
    )
  ) {
    throw new Error(`Invalid ${field}`);
  }
  const date = Date.parse(value);
  const day = new Date(value.slice(0, 10) + "T00:00:00Z");
  if (
    !Number.isFinite(date) ||
    day.toISOString().slice(0, 10) !== value.slice(0, 10)
  )
    throw new Error(`Invalid ${field}`);
  return date;
}

function localStamp(epoch, zone) {
  if (!formatters.has(zone))
    formatters.set(
      zone,
      new Intl.DateTimeFormat("en-US", {
        timeZone: zone,
        calendar: "iso8601",
        numberingSystem: "latn",
        hourCycle: "h23",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
    );
  const parts = Object.fromEntries(
    formatters
      .get(zone)
      .formatToParts(epoch)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, Number(part.value)]),
  );
  return Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
    ((epoch % 1000) + 1000) % 1000,
  );
}

/**
 * Add calendar days, preserving the pickup's local wall time.
 * Resolve folds to their first occurrence; resolve gaps to the first valid
 * local instant, e.g. 02:30 -> 03:00, rather than shifting it to 03:30.
 */
export function addCalendarDays(value, days, zone, policy) {
  const epoch = instant(value);
  if (days === 0) return new Date(epoch).toISOString();
  const target = localStamp(epoch, zone) + days * DAY;
  const offsets = new Set();
  for (let hour = -48; hour <= 48; hour += 6) {
    const probe = target + hour * 3600000;
    offsets.add(localStamp(probe, zone) - probe);
  }
  const candidates = [...offsets]
    .map((offset) => target - offset)
    .filter((candidate) => localStamp(candidate, zone) === target)
    .sort((a, b) => a - b);
  if (candidates.length)
    return new Date(
      policy.repeatedTime === "second" ? candidates.at(-1) : candidates[0],
    ).toISOString();
  if (policy.missingTime !== "next-valid")
    throw new Error("Unsupported missing local time policy");
  // Only gaps use the bounded search. The first represented wall minute after
  // the target is also the first valid instant after that timezone transition.
  let best = null;
  let bestStamp = Infinity;
  for (
    let probe = Math.floor((target - 36 * 3600000) / 60000) * 60000;
    probe <= target + 36 * 3600000;
    probe += 60000
  ) {
    const stamp = localStamp(probe, zone);
    if (
      stamp >= target &&
      (stamp < bestStamp || (stamp === bestStamp && probe < best))
    ) {
      best = probe;
      bestStamp = stamp;
    }
  }
  if (best === null) throw new Error("Local time cannot be resolved");
  return new Date(best).toISOString();
}

/** Calculate dates from a pinned definition, with no stage-name branches. */
export function scheduleStages(pickupAt, config, series = config.series) {
  instant(pickupAt, "pickup time");
  return validateSeries(series)
    .stages.filter((stage) => stage.enabled)
    .map((stage) => {
      const dueAt = addCalendarDays(
        pickupAt,
        stage.offsetDays,
        config.timeZone,
        config.policy,
      );
      const expiresAt = addCalendarDays(
        stage.expiry.anchor === "pickup" ? pickupAt : dueAt,
        stage.expiry.days,
        config.timeZone,
        config.policy,
      );
      return { stage: stage.id, dueAt, expiresAt };
    });
}

/** Shared read-only eligibility rule; the M4 sender must recheck it at submission. */
export function stageEligibility(
  journey,
  message,
  now,
  { config, suppressed = false, paused = false } = {},
) {
  if (message.state === "sent") return "sent";
  if (!config) return "configuration-required";
  if (!config.enabled) return "disabled";
  if (!isStageEnabled(message.stage, config)) return "stage-disabled";
  const stage = journey.series?.stages.find(
    (item) => item.id === message.stage,
  );
  if (!stage?.enabled) return "stage-disabled";
  if (suppressed) return "suppressed";
  if (paused) return "paused";
  if (journey.status !== "active") return journey.status;
  if (message.state !== "pending") return message.state;
  if (message.scheduleVersion !== journey.scheduleVersion) return "stale";
  if (now >= Date.parse(message.expiresAt)) return "expired";
  if (now < Date.parse(message.dueAt)) return "not-due";
  if (stage.requiresPickup && now < Date.parse(journey.pickupAt))
    return "before-pickup";
  return "due";
}
