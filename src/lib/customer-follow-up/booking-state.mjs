import { createHash } from "node:crypto";
import { instant } from "./schedule.mjs";
import { reconcileJourneyMessages } from "./reconcile-series.mjs";

const keyFor = (value) => createHash("sha256").update(value).digest("hex");
export const normalizeEmail = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase();

/** Merge booking facts monotonically: a delayed create cannot undo a cancellation. */
function mergeBooking(previous, incoming) {
  for (const link of ["previousUri", "nextUri"]) {
    if (previous?.[link] && incoming[link] && previous[link] !== incoming[link])
      throw new Error("Conflicting reschedule link");
  }
  return {
    ...previous,
    ...Object.fromEntries(
      Object.entries(incoming).filter(
        ([, value]) => value !== null && value !== undefined,
      ),
    ),
    seenCreated: Boolean(previous?.seenCreated || incoming.seenCreated),
    canceled: Boolean(previous?.canceled || incoming.canceled),
    rescheduled: Boolean(previous?.rescheduled || incoming.rescheduled),
  };
}

/**
 * Apply one verified observation atomically. The repository serializes updates
 * per breeder, so concurrent webhook deliveries cannot fork a journey.
 * Only durable state changes happen here; notifications and delivery are separate.
 */
export async function recordBookingEvent(event, config, repository, clock) {
  if (!config.enabled) return { outcome: "disabled" };
  return repository.transaction(config.breederId, async (tx) => {
    if (await tx.hasReceipt(event.receiptKey)) return { outcome: "duplicate" };
    for (const observation of event.bookings) {
      await tx.putBooking(
        mergeBooking(await tx.getBooking(observation.uri), observation),
      );
      if (observation.previousUri) {
        await tx.putBooking(
          mergeBooking(await tx.getBooking(observation.previousUri), {
            uri: observation.previousUri,
            nextUri: observation.uri,
            canceled: true,
            rescheduled: true,
          }),
        );
      }
      if (observation.nextUri) {
        await tx.putBooking(
          mergeBooking(await tx.getBooking(observation.nextUri), {
            uri: observation.nextUri,
            previousUri: observation.uri,
          }),
        );
      }
    }
    let root = await tx.getBooking(event.inviteeUri);
    const visited = new Set();
    while (root.previousUri) {
      if (visited.has(root.uri) || visited.size >= 100)
        throw new Error("Invalid reschedule chain");
      visited.add(root.uri);
      root = await tx.getBooking(root.previousUri);
      if (!root) throw new Error("Incomplete reschedule chain");
    }
    let current = root;
    const chain = new Set();
    while (current.nextUri) {
      if (chain.has(current.uri) || chain.size >= 100)
        throw new Error("Invalid reschedule chain");
      chain.add(current.uri);
      current = await tx.getBooking(current.nextUri);
      if (!current) throw new Error("Incomplete reschedule chain");
    }
    const finish = async (outcome) => {
      await tx.putReceipt(
        event.receiptKey,
        outcome,
        new Date(clock.now()).toISOString(),
      );
      return { outcome };
    };
    let journey = await tx.getJourneyByRoot(root.uri);
    // A replacement inherits the original booking's eligibility, never the
    // replacement webhook's delivery time. Missing history is held for replay.
    if (!root.createdAt || !root.seenCreated)
      throw new Error("Original booking history is incomplete");
    if (!journey && instant(root.createdAt) < instant(config.enrollAfter))
      return finish("before-cutover");
    if (!journey && (await tx.countJourneys()) >= config.pilotLimit)
      return finish("outside-pilot");
    if (!root.email || !root.puppyChip)
      throw new Error("Original booking identity is incomplete");
    const suppressed =
      (await tx.isSuppressed(root.email)) ||
      (current.email && (await tx.isSuppressed(current.email)));
    const stopReason =
      journey?.stopReason || (suppressed ? "customer-suppressed" : null);
    const status = stopReason
      ? "stopped"
      : !current.seenCreated || !current.pickupAt || current.rescheduled
        ? "awaiting-replacement"
        : current.canceled
          ? "canceled"
          : "active";
    const pickupAt = current.pickupAt ?? journey?.pickupAt ?? root.pickupAt;
    const changed =
      !journey ||
      journey.currentInvitee !== current.uri ||
      journey.pickupAt !== pickupAt ||
      journey.status !== status;
    journey = {
      id: journey?.id ?? keyFor(config.breederId + ":" + root.uri),
      rootInvitee: root.uri,
      currentInvitee: current.uri,
      customerEmail: current.email ?? root.email,
      puppyChip: root.puppyChip,
      pickupAt,
      status,
      stopReason,
      scheduleVersion: (journey?.scheduleVersion ?? 0) + (changed ? 1 : 0),
      enrolledAt: journey?.enrolledAt ?? new Date(clock.now()).toISOString(),
      series: journey?.series ?? config.series,
    };
    await tx.putJourney(journey);
    await reconcileJourneyMessages(tx, journey, config);
    await tx.putReceipt(
      event.receiptKey,
      status,
      new Date(clock.now()).toISOString(),
    );
    return { outcome: status, journey };
  });
}
