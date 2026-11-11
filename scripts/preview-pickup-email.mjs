import { addCalendarDays, stageEligibility } from "../src/lib/customer-follow-up/schedule.mjs";
import { welcomeEmail } from "../src/lib/customer-follow-up/welcome-email.mjs";
import { preparationEmail } from "../src/lib/customer-follow-up/preparation-email.mjs";
import { sendFollowUpEmail } from "../src/lib/customer-follow-up/email-delivery.mjs";
import { createSchedulingEnvironment } from "../test/customer-follow-up/support/scheduling-environment.mjs";

if (process.env.LOCAL_DEPOSIT_TEST !== "true") {
  throw new Error("This command requires LOCAL_DEPOSIT_TEST=true");
}
const auditEmail = process.env.FOLLOW_UP_AUDIT_EMAIL?.trim();
if (!auditEmail || auditEmail !== process.env.LOCAL_TEST_EMAIL?.trim()) {
  throw new Error("The audit inbox must match the configured local test inbox");
}

const env = createSchedulingEnvironment();
const now = Date.now();
env.clock.advance(now - env.clock.now());
const timeZone = "America/Detroit";
const bookingAt = new Date(now).toISOString();
const [variantOrPickup, welcomePickup] = process.argv.slice(2);
const isWelcome = variantOrPickup === "--welcome";
const pickupAt = (isWelcome ? welcomePickup : variantOrPickup) ?? addCalendarDays(bookingAt, 1, timeZone, env.config.policy);
const response = await env.post(env.book("prep-preview", pickupAt, { createdAt: bookingAt }));
if (response.status !== 200) throw new Error(`Sample pickup booking failed (HTTP ${response.status})`);

const { journeys, messages } = await env.snapshot();
const journey = journeys[0];
const message = messages.find(({ stage }) => stage === "preparation");
const stage = journey?.series?.stages.find(({ id }) => id === "preparation");
if (!message || !stage?.sendImmediatelyIfDue ||
    stageEligibility(journey, message, now, { config: env.config }) !== "due") {
  throw new Error("Choose a future pickup less than three days away so preparation is due now");
}

const renderEmail = isWelcome ? welcomeEmail : preparationEmail;
const email = await renderEmail({
  customerName: "Martin",
  puppyName: "Test Puppy",
  pickupAt: journey.pickupAt,
  timeZone,
  breederName: "Paw Prints on My Heart",
});
const id = await sendFollowUpEmail({
  email: isWelcome ? { ...email, subject: "Pickup welcome preview – video button" } : email,
  customerEmail: journey.customerEmail,
  from: process.env.SCHEDULING_EMAIL_FROM || "Paw Prints on My Heart <support@pmhpuppies.com>",
  replyTo: process.env.FOLLOW_UP_REPLY_TO || "support@pmhpuppies.com",
  auditEmail,
  apiKey: process.env.RESEND_API_KEY,
  idempotencyKey: `local-${isWelcome ? "welcome-v4" : "preparation"}-preview/${journey.pickupAt}`,
  preview: true,
});
console.log(JSON.stringify({ pickupAt: journey.pickupAt, dueAt: message.dueAt, subject: email.subject, resendId: id }));
