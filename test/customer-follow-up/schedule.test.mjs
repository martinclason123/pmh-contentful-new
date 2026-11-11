import assert from "node:assert/strict";
import { test } from "node:test";
import {
  addCalendarDays,
  scheduleStages,
  stageEligibility,
  instant,
} from "../../src/lib/customer-follow-up/schedule.mjs";
import { getFollowUpConfig } from "../../src/lib/customer-follow-up/config.mjs";
import { createFixtureEnvironment } from "./support/fixtures.mjs";

const config = getFollowUpConfig(createFixtureEnvironment());

test("S01: three calendar-day stages retain local pickup time", () => {
  assert.deepEqual(
    scheduleStages("2026-10-18T16:00:00Z", config).map((row) => row.dueAt),
    [
      "2026-10-15T16:00:00.000Z",
      "2026-10-25T16:00:00.000Z",
      "2026-11-08T17:00:00.000Z",
    ],
  );
});

test("S04: DST gap uses the next valid local time, not a one-hour shift", () => {
  assert.equal(
    addCalendarDays("2026-03-11T06:30:00Z", -3, config.timeZone, config.policy),
    "2026-03-08T07:00:00.000Z",
  );
});
test("S04: repeated time uses its first occurrence", () => {
  assert.equal(
    addCalendarDays("2026-11-04T06:30:00Z", -3, config.timeZone, config.policy),
    "2026-11-01T05:30:00.000Z",
  );
});
test("S04: month/year ends, leap day and fractional-hour timezones", () => {
  for (const [pickup, days, zone, expected] of [
    ["2026-01-02T17:00:00Z", -3, "America/Detroit", "2025-12-30T17:00:00.000Z"],
    ["2028-03-03T17:00:00Z", -3, "America/Detroit", "2028-02-29T17:00:00.000Z"],
    ["2026-02-01T12:00:00Z", -3, "Asia/Kathmandu", "2026-01-29T12:00:00.000Z"],
    ["2011-12-27T22:00:00Z", 3, "Pacific/Apia", "2011-12-30T10:00:00.000Z"],
  ])
    assert.equal(addCalendarDays(pickup, days, zone, config.policy), expected);
});
test("S02/S03/S16: exact due/expiry boundaries and latest pickup state", () => {
  const [message] = scheduleStages("2026-10-18T16:00:00Z", config);
  Object.assign(message, { state: "pending", scheduleVersion: 1 });
  const journey = {
    series: config.series,
    status: "active",
    pickupAt: "2026-10-18T16:00:00Z",
    scheduleVersion: 1,
  };
  assert.equal(
    stageEligibility(journey, message, Date.parse(message.dueAt) - 1, {
      config,
    }),
    "not-due",
  );
  assert.equal(
    stageEligibility(journey, message, Date.parse(message.dueAt), { config }),
    "due",
  );
  assert.equal(
    stageEligibility(journey, message, Date.parse(message.expiresAt), {
      config,
    }),
    "expired",
  );
  assert.equal(
    stageEligibility(
      { ...journey, scheduleVersion: 2 },
      message,
      Date.parse(message.dueAt),
      { config },
    ),
    "stale",
  );
  const checkIn = {
    ...scheduleStages(journey.pickupAt, config)[1],
    state: "pending",
    scheduleVersion: 1,
  };
  assert.equal(
    stageEligibility(journey, checkIn, Date.parse(checkIn.dueAt), { config }),
    "due",
  );
  assert.equal(
    stageEligibility(
      { ...journey, status: "stopped" },
      checkIn,
      Date.parse(checkIn.dueAt),
      { config },
    ),
    "stopped",
  );
});
test("S06: impossible dates and missing offsets fail clearly", () => {
  for (const value of [
    "2026-02-30T12:00:00Z",
    "2026-01-01T24:00:00Z",
    "2026-01-01T12:00:00",
    "",
    null,
  ])
    assert.throws(() => instant(value));
});

test("S16: individually held or stopped stages are never due", () => {
  const journey = {
    series: config.series,
    status: "active",
    scheduleVersion: 1,
    pickupAt: "2026-10-18T16:00:00Z",
  };
  const message = {
    ...scheduleStages(journey.pickupAt, config)[0],
    scheduleVersion: 1,
  };
  for (const state of ["held", "stopped", "sent"])
    assert.equal(
      stageEligibility(
        journey,
        { ...message, state },
        Date.parse(message.dueAt),
        { config },
      ),
      state,
    );
});
