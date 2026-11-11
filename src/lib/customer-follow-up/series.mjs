import { seriesDefinitions } from "./series-definitions.mjs";

const identifier = /^[a-z][a-z0-9-]{0,63}$/;
// Contract for the M4 renderer. "update" is the reusable text/picture-update
// template; this list does not imply that rendering/delivery exists yet.
const templates = new Set(["preparation", "check-in", "review", "update"]);
const expiryPolicies = new Set(["checkInExpiryDays", "reviewExpiryDays"]);
const integer = (value) =>
  Number.isSafeInteger(value) && Math.abs(value) <= 3650;
const validId = (value) => typeof value === "string" && identifier.test(value);

/** Validate and freeze a self-contained snapshot; no file lookup on reschedule. */
export function validateSeries(series) {
  const invalid = () => {
    throw new Error("Invalid follow-up series definition");
  };
  if (
    !series ||
    !validId(series.key) ||
    !Array.isArray(series.stages) ||
    series.stages.length > 100
  )
    invalid();
  const seen = new Set();
  const stages = series.stages.map((stage) => {
    if (
      !stage ||
      !validId(stage.id) ||
      seen.has(stage.id) ||
      typeof stage.enabled !== "boolean" ||
      !integer(stage.offsetDays) ||
      !templates.has(stage.template) ||
      !validId(stage.contentKey) ||
      typeof stage.requiresPickup !== "boolean" ||
      typeof stage.sendImmediatelyIfDue !== "boolean" ||
      (stage.requiresPickup && stage.offsetDays < 0) ||
      !stage.expiry ||
      !["pickup", "due"].includes(stage.expiry.anchor) ||
      !integer(stage.expiry.days) ||
      stage.expiry.days < 0 ||
      (stage.expiry.anchor === "due" && stage.expiry.days === 0) ||
      (stage.expiry.anchor === "pickup" &&
        stage.expiry.days <= stage.offsetDays)
    )
      invalid();
    seen.add(stage.id);
    return Object.freeze({
      id: stage.id,
      enabled: stage.enabled,
      offsetDays: stage.offsetDays,
      template: stage.template,
      contentKey: stage.contentKey,
      expiry: Object.freeze({ ...stage.expiry }),
      requiresPickup: stage.requiresPickup,
      sendImmediatelyIfDue: stage.sendImmediatelyIfDue,
    });
  });
  return Object.freeze({ key: series.key, stages: Object.freeze(stages) });
}

/** Resolve explicit env selection and policy references once, at enrollment. */
export function resolveSeries(key, policy, definitions = seriesDefinitions) {
  if (!validId(key) || !Object.hasOwn(definitions, key))
    throw new Error("Invalid follow-up setting: FOLLOW_UP_SERIES_KEY");
  const definition = definitions[key];
  if (definition?.key !== key || !Array.isArray(definition.stages))
    throw new Error("Invalid follow-up series definition");
  return validateSeries({
    ...definition,
    stages: definition.stages.map((stage) => {
      const days = stage.expiry?.days;
      return {
        ...stage,
        expiry: {
          ...stage.expiry,
          days:
            typeof days === "string" && expiryPolicies.has(days)
              ? policy[days]
              : days,
        },
      };
    }),
  });
}

/** Removal/disable applies to old versions too, before any DB reconciliation. */
export function isStageEnabled(stageId, config) {
  return Boolean(
    config?.enabled &&
      config.series &&
      !config.disabledStages.includes(stageId) &&
      config.series.stages.some(
        (stage) => stage.id === stageId && stage.enabled,
      ),
  );
}

export function parseDisabledStages(value = "") {
  if (typeof value !== "string")
    throw new Error("Invalid follow-up setting: FOLLOW_UP_DISABLED_STAGES");
  if (!value.trim()) return Object.freeze([]);
  const ids = value.split(",").map((part) => part.trim());
  if (ids.some((id) => !validId(id)) || new Set(ids).size !== ids.length)
    throw new Error("Invalid follow-up setting: FOLLOW_UP_DISABLED_STAGES");
  return Object.freeze(ids);
}
