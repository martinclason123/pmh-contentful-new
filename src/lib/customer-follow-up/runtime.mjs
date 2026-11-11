import "server-only";
import { getFollowUpConfig } from "./config.mjs";
import { createBookingService } from "./booking-service.mjs";
import { createPostgresRepository } from "./postgres.mjs";
import { systemClock } from "./clock.mjs";
import {
  extractPuppyChip,
  getCalendlyResource,
} from "../../utils/calendly-webhook";
import { getManagedPuppy } from "../../utils/update-puppy";

/** No connection, enrollment or sending unless explicitly enabled for this breeder. */
export async function recordCalendlyFollowUp(input) {
  const config = getFollowUpConfig(process.env);
  if (!config.enabled) return { outcome: "disabled" };
  try {
    return await createBookingService({
      config,
      repository: createPostgresRepository({
        connectionString: config.databaseUrl,
      }),
      clock: systemClock,
      getCalendlyResource,
      getPuppy: getManagedPuppy,
      extractPuppyChip,
    })(input);
  } catch {
    // Driver/provider errors can include private connection or payload details.
    throw new Error("Follow-up booking update failed; webhook must be retried");
  }
}
