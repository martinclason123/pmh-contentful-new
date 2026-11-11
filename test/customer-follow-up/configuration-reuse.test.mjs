import assert from "node:assert/strict";
import { test } from "node:test";
import { getFollowUpConfig } from "../../src/lib/customer-follow-up/config.mjs";
import { createFixtureEnvironment } from "./support/fixtures.mjs";
import { createMemoryRepository } from "./support/memory-repository.mjs";
import { createSchedulingEnvironment } from "./support/scheduling-environment.mjs";
import { blockNetwork } from "./support/harness.mjs";

const otherBreeder = {
  BREEDER_NAME: "Other breeder test fixture",
  ORIGIN_URL: "https://other-breeder.test",
  SCHEDULING_TIME_ZONE: "America/Phoenix",
  SCHEDULING_EMAIL_FROM: "Other breeder <sender@other-breeder.test>",
  CALENDLY_PICKUP_EVENT_TYPE_URI:
    "https://api.calendly.com/event_types/synthetic-other-pickup",
  FOLLOW_UP_REPLY_TO: "replies@other-breeder.test",
  GOOGLE_REVIEW_URL: "https://reviews.test/other-breeder",
  FOLLOW_UP_CONTENT_KEY: "synthetic-other-breeder",
  DATABASE_URL: "postgresql://synthetic:fixture@other-db.test/follow_up_test",
  RESEND_API_KEY: "synthetic-other-resend-key",
};

test("F02: another breeder uses explicit environment values without PMH fallbacks", () => {
  const env = {
    ...createFixtureEnvironment(),
    ...otherBreeder,
    BREEDER_ID: "syntheticOtherBreeder",
  };
  const config = getFollowUpConfig(env);
  assert.equal(config.breederId, env.BREEDER_ID);
  assert.equal(config.breederName, otherBreeder.BREEDER_NAME);
  assert.equal(config.originUrl, otherBreeder.ORIGIN_URL);
  assert.equal(config.timeZone, otherBreeder.SCHEDULING_TIME_ZONE);
  assert.equal(config.emailFrom, otherBreeder.SCHEDULING_EMAIL_FROM);
  assert.equal(config.pickupEventTypeUri, otherBreeder.CALENDLY_PICKUP_EVENT_TYPE_URI);
  assert.equal(config.replyTo, otherBreeder.FOLLOW_UP_REPLY_TO);
  assert.equal(config.reviewUrl, otherBreeder.GOOGLE_REVIEW_URL);
  assert.equal(config.contentKey, otherBreeder.FOLLOW_UP_CONTENT_KEY);
  assert.equal(config.databaseUrl, otherBreeder.DATABASE_URL);
  assert.equal(config.resendApiKey, otherBreeder.RESEND_API_KEY);

  for (const field of Object.keys(otherBreeder)) {
    const incomplete = { ...env };
    delete incomplete[field];
    assert.throws(() => getFollowUpConfig(incomplete), new RegExp(field));
  }
});

test("S15: shared scheduling code honors another timezone and isolates customer stops", async () => {
  const restore = blockNetwork();
  try {
    const repository = createMemoryRepository();
    const pmh = createSchedulingEnvironment({ repository });
    const other = createSchedulingEnvironment({
      repository,
      breederId: "synthetic-m2-config-other",
      overrides: otherBreeder,
    });

    // Same synthetic customer, puppy and provider IDs, but distinct breeders.
    await repository.suppress(pmh.breederId, "customer@pmh.test");
    assert.equal((await pmh.post(pmh.book())).status, 200);
    assert.equal((await other.post(other.book())).status, 200);
    const primary = await pmh.snapshot();
    const secondary = await other.snapshot();
    assert.equal(primary.journeys.length, 1);
    assert.equal(secondary.journeys.length, 1);
    assert.notEqual(primary.journeys[0].id, secondary.journeys[0].id);
    assert.equal(primary.journeys[0].status, "stopped");
    assert.ok(primary.messages.every((message) => message.state === "stopped"));
    assert.equal(secondary.journeys[0].status, "active");
    assert.equal(secondary.messages.length, 3);
    assert.ok(secondary.messages.every((message) => message.state === "pending"));
    assert.equal(
      secondary.messages.find((message) => message.stage === "review").dueAt,
      "2026-11-08T16:00:00.000Z",
    );
    assert.deepEqual(other.errors, []);
  } finally {
    restore();
  }
});
