import assert from "node:assert/strict";
import { stageEligibility } from "../../../src/lib/customer-follow-up/schedule.mjs";
import { createSchedulingEnvironment } from "./scheduling-environment.mjs";
import { blockNetwork } from "./harness.mjs";
import { createMemoryRepository } from "./memory-repository.mjs";

export const schedulingCases = [];
const scenario = (id, variant, run) =>
  schedulingCases.push({ id, variant, run });
const accepted = async (env, event) =>
  assert.equal((await env.post(event)).status, 200);
async function single(env, status = "active") {
  const state = await env.snapshot();
  assert.equal(state.journeys.length, 1);
  assert.equal(state.messages.length, 3);
  assert.equal(state.journeys[0].status, status);
  assert.equal(new Set(state.messages.map((row) => row.stage)).size, 3);
  return state;
}
scenario("S01", "normal-future-pickup", async (env) => {
  await accepted(env, env.book());
  const state = await single(env);
  assert.deepEqual(
    state.messages
      .sort((a, b) => a.dueAt.localeCompare(b.dueAt))
      .map((row) => row.dueAt),
    [
      "2026-10-15T16:00:00.000Z",
      "2026-10-25T16:00:00.000Z",
      "2026-11-08T17:00:00.000Z",
    ],
  );
});
for (const [variant, pickup, expected] of [
  ["inside-three-days", "2026-10-10T16:00:00Z", "due"],
  ["exact-three-day-boundary", "2026-10-11T16:00:00Z", "due"],
  ["just-outside", "2026-10-11T16:00:00.001Z", "not-due"],
  ["just-before-pickup", "2026-10-08T16:00:00.001Z", "due"],
])
  scenario("S02", variant, async (env) => {
    const event = env.book("a", pickup);
    await accepted(env, event);
    await accepted(env, event);
    const state = await single(env);
    assert.equal(
      stageEligibility(
        state.journeys[0],
        state.messages.find((row) => row.stage === "preparation"),
        env.clock.now(),
        { config: env.config },
      ),
      expected,
    );
  });
for (const pickup of ["2026-10-07T16:00:00Z", "2026-10-08T16:00:00Z"])
  scenario("S03", "expired-at-" + pickup.slice(8, 10), async (env) => {
    await accepted(env, env.book("a", pickup));
    const state = await single(env);
    assert.equal(
      stageEligibility(
        state.journeys[0],
        state.messages.find((row) => row.stage === "preparation"),
        env.clock.now(),
        { config: env.config },
      ),
      "expired",
    );
  });
scenario("S04", "persisted-DST-schedule", async (env) => {
  await accepted(env, env.book("a", "2026-11-04T06:30:00Z"));
  const state = await single(env);
  assert.equal(
    state.messages.find((row) => row.stage === "preparation").dueAt,
    "2026-11-01T05:30:00.000Z",
  );
});
for (const [variant, options] of [
  [
    "visit",
    { eventType: "https://api.calendly.com/event_types/synthetic-visit" },
  ],
  [
    "unknown-event",
    { eventType: "https://api.calendly.com/event_types/unknown" },
  ],
  ["pre-cutover", { createdAt: "2026-10-08T15:59:59Z" }],
])
  scenario("S05", variant, async (env) => {
    await accepted(env, env.book("a", undefined, options));
    assert.equal((await env.snapshot()).journeys.length, 0);
  });
scenario("S05", "old-booking-rescheduled-after-launch", async (env) => {
  const old = env.book("a", undefined, { createdAt: "2026-10-07T16:00:00Z" });
  const replacement = env.book("b", "2026-10-20T16:00:00Z", { previous: old });
  await accepted(env, replacement);
  assert.equal((await env.snapshot()).journeys.length, 0);
});
scenario("S05", "five-pickup-cap", async (env) => {
  for (let index = 0; index < 6; index++)
    await accepted(env, env.book("root-" + index));
  assert.equal((await env.snapshot()).journeys.length, 5);
});
for (const [variant, options, expected] of [
  ["bad-signature", { signature: "invalid" }, 401],
  ["missing-signature", { signature: "" }, 401],
  [
    "stale-signature",
    { signatureTime: Date.parse("2026-10-08T15:56:59Z") },
    401,
  ],
  ["malformed-json", { rawBody: "{" }, 400],
  ["null-json", { rawBody: "null" }, 400],
])
  scenario("S06", variant, async (env) => {
    assert.equal((await env.post(env.book(), options)).status, expected);
    assert.equal((await env.snapshot()).journeys.length, 0);
  });
for (const field of ["email", "chip", "date", "unmatched"])
  scenario("S06", "missing-or-invalid-" + field, async (env) => {
    const booking = env.book();
    if (field === "email") booking.payload.email = "";
    if (field === "chip") booking.payload.tracking.utm_term = "";
    if (field === "unmatched")
      booking.payload.tracking.utm_term = "not-the-puppy";
    if (field === "date")
      env.setResource(booking.payload.event, {
        ...env.getResource(booking.payload.event),
        start_time: "invalid",
      });
    assert.notEqual((await env.post(booking)).status, 200);
    assert.equal((await env.snapshot()).journeys.length, 0);
  });
scenario("S07", "simultaneous-and-repeated-booking", async (env) => {
  const booking = env.book();
  const responses = await Promise.all(
    Array.from({ length: 4 }, () => env.post(booking)),
  );
  assert.ok(responses.every((response) => response.status === 200));
  const state = await single(env);
  assert.equal(state.receipts.length, 1);
});
scenario("S07", "notification-early-exit-still-enrolls", async (env) => {
  env.alreadyScheduled = true;
  await accepted(env, env.book());
  await single(env);
  assert.equal(env.notifications.length, 0);
});
for (const [variant, pickup] of [
  ["earlier", "2026-10-13T16:00:00Z"],
  ["later", "2026-10-25T16:00:00Z"],
  ["inside-window", "2026-10-09T16:00:00Z"],
])
  scenario("S08", variant, async (env) => {
    const old = env.book();
    await accepted(env, old);
    const replacement = env.book("b", pickup, { previous: old });
    await accepted(env, replacement);
    const state = await single(env);
    assert.equal(state.journeys[0].currentInvitee, replacement.payload.uri);
    assert.equal(state.journeys[0].pickupAt, new Date(pickup).toISOString());
    assert.ok(
      state.messages.every(
        (row) => row.scheduleVersion === state.journeys[0].scheduleVersion,
      ),
    );
  });
scenario("S09", "sent-stage-stays-sent", async (env) => {
  const old = env.book();
  await accepted(env, old);
  await env.repository.markSent(
    env.breederId,
    "preparation",
    "2026-10-15T16:00:00Z",
  );
  const before = (await env.snapshot()).messages.find(
    (row) => row.stage === "preparation",
  );
  await accepted(env, env.book("b", "2026-10-20T16:00:00Z", { previous: old }));
  assert.deepEqual(
    (await single(env)).messages.find((row) => row.stage === "preparation"),
    before,
  );
});
for (const order of ["cancel-first", "create-first"])
  scenario("S10", order, async (env) => {
    const old = env.book();
    await accepted(env, old);
    const replacement = env.book("b", "2026-10-20T16:00:00Z", {
      previous: old,
    });
    const canceled = env.cancel(old, { rescheduled: true, replacement });
    if (order === "cancel-first") {
      await accepted(env, canceled);
      const held = await single(env, "awaiting-replacement");
      assert.ok(held.messages.every((row) => row.state === "held"));
      await accepted(env, replacement);
    } else {
      await accepted(env, replacement);
      await accepted(env, canceled);
    }
    assert.equal(
      (await single(env)).journeys[0].currentInvitee,
      replacement.payload.uri,
    );
  });
scenario("S11", "A-B-C-late-and-duplicate-events", async (env) => {
  const a = env.book();
  await accepted(env, a);
  const b = env.book("b", "2026-10-20T16:00:00Z", { previous: a });
  await accepted(env, b);
  const c = env.book("c", "2026-10-22T16:00:00Z", { previous: b });
  await accepted(env, c);
  await accepted(env, env.cancel(a, { rescheduled: true, replacement: b }));
  await accepted(env, env.cancel(b, { rescheduled: true, replacement: c }));
  await accepted(env, a);
  await accepted(env, b);
  await accepted(env, c);
  assert.equal((await single(env)).journeys[0].currentInvitee, c.payload.uri);
});
for (const sent of [0, 1, 2])
  scenario("S12", "cancel-after-" + sent + "-stages", async (env) => {
    const booking = env.book();
    await accepted(env, booking);
    for (const stage of ["preparation", "check-in"].slice(0, sent))
      await env.repository.markSent(
        env.breederId,
        stage,
        "2026-10-25T16:00:00Z",
      );
    await accepted(env, env.cancel(booking));
    const state = await single(env, "canceled");
    assert.equal(
      state.messages.filter((row) => row.state === "sent").length,
      sent,
    );
    assert.ok(
      state.messages
        .filter((row) => row.state !== "sent")
        .every((row) => row.state === "stopped"),
    );
  });
scenario("S13", "ordinary-cancellation-of-replacement", async (env) => {
  const a = env.book();
  await accepted(env, a);
  const b = env.book("b", "2026-10-20T16:00:00Z", { previous: a });
  await accepted(env, b);
  await accepted(env, env.cancel(b));
  await single(env, "canceled");
  await accepted(env, b);
  await single(env, "canceled");
});
for (const failure of [
  "calendly",
  "contentful",
  "database",
  "notification",
  "confirmation",
])
  scenario("S14", failure + "-failure-and-replay", async (env) => {
    const booking = env.book();
    env.failures.add(failure);
    assert.equal((await env.post(booking)).status, 500);
    assert.equal(
      (await env.snapshot()).journeys.length,
      ["notification", "confirmation"].includes(failure) ? 1 : 0,
    );
    env.failures.clear();
    await accepted(env, booking);
    await single(env);
  });
scenario("S14", "missing-replacement-details-are-held", async (env) => {
  const a = env.book();
  await accepted(env, a);
  await accepted(env, env.cancel(a, { rescheduled: true }));
  await single(env, "awaiting-replacement");
  await accepted(env, env.book("b", "2026-10-20T16:00:00Z", { previous: a }));
  await single(env);
});
scenario("S15", "reload-durable-state-and-receipt", async (env) => {
  const a = env.book();
  await accepted(env, a);
  const before = await env.snapshot();
  const reopened = createSchedulingEnvironment({
    repository: env.repository,
    breederId: env.breederId,
  });
  // The provider's current state is separate from the application process.
  reopened.book();
  await accepted(reopened, a);
  assert.deepEqual(await reopened.snapshot(), before);
});
scenario("S16", "assumed-pickup-and-staff-no-show", async (env) => {
  await accepted(env, env.book());
  const state = await single(env);
  const checkIn = state.messages.find((row) => row.stage === "check-in");
  assert.equal(
    stageEligibility(state.journeys[0], checkIn, Date.parse(checkIn.dueAt), {
      config: env.config,
    }),
    "due",
  );
  await env.repository.stop(env.breederId);
  const stopped = await env.snapshot();
  assert.equal(
    stageEligibility(stopped.journeys[0], checkIn, Date.parse(checkIn.dueAt), {
      config: env.config,
    }),
    "stopped",
  );
});
scenario("S16", "reschedule-moves-post-pickup-eligibility", async (env) => {
  const a = env.book();
  await accepted(env, a);
  const oldCheck = (await env.snapshot()).messages.find(
    (row) => row.stage === "check-in",
  );
  const b = env.book("b", "2026-11-15T17:00:00Z", { previous: a });
  await accepted(env, b);
  const current = await single(env);
  assert.equal(
    stageEligibility(
      current.journeys[0],
      current.messages.find((row) => row.stage === "check-in"),
      Date.parse(oldCheck.dueAt),
      { config: env.config },
    ),
    "not-due",
  );
});
scenario("S05", "disabled-flow-does-not-enroll", async (env) => {
  const disabled = createSchedulingEnvironment({
    repository: env.repository,
    breederId: env.breederId,
    overrides: { FOLLOW_UP_ENABLED: "false" },
  });
  await accepted(disabled, disabled.book());
  assert.equal((await disabled.snapshot()).journeys.length, 0);
});

// Additional ordering/isolation regressions exercise the same cases on Postgres.
scenario("S10", "replacement-arrives-before-original-webhook", async (env) => {
  const a = env.book();
  const b = env.book("b", "2026-10-20T16:00:00Z", { previous: a });
  await accepted(env, b);
  await accepted(env, a);
  assert.equal((await single(env)).journeys[0].currentInvitee, b.payload.uri);
});
scenario("S12", "cancellation-arrives-before-creation", async (env) => {
  const a = env.book();
  await accepted(env, env.cancel(a));
  await accepted(env, a);
  const state = await single(env, "canceled");
  assert.ok(state.messages.every((row) => row.state === "stopped"));
});
scenario("S14", "ancestor-outage-keeps-existing-hold", async (env) => {
  const a = env.book();
  await accepted(env, a);
  const b = env.book("b", "2026-10-20T16:00:00Z", { previous: a });
  await accepted(env, env.cancel(a, { rescheduled: true, replacement: b }));
  const ancestor = env.getResource(a.payload.uri);
  env.setResource(a.payload.uri, null);
  assert.equal((await env.post(b)).status, 500);
  await single(env, "awaiting-replacement");
  env.setResource(a.payload.uri, ancestor);
  await accepted(env, b);
  await single(env);
});
scenario("S16", "staff-stop-survives-reschedule", async (env) => {
  const a = env.book();
  await accepted(env, a);
  await env.repository.stop(env.breederId);
  await accepted(env, env.book("b", "2026-10-20T16:00:00Z", { previous: a }));
  await single(env, "stopped");
});
scenario("S05", "suppression-survives-replacement", async (env) => {
  await env.repository.suppress(env.breederId, "customer@pmh.test");
  const a = env.book();
  await accepted(env, a);
  await single(env, "stopped");
  await accepted(env, env.book("b", "2026-10-20T16:00:00Z", { previous: a }));
  await single(env, "stopped");
});

scenario(
  "S11",
  "refreshed-invitee-holds-unseen-later-replacement",
  async (env) => {
    const a = env.book();
    await accepted(env, a);
    const b = env.book("b", "2026-10-20T16:00:00Z", { previous: a });
    const c = env.book("c", "2026-10-22T16:00:00Z", { previous: b });
    await accepted(env, b);
    const held = await single(env, "awaiting-replacement");
    assert.equal(held.journeys[0].currentInvitee, c.payload.uri);
    assert.ok(held.messages.every((row) => row.state === "held"));
    await accepted(env, c);
    assert.equal((await single(env)).journeys[0].currentInvitee, c.payload.uri);
  },
);

/** Reports call the production handler/service/reducer; no parallel demo scheduler. */
export async function runSchedulingScenario(id) {
  const cases = schedulingCases.filter((item) => item.id === id);
  if (!cases.length)
    return {
      scenario: id,
      status: "failed",
      failure: "Unknown scheduling scenario",
    };
  const restore = blockNetwork();
  const variants = [];
  try {
    for (const item of cases) {
      const env = createSchedulingEnvironment({
        repository: createMemoryRepository(),
      });
      await item.run(env);
      const state = await env.snapshot();
      variants.push({
        variant: item.variant,
        status: "passed",
        journeys: state.journeys.length,
        messages: state.messages
          .map(({ stage, dueAt, state }) => ({ stage, dueAt, state }))
          .sort((a, b) => a.stage.localeCompare(b.stage)),
        capturedExistingNotifications: env.notifications.length,
        followUpEmailsSent: 0,
      });
    }
    return { scenario: id, mode: "memory", status: "passed", variants };
  } catch (error) {
    return {
      scenario: id,
      mode: "memory",
      status: "failed",
      variants,
      failure: error.message,
    };
  } finally {
    restore();
  }
}
