import { createHash } from "node:crypto";
import { stageEligibility } from "./schedule.mjs";
import { stopToken } from "./stop-link.mjs";
import { sendFollowUpEmail } from "./email-delivery.mjs";
import { welcomeEmail } from "./welcome-email.mjs";
import { oneWeekEmail } from "./one-week-email.mjs";
import { reviewEmail } from "./review-email.mjs";
import { pickupDayEmail } from "./pickup-day-email.mjs";

const renderers = new Map([
  ["preparation", welcomeEmail],
  ["pickup-day", pickupDayEmail],
  ["one-week", oneWeekEmail],
  ["review", reviewEmail],
]);

export function getDeliveryConfig(env) {
  const stages = (env.FOLLOW_UP_DELIVERY_STAGES || "").split(",").map((stage) => stage.trim()).filter(Boolean);
  const auditEmail = env.FOLLOW_UP_AUDIT_EMAIL?.trim();
  const content = env.FOLLOW_UP_CONTENT_KEY;
  if (stages.some((stage) => !renderers.has(stage)) ||
      (stages.length && (content !== "pmh-welcome" || !/^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/.test(auditEmail || "")))) {
    throw new Error("Invalid follow-up delivery stages, content or audit inbox");
  }
  return { stages, auditEmail };
}

export async function deliverDue({
  config, delivery, repository, clock, getPuppy, journeyId = null,
  send = sendFollowUpEmail,
}) {
  const report = { sent: 0, failed: 0 };
  if (!config.enabled || !delivery.stages.length) return report;
  // Resend keeps idempotency keys for 24 hours. Stop retries before that window closes.
  const retryHours = Math.min(config.policy.retryWindowHours, 23);
  const maxAttempts = config.policy.maxAttempts;
  const timestamp = () => new Date(clock.now()).toISOString();
  const transact = (action) => repository.transaction(config.breederId, action);
  const stages = journeyId
    ? delivery.stages.filter((id) => config.series.stages.some((stage) => stage.id === id && stage.sendImmediatelyIfDue))
    : delivery.stages;
  if (!stages.length) return report;

  const candidates = await transact((tx) =>
    tx.dueDeliveries(stages, timestamp(), journeyId ? 1 : 10, journeyId, maxAttempts, retryHours));

  async function loadEligible(tx, candidate) {
    const journey = await tx.getJourney(candidate.journeyId);
    if (!journey) return null;
    const message = (await tx.getMessages(journey.id)).find(({stage}) => stage === candidate.stage);
    if (!message || stageEligibility(journey, message, clock.now(), {
      config, suppressed: await tx.isSuppressed(journey.customerEmail),
    }) !== "due") return null;
    const stage = journey.series.stages.find(({ id }) => id === candidate.stage);
    if (journeyId && !stage.sendImmediatelyIfDue) return null;
    return { journey, message, stage };
  }

  for (const candidate of candidates) {
    try {
      const prepared = await transact((tx) => loadEligible(tx, candidate));
      if (!prepared) continue;
      const claim = await transact(async (tx) => {
        const current = await loadEligible(tx, candidate);
        if (!current || current.journey.scheduleVersion !== prepared.journey.scheduleVersion ||
            current.journey.customerEmail !== prepared.journey.customerEmail) return null;
        const attempt = await tx.getAttempt(current.journey.id, candidate.stage);
        const now = clock.now();
        if (attempt && (
          attempt.provider_id || attempt.schedule_version !== current.journey.scheduleVersion ||
          attempt.attempts >= maxAttempts || now - Date.parse(attempt.first_attempt_at) >= retryHours * 3600000 ||
          now - Date.parse(attempt.last_attempt_at) < 120000
        )) return null;
        await tx.reserveAttempt(current.message, timestamp());
        return (attempt?.attempts ?? 0) + 1;
      });
      if (claim === null) continue;
      const puppy = await getPuppy(prepared.journey.puppyChip);
      if (!puppy?.name || String(puppy.chip).trim() !== prepared.journey.puppyChip) throw new Error("Puppy identity mismatch");
      const stopUrl = new URL("/api/follow-up/stop", config.originUrl);
      stopUrl.searchParams.set("token", stopToken(config, prepared.journey));
      const email = await renderers.get(prepared.stage.template)({
        customerName: null, puppyName: puppy.name, pickupAt: prepared.journey.pickupAt,
        timeZone: config.timeZone, breederName: config.breederName, stopUrl: stopUrl.href,
        reviewUrl: config.reviewUrl,
      });
      const sent = await transact(async (tx) => {
        const current = await loadEligible(tx, candidate);
        if (!current || current.journey.scheduleVersion !== prepared.journey.scheduleVersion ||
            current.journey.customerEmail !== prepared.journey.customerEmail) return false;
        const attempt = await tx.getAttempt(current.journey.id, candidate.stage);
        if (!attempt || attempt.attempts !== claim || attempt.provider_id ||
            clock.now() - Date.parse(attempt.first_attempt_at) >= retryHours * 3600000) return false;
        const key = createHash("sha256").update(JSON.stringify([config.breederId, current.journey.id, candidate.stage])).digest("hex");
        const providerId = await send({
          email, customerEmail: current.journey.customerEmail, auditEmail: delivery.auditEmail,
          from: config.emailFrom, replyTo: config.replyTo, apiKey: config.resendApiKey,
          idempotencyKey: `follow-up/${key}`,
        });
        await tx.markSent(current.message, timestamp(), providerId);
        return true;
      });
      if (sent) report.sent++;
    } catch {
      report.failed++;
    }
  }
  return report;
}
