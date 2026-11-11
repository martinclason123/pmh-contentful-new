import assert from "node:assert/strict";
import { test } from "node:test";
import { getFollowUpConfig } from "../../src/lib/customer-follow-up/config.mjs";
import {
  resolveSeries,
  validateSeries,
} from "../../src/lib/customer-follow-up/series.mjs";
import {
  stageEligibility,
  scheduleStages,
} from "../../src/lib/customer-follow-up/schedule.mjs";
import { reconcileSeries } from "../../src/lib/customer-follow-up/reconcile-series.mjs";
import { createFixtureEnvironment } from "./support/fixtures.mjs";
import { createSchedulingEnvironment } from "./support/scheduling-environment.mjs";
import { blockNetwork } from "./support/harness.mjs";
import { seriesCases } from "./support/series-scenarios.mjs";

for (const item of seriesCases)
  test("M2a: " + item.variant, async () => {
    const restore = blockNetwork();
    try {
      await item.run(createSchedulingEnvironment());
    } finally {
      restore();
    }
  });

const config = getFollowUpConfig(createFixtureEnvironment());
const invalidChanges = [
  ["duplicate IDs", (series) => series.stages.push(series.stages[0])],
  [
    "unsafe ID",
    (series) => {
      series.stages[0].id = "private-invalid-id!";
    },
  ],
  [
    "unknown template",
    (series) => {
      series.stages[0].template = "private-unknown-template";
    },
  ],
  [
    "missing content reference",
    (series) => {
      delete series.stages[0].contentKey;
    },
  ],
  [
    "missing enabled flag",
    (series) => {
      delete series.stages[0].enabled;
    },
  ],
  [
    "fractional offset",
    (series) => {
      series.stages[0].offsetDays = 1.5;
    },
  ],
  [
    "unbounded offset",
    (series) => {
      series.stages[0].offsetDays = Infinity;
    },
  ],
  [
    "invalid expiry anchor",
    (series) => {
      series.stages[0].expiry.anchor = "unknown";
    },
  ],
  [
    "expiry before due",
    (series) => {
      series.stages[1].expiry = { anchor: "pickup", days: 1 };
    },
  ],
  [
    "zero due expiry",
    (series) => {
      series.stages[1].expiry.days = 0;
    },
  ],
  [
    "missing pickup rule",
    (series) => {
      delete series.stages[0].requiresPickup;
    },
  ],
  [
    "contradictory pickup rule",
    (series) => {
      series.stages[0].requiresPickup = true;
    },
  ],
  [
    "missing immediate rule",
    (series) => {
      delete series.stages[0].sendImmediatelyIfDue;
    },
  ],
];
for (const [name, change] of invalidChanges)
  test("M2a: reject " + name + " before enrollment", () => {
    const series = structuredClone(config.series);
    change(series);
    assert.throws(() => validateSeries(series), {
      message: "Invalid follow-up series definition",
    });
  });

test("M2a: series selection is explicit and disabled-stage syntax is validated", () => {
  for (const key of ["", "missing-version", "__proto__"])
    assert.throws(
      () =>
        getFollowUpConfig({
          ...createFixtureEnvironment(),
          FOLLOW_UP_SERIES_KEY: key,
        }),
      /FOLLOW_UP_SERIES_KEY/,
    );
  for (const list of ["review,", "review,review", "bad id", "__proto__"])
    assert.throws(
      () =>
        getFollowUpConfig({
          ...createFixtureEnvironment(),
          FOLLOW_UP_DISABLED_STAGES: list,
        }),
      /FOLLOW_UP_DISABLED_STAGES/,
    );
  assert.deepEqual(
    getFollowUpConfig({
      ...createFixtureEnvironment(),
      FOLLOW_UP_DISABLED_STAGES: "check-in, review",
    }).disabledStages,
    ["check-in", "review"],
  );
  assert.ok(Object.isFrozen(config.series));
  assert.ok(Object.isFrozen(config.series.stages));
  assert.ok(Object.isFrozen(config.series.stages[0].expiry));
});

test("M2a: eligibility requires current configuration, including after a candidate was selected", async () => {
  const env = createSchedulingEnvironment();
  await env.post(env.book());
  const state = await env.snapshot();
  const message = state.messages.find((item) => item.stage === "review");
  const now = Date.parse(message.dueAt);
  assert.equal(
    stageEligibility(state.journeys[0], message, now),
    "configuration-required",
  );
  assert.equal(
    stageEligibility(state.journeys[0], message, now, { config }),
    "due",
  );
  const disabled = getFollowUpConfig({
    ...createFixtureEnvironment(),
    FOLLOW_UP_DISABLED_STAGES: "review",
  });
  assert.equal(
    stageEligibility(state.journeys[0], message, now, { config: disabled }),
    "stage-disabled",
  );
  assert.equal(
    stageEligibility(state.journeys[0], message, now, {
      config: { enabled: false },
    }),
    "disabled",
  );
  assert.equal(
    stageEligibility(state.journeys[0], message, now, { config, paused: true }),
    "paused",
  );
});

test("M2a: zero-day expiry preserves the exact repeated-time pickup instant", () => {
  const stages = scheduleStages("2026-11-01T06:30:00Z", config);
  assert.equal(stages[0].expiresAt, "2026-11-01T06:30:00.000Z");
});

test("M2a: invalid policy reference fails without leaking configuration", () => {
  const definition = structuredClone(config.series);
  definition.stages[1].expiry.days = "private-policy-value";
  assert.throws(
    () =>
      resolveSeries(definition.key, config.policy, {
        [definition.key]: definition,
      }),
    { message: "Invalid follow-up series definition" },
  );
});

test("M2a: disabled reconciliation never touches storage", async () => {
  assert.deepEqual(
    await reconcileSeries(
      { enabled: false },
      {
        transaction() {
          throw new Error("Must not connect");
        },
      },
    ),
    { outcome: "disabled", journeys: 0, messages: 0 },
  );
});
