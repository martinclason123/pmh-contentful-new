import { scheduleStages } from "./schedule.mjs";
import { isStageEnabled } from "./series.mjs";

/**
 * Reconcile only the enrolled snapshot. New stages are never backfilled into
 * existing journeys. Sent and individually stopped records are immutable here.
 * Both booking updates and configuration reconciliation use this same rule.
 */
export async function reconcileJourneyMessages(tx, journey, config) {
  const existing = await tx.getMessages(journey.id);
  const planned = journey.pickupAt
    ? scheduleStages(journey.pickupAt, config, journey.series)
    : [];
  const plannedIds = new Set(planned.map((item) => item.stage));
  const suppressed = await tx.isSuppressed(journey.customerEmail);
  const state =
    suppressed || ["stopped", "canceled"].includes(journey.status)
      ? "stopped"
      : journey.status === "active"
        ? "pending"
        : "held";
  let changed = 0;
  for (const item of planned) {
    const old = existing.find((message) => message.stage === item.stage);
    if (old?.state === "sent" || old?.state === "stopped") continue;
    const enabled = isStageEnabled(item.stage, config);
    await tx.putMessage({
      ...item,
      journeyId: journey.id,
      scheduleVersion: journey.scheduleVersion,
      state: enabled ? state : "stopped",
      stopReason: !enabled
        ? "stage-disabled"
        : state === "stopped"
          ? journey.stopReason ||
            (suppressed ? "customer-suppressed" : journey.status)
          : null,
      sentAt: null,
    });
    changed++;
  }
  // Defend against stale/orphaned pending rows; never delete their history.
  for (const old of existing) {
    if (plannedIds.has(old.stage) || ["sent", "stopped"].includes(old.state))
      continue;
    await tx.putMessage({
      ...old,
      state: "stopped",
      stopReason: "stage-removed",
    });
    changed++;
  }
  return changed;
}

/** M4 worker/deploy reconciliation entry point; it never enrolls customers. */
export async function reconcileSeries(config, repository) {
  if (!config.enabled) return { outcome: "disabled", journeys: 0, messages: 0 };
  return repository.transaction(config.breederId, async (tx) => {
    const journeys = await tx.getJourneys();
    let messages = 0;
    for (const journey of journeys)
      messages += await reconcileJourneyMessages(tx, journey, config);
    return { outcome: "reconciled", journeys: journeys.length, messages };
  });
}
