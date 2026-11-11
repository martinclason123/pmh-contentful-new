import "server-only";
import { getFollowUpConfig } from "./config.mjs";
import { createBookingService } from "./booking-service.mjs";
import { createPostgresRepository } from "./postgres.mjs";
import { systemClock } from "./clock.mjs";
import { deliverDue, getDeliveryConfig } from "./deliver-due.mjs";
import {
  extractPuppyChip,
  getCalendlyResource,
} from "../../utils/calendly-webhook";
import { getManagedPuppy } from "../../utils/update-puppy";

export function followUpRuntime() {
  const config = getFollowUpConfig(process.env);
  if (!config.enabled) return null;
  return {
    config,
    repository: createPostgresRepository({ connectionString: config.databaseUrl }),
    clock: systemClock,
    getPuppy: getManagedPuppy,
  };
}

export async function recordCalendlyFollowUp(input) {
  const runtime = followUpRuntime();
  if (!runtime) return { outcome: "disabled" };
  let result;
  try {
    result = await createBookingService({ ...runtime, getCalendlyResource, extractPuppyChip })(input);
  } catch {
    throw new Error("Follow-up booking update failed; webhook must be retried");
  }

  if (result.outcome === "active") {
    try {
      const report = await deliverDue({
        ...runtime, delivery: getDeliveryConfig(process.env), journeyId: result.journey.id,
      });
      if (report.failed) console.error("Immediate pickup email failed; scheduled worker will retry eligible attempts");
    } catch {
      console.error("Immediate pickup email unavailable; scheduled worker will retry eligible attempts");
    }
  }
  return result;
}

export async function sendScheduledFollowUps() {
  const runtime = followUpRuntime();
  return runtime ? deliverDue({ ...runtime, delivery: getDeliveryConfig(process.env) }) : { sent: 0, failed: 0 };
}
