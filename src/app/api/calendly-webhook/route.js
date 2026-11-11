import {
  extractPuppyChip,
  getCalendlyResource,
  verifyCalendlyWebhookSignature,
} from "../../../utils/calendly-webhook";
import { getBreederScheduling } from "../../../data/scheduling";
import { sendPickupScheduledEmails } from "../../../utils/pickup-scheduled-email";
import {
  getEventKind,
  sendBreederSchedulingNotification,
} from "../../../utils/scheduling-notification";
import { getManagedPuppy, updatePuppy } from "../../../utils/update-puppy";

import { createCalendlyWebhookHandler } from "../../../lib/customer-follow-up/calendly-handler.mjs";
import { recordCalendlyFollowUp } from "../../../lib/customer-follow-up/runtime.mjs";

export const runtime = "nodejs";
export const maxDuration = 60;

export const POST = createCalendlyWebhookHandler({
  env: process.env,
  extractPuppyChip,
  getCalendlyResource,
  verifyCalendlyWebhookSignature,
  getBreederScheduling,
  sendPickupScheduledEmails,
  getEventKind,
  sendBreederSchedulingNotification,
  getManagedPuppy,
  updatePuppy,
  recordFollowUp: recordCalendlyFollowUp,
});
