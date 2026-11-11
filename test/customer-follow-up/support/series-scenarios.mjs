import assert from "node:assert/strict";
import { blockNetwork } from "./harness.mjs";
import { seriesDefinitions } from "../../../src/lib/customer-follow-up/series-definitions.mjs";
import { reconcileSeries } from "../../../src/lib/customer-follow-up/reconcile-series.mjs";
import { stageEligibility } from "../../../src/lib/customer-follow-up/schedule.mjs";
import { createSchedulingEnvironment } from "./scheduling-environment.mjs";

export function testSeriesDefinitions() {
  const standard = structuredClone(seriesDefinitions["standard-v1"]);
  const fourth = {
    id: "first-month",
    enabled: true,
    offsetDays: 30,
    template: "update",
    contentKey: "first-month",
    expiry: { anchor: "due", days: 7 },
    requiresPickup: true,
    sendImmediatelyIfDue: false,
  };
  const extended = { key: "extended-v2", stages: [...standard.stages, fourth] };
  const removed = {
    key: "removed-v3",
    stages: structuredClone(standard.stages),
  };
  const retimed = structuredClone(extended);
  retimed.key = "retimed-v4";
  retimed.stages.find((stage) => stage.id === "review").offsetDays = 28;
  const disabled = structuredClone(extended);
  disabled.key = "disabled-v5";
  disabled.stages.find((stage) => stage.id === "check-in").enabled = false;
  return {
    "standard-v1": standard,
    "extended-v2": extended,
    "removed-v3": removed,
    "retimed-v4": retimed,
    "disabled-v5": disabled,
    "empty-v6": { key: "empty-v6", stages: [] },
  };
}

function configure(base, key = "extended-v2", overrides = {}) {
  return createSchedulingEnvironment({
    repository: base.repository,
    breederId: base.breederId,
    overrides: { ...base.settings, FOLLOW_UP_SERIES_KEY: key, ...overrides },
    seriesDefinitions: testSeriesDefinitions(),
  });
}
const accepted = async (env, event) =>
  assert.equal((await env.post(event)).status, 200);
const row = (state, stage) =>
  state.messages.find((message) => message.stage === stage);
const eligibility = (state, stage, config) =>
  stageEligibility(
    state.journeys[0],
    row(state, stage),
    Date.parse(row(state, stage).dueAt),
    { config },
  );
export const seriesCases = [];
const scenario = (variant, run) =>
  seriesCases.push({
    id: "X" + String(seriesCases.length + 1).padStart(2, "0"),
    variant,
    run,
  });

for (const order of ["cancel-first", "create-first"])
  scenario("fourth-stage-and-reschedule-" + order, async (base) => {
    const env = configure(base);
    const a = env.book();
    await accepted(env, a);
    await accepted(env, a);
    let state = await env.snapshot();
    assert.equal(state.messages.length, 4);
    assert.equal(row(state, "first-month").dueAt, "2026-11-17T17:00:00.000Z");
    assert.equal(eligibility(state, "first-month", env.config), "due");
    const b = env.book("b", "2026-10-20T16:00:00Z", { previous: a });
    const cancel = env.cancel(a, { rescheduled: true, replacement: b });
    for (const event of order === "cancel-first" ? [cancel, b] : [b, cancel])
      await accepted(env, event);
    state = await env.snapshot();
    assert.equal(state.journeys.length, 1);
    assert.equal(state.journeys[0].series.key, "extended-v2");
    assert.equal(state.messages.length, 4);
    assert.equal(row(state, "first-month").dueAt, "2026-11-19T17:00:00.000Z");
    assert.equal(
      row(state, "first-month").expiresAt,
      "2026-11-26T17:00:00.000Z",
    );
    assert.ok(state.messages.every((message) => message.state === "pending"));
  });

scenario(
  "new-version-does-not-add-or-retime-existing-journeys",
  async (base) => {
    await accepted(base, base.book());
    const changed = configure(base, "retimed-v4");
    await reconcileSeries(changed.config, base.repository);
    let state = await base.snapshot();
    assert.equal(state.messages.length, 3);
    assert.equal(state.journeys[0].series.key, "standard-v1");
    assert.equal(row(state, "review").dueAt, "2026-11-08T17:00:00.000Z");
    const original = changed.book(); // Hydrate the same provider resource after restart.
    await accepted(
      changed,
      changed.book("b", "2026-10-20T16:00:00Z", { previous: original }),
    );
    state = await base.snapshot();
    assert.equal(row(state, "review").dueAt, "2026-11-10T17:00:00.000Z");
    assert.equal(state.messages.length, 3);
    await accepted(changed, changed.book("new-customer"));
    state = await base.snapshot();
    const added = state.journeys.find(
      (journey) => journey.series.key === "retimed-v4",
    );
    assert.ok(added);
    const messages = state.messages.filter(
      (message) => message.journeyId === added.id,
    );
    assert.equal(messages.length, 4);
    assert.equal(
      messages.find((message) => message.stage === "review").dueAt,
      "2026-11-15T17:00:00.000Z",
    );
  },
);

scenario(
  "env-disable-is-immediate-durable-and-cannot-revive-or-resend",
  async (base) => {
    const env = configure(base);
    await accepted(env, env.book());
    await base.repository.markSent(
      base.breederId,
      "preparation",
      "2026-10-15T16:00:00Z",
    );
    const disabled = configure(base, "extended-v2", {
      FOLLOW_UP_DISABLED_STAGES: "check-in",
    });
    const before = await base.snapshot();
    assert.equal(
      eligibility(before, "check-in", disabled.config),
      "stage-disabled",
    );
    await reconcileSeries(disabled.config, base.repository);
    let state = await base.snapshot();
    assert.equal(row(state, "check-in").state, "stopped");
    assert.equal(row(state, "check-in").stopReason, "stage-disabled");
    assert.deepEqual(row(state, "preparation"), row(before, "preparation"));
    await reconcileSeries(env.config, base.repository);
    const a = env.book();
    await accepted(env, env.book("b", "2026-10-20T16:00:00Z", { previous: a }));
    state = await base.snapshot();
    assert.equal(row(state, "check-in").state, "stopped");
    assert.deepEqual(row(state, "preparation"), row(before, "preparation"));
    assert.equal(row(state, "review").state, "pending");
    assert.equal(row(state, "review").dueAt, "2026-11-10T17:00:00.000Z");
  },
);

scenario(
  "remove-stage-without-orphaning-history-or-pending-work",
  async (base) => {
    const env = configure(base);
    await accepted(env, env.book());
    const removed = configure(base, "removed-v3");
    assert.equal(
      eligibility(await base.snapshot(), "first-month", removed.config),
      "stage-disabled",
    );
    await reconcileSeries(removed.config, base.repository);
    const first = await base.snapshot();
    assert.equal(first.messages.length, 4); // Removal retains a stopped history row.
    assert.equal(row(first, "first-month").state, "stopped");
    await reconcileSeries(removed.config, base.repository);
    assert.deepEqual(await base.snapshot(), first);
    await accepted(removed, removed.book("new-customer"));
    const state = await base.snapshot();
    const next = state.journeys.find(
      (journey) => journey.series.key === "removed-v3",
    );
    assert.equal(
      state.messages.filter((message) => message.journeyId === next.id).length,
      3,
    );
    await reconcileSeries(env.config, base.repository);
    assert.equal(row(await base.snapshot(), "first-month").state, "stopped");
  },
);

scenario(
  "definition-enabled-false-blocks-old-and-new-enrollments",
  async (base) => {
    const env = configure(base);
    await accepted(env, env.book());
    const disabled = configure(base, "disabled-v5");
    assert.equal(
      eligibility(await base.snapshot(), "check-in", disabled.config),
      "stage-disabled",
    );
    await reconcileSeries(disabled.config, base.repository);
    await accepted(disabled, disabled.book("new-customer"));
    const state = await base.snapshot();
    assert.equal(row(state, "check-in").state, "stopped");
    const next = state.journeys.find(
      (journey) => journey.series.key === "disabled-v5",
    );
    assert.ok(
      !state.messages.some(
        (message) =>
          message.journeyId === next.id && message.stage === "check-in",
      ),
    );
  },
);

scenario(
  "cancellation-and-sent-history-survive-configuration-changes",
  async (base) => {
    const env = configure(base);
    const a = env.book();
    await accepted(env, a);
    await base.repository.markSent(
      base.breederId,
      "preparation",
      "2026-10-15T16:00:00Z",
    );
    await accepted(env, env.cancel(a));
    const before = await base.snapshot();
    await reconcileSeries(
      configure(base, "removed-v3").config,
      base.repository,
    );
    await reconcileSeries(env.config, base.repository);
    assert.deepEqual(await base.snapshot(), before);
    assert.equal(before.journeys[0].status, "canceled");
    assert.ok(
      before.messages
        .filter((message) => message.stage !== "preparation")
        .every((message) => message.state === "stopped"),
    );
  },
);

scenario("staff-stop-survives-series-reconciliation", async (base) => {
  const env = configure(base);
  await accepted(env, env.book());
  await base.repository.stop(base.breederId);
  await reconcileSeries(configure(base, "retimed-v4").config, base.repository);
  const state = await base.snapshot();
  assert.equal(state.journeys[0].status, "stopped");
  assert.ok(state.messages.every((message) => message.state === "stopped"));
});

scenario("opt-out-blocks-existing-and-future-series", async (base) => {
  const env = configure(base);
  await accepted(env, env.book());
  await base.repository.suppress(base.breederId, "customer@pmh.test");
  await reconcileSeries(env.config, base.repository);
  const next = configure(base, "retimed-v4");
  await accepted(next, next.book("new-customer"));
  await reconcileSeries(next.config, base.repository);
  const state = await base.snapshot();
  assert.ok(state.messages.every((message) => message.state === "stopped"));
  assert.equal(
    state.journeys.find((journey) => journey.series.key === "retimed-v4")
      .status,
    "stopped",
  );
  const message = row(state, "review");
  assert.notEqual(
    stageEligibility(state.journeys[0], message, Date.parse(message.dueAt), {
      config: next.config,
      suppressed: true,
    }),
    "due",
  );
});

scenario("held-reschedule-cannot-revive-disabled-stage", async (base) => {
  const env = configure(base);
  const a = env.book();
  await accepted(env, a);
  const b = env.book("b", "2026-10-20T16:00:00Z", { previous: a });
  await accepted(env, env.cancel(a, { rescheduled: true, replacement: b }));
  assert.ok(
    (await base.snapshot()).messages.every(
      (message) => message.state === "held",
    ),
  );
  const disabled = configure(base, "disabled-v5");
  await reconcileSeries(disabled.config, base.repository);
  await accepted(env, b);
  await accepted(env, b);
  const state = await base.snapshot();
  assert.equal(state.journeys[0].status, "active");
  assert.equal(row(state, "check-in").state, "stopped");
  assert.equal(row(state, "first-month").state, "pending");
});

scenario(
  "removing-all-stages-retains-history-and-creates-no-new-mail",
  async (base) => {
    const env = configure(base);
    await accepted(env, env.book());
    const empty = configure(base, "empty-v6");
    await reconcileSeries(empty.config, base.repository);
    await accepted(empty, empty.book("new-customer"));
    const state = await base.snapshot();
    assert.equal(state.journeys.length, 2);
    assert.equal(state.messages.length, 4);
    assert.ok(state.messages.every((message) => message.state === "stopped"));
  },
);

scenario(
  "expiry-policy-changes-do-not-rewrite-enrolled-snapshots",
  async (base) => {
    await accepted(base, base.book());
    const changed = configure(base, "standard-v1", {
      FOLLOW_UP_CHECK_IN_EXPIRY_DAYS: "30",
    });
    await reconcileSeries(changed.config, base.repository);
    const state = await base.snapshot();
    assert.equal(row(state, "check-in").expiresAt, "2026-11-01T17:00:00.000Z");
    assert.equal(
      state.journeys[0].series.stages.find((stage) => stage.id === "check-in")
        .expiry.days,
      7,
    );
  },
);

scenario(
  "series-reconciliation-does-not-cross-breeder-boundary",
  async (base) => {
    const primary = configure(base);
    const other = createSchedulingEnvironment({
      repository: base.repository,
      breederId: base.breederId + "-other",
    });
    await accepted(primary, primary.book());
    await accepted(other, other.book());
    const before = await other.snapshot();
    await reconcileSeries(configure(base, "empty-v6").config, base.repository);
    assert.deepEqual(await other.snapshot(), before);
    assert.ok(
      (await primary.snapshot()).messages.every(
        (message) => message.state === "stopped",
      ),
    );
  },
);

scenario("configuration-reconciliation-races-with-reschedule", async (base) => {
  const env = configure(base);
  const a = env.book();
  await accepted(env, a);
  const b = env.book("b", "2026-10-20T16:00:00Z", { previous: a });
  const removed = configure(base, "removed-v3");
  await Promise.all([
    accepted(env, b),
    reconcileSeries(removed.config, base.repository),
  ]);
  const state = await base.snapshot();
  assert.equal(state.journeys[0].status, "active");
  assert.equal(state.messages.length, 4);
  assert.equal(row(state, "first-month").state, "stopped");
  assert.equal(row(state, "review").state, "pending");
  assert.equal(row(state, "review").dueAt, "2026-11-10T17:00:00.000Z");
});

scenario("removing-sent-stage-preserves-its-entire-history", async (base) => {
  const env = configure(base);
  await accepted(env, env.book());
  await base.repository.markSent(
    base.breederId,
    "first-month",
    "2026-11-17T17:00:00Z",
  );
  const before = row(await base.snapshot(), "first-month");
  await reconcileSeries(configure(base, "removed-v3").config, base.repository);
  await reconcileSeries(env.config, base.repository);
  assert.deepEqual(row(await base.snapshot(), "first-month"), before);
});

scenario("orphaned-pending-stage-is-stopped-with-history", async (base) => {
  await accepted(base, base.book());
  const before = await base.snapshot();
  await base.repository.transaction(base.breederId, (tx) =>
    tx.putMessage({
      ...row(before, "review"),
      stage: "legacy-extra",
    }),
  );
  await reconcileSeries(base.config, base.repository);
  const message = row(await base.snapshot(), "legacy-extra");
  assert.equal(message.state, "stopped");
  assert.equal(message.stopReason, "stage-removed");
});

/** Deterministic CLI evidence built from the actual scheduling/reconciliation code. */
export async function runSeriesScenario(id) {
  const item = seriesCases.find((scenario) => scenario.id === id);
  if (!item)
    return {
      scenario: id,
      status: "failed",
      failure: "Unknown series scenario",
    };
  const restore = blockNetwork();
  try {
    const env = createSchedulingEnvironment();
    await item.run(env);
    const state = await env.snapshot();
    return {
      scenario: id,
      mode: "memory",
      status: "passed",
      variant: item.variant,
      journeys: state.journeys.map(({ id, status, series }) => ({
        id,
        status,
        seriesKey: series.key,
      })),
      messages: state.messages
        .map(({ stage, state, dueAt, stopReason }) => ({
          stage,
          state,
          dueAt,
          stopReason,
        }))
        .sort(
          (a, b) =>
            a.stage.localeCompare(b.stage) || a.dueAt.localeCompare(b.dueAt),
        ),
      followUpEmailsSent: 0,
    };
  } catch (error) {
    return {
      scenario: id,
      mode: "memory",
      status: "failed",
      failure: error.message,
    };
  } finally {
    restore();
  }
}
