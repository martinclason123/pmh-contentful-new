import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import http from "node:http";
import https from "node:https";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { getFollowUpConfig } from "../../src/lib/customer-follow-up/config.mjs";
import { systemClock } from "../../src/lib/customer-follow-up/clock.mjs";
import {
  FIXTURE_NOW,
  FIXTURE_SIGNING_KEY,
  createEventFixtures,
  createFixtureEnvironment,
  signFixtureEvent,
} from "./support/fixtures.mjs";
import {
  assertTestDatabaseTarget,
  blockNetwork,
  createEmailCapture,
  createFakeServices,
  createTestClock,
} from "./support/harness.mjs";
import {
  implementedScenarios,
  runFoundationScenario,
} from "./support/scenarios.mjs";

test("F02: follow-ups default off without reading ambient credentials", () => {
  assert.deepEqual(getFollowUpConfig({}), { enabled: false });
  assert.deepEqual(getFollowUpConfig({ FOLLOW_UP_ENABLED: "false" }), {
    enabled: false,
  });
  assert.throws(
    () => getFollowUpConfig({ FOLLOW_UP_ENABLED: "yes" }),
    /true or false/,
  );
  assert.throws(
    () => getFollowUpConfig({ FOLLOW_UP_ENABLED: "true" }),
    /BREEDER_ID/,
  );
});

test("F02: enabled configuration is explicit, complete and immutable", () => {
  const fixture = createFixtureEnvironment();
  const config = getFollowUpConfig(fixture);
  assert.equal(config.breederName, "PMH test fixture");
  assert.deepEqual(config.policy, {
    checkInExpiryDays: 7,
    reviewExpiryDays: 14,
    catchUpSpacingHours: 48,
    maxAttempts: 5,
    retryWindowHours: 24,
    repeatedTime: "first",
    missingTime: "next-valid",
  });
  assert.ok(Object.isFrozen(config));
  assert.ok(Object.isFrozen(config.policy));
  for (const field of Object.keys(fixture).filter(
    (key) => key !== "FOLLOW_UP_ENABLED",
  )) {
    assert.throws(
      () => getFollowUpConfig({ ...fixture, [field]: "" }),
      new RegExp(field),
    );
  }
});

test("F02: invalid values fail without echoing secrets", () => {
  const fixture = createFixtureEnvironment();
  const invalid = {
    ORIGIN_URL: "http://pmh.test",
    SCHEDULING_TIME_ZONE: "not-a-timezone",
    DATABASE_URL: "private-connection-secret",
    GOOGLE_REVIEW_URL: "not-a-url",
    FOLLOW_UP_REPLY_TO: "not-an-address",
    SCHEDULING_EMAIL_FROM: "no address",
    CRON_SECRET: "short",
    FOLLOW_UP_LINK_SECRET: "short",
    FOLLOW_UP_ENROLL_AFTER: "yesterday",
    CALENDLY_PICKUP_EVENT_TYPE_URI: "https://foreign.test/event_types/test",
    FOLLOW_UP_MAX_ATTEMPTS: "0",
    FOLLOW_UP_RETRY_WINDOW_HOURS: "1.5",
    FOLLOW_UP_DST_REPEATED_TIME: "guess",
    FOLLOW_UP_DST_MISSING_TIME: "guess",
  };
  for (const [key, value] of Object.entries(invalid)) {
    assert.throws(
      () => getFollowUpConfig({ ...fixture, [key]: value }),
      (error) => {
        assert.match(error.message, new RegExp(key));
        assert.ok(!error.message.includes(value));
        return true;
      },
    );
  }
});

test("F02: impossible enrollment dates cannot silently normalize", () => {
  const fixture = createFixtureEnvironment();
  for (const date of ["2026-02-30T16:00:00Z", "2026-10-08T24:00:00Z"]) {
    assert.throws(
      () => getFollowUpConfig({ ...fixture, FOLLOW_UP_ENROLL_AFTER: date }),
      /FOLLOW_UP_ENROLL_AFTER/,
    );
  }
});

test("F03: clock advances instantly and rejects invalid movement", () => {
  const clock = createTestClock();
  clock.advance(24 * 24 * 60 * 60 * 1000);
  assert.equal(new Date(clock.now()).toISOString(), "2026-11-01T16:00:00.000Z");
  for (const delta of [-1, NaN, Infinity, 0.5])
    assert.throws(() => clock.advance(delta));
  assert.throws(() => createTestClock("invalid"));
  assert.ok(Math.abs(systemClock.now() - Date.now()) < 1000);
});

test("F03: network guard blocks fetch and native HTTP and restores them", () => {
  const originalFetch = globalThis.fetch;
  const originalRequest = http.request;
  const restore = blockNetwork();
  try {
    assert.throws(
      () => globalThis.fetch("https://pmh.test"),
      /Network disabled/,
    );
    assert.throws(() => http.request("http://pmh.test"), /Network disabled/);
    assert.throws(() => https.get("https://pmh.test"), /Network disabled/);
  } finally {
    restore();
  }
  assert.equal(globalThis.fetch, originalFetch);
  assert.equal(http.request, originalRequest);
});

test("F03: capture rejects real recipients and defensive copies prevent mutation", async () => {
  const capture = createEmailCapture();
  const email = {
    to: "customer@pmh.test",
    from: "PMH <sender@pmh.test>",
    text: "Synthetic",
  };
  await capture.send(email, { idempotencyKey: "fixture-key" });
  email.text = "Changed outside adapter";
  const messages = capture.messages;
  messages[0].email.text = "Changed report";
  assert.equal(capture.messages[0].email.text, "Synthetic");
  for (const field of ["to", "cc", "bcc", "from", "replyTo"]) {
    await assert.rejects(
      capture.send(
        { ...email, [field]: "actual@example.com" },
        { idempotencyKey: "fixture-key" },
      ),
      /synthetic/,
    );
  }
  assert.equal(capture.messages.length, 1);
  capture.reset();
  assert.deepEqual(capture.messages, []);
});

test("F03: fake services never fall back for unknown resources", async () => {
  const services = createFakeServices();
  await assert.rejects(
    services.getCalendlyResource("unknown"),
    /Unknown synthetic/,
  );
  await assert.rejects(services.getPuppy("unknown"), /Unknown synthetic/);
  await assert.rejects(services.notify("unknown"), /Unknown synthetic/);
  const puppy = await services.getPuppy("synthetic-chip");
  puppy.name = "Mutated";
  assert.equal(
    (await services.getPuppy("synthetic-chip")).name,
    "Synthetic Puppy",
  );
});

test("F04: test guard rejects production, aliases and undeclared targets", () => {
  const production = "postgresql://owner:secret@ep-prod.test/main";
  const approvedTestUrl = "postgresql://tester:secret@ep-test.test/main";
  const options = { approvedTestUrl, productionUrls: [production] };
  assertTestDatabaseTarget(approvedTestUrl, options);
  for (const url of [
    production,
    "postgres://other:changed@ep-prod-pooler.test:5432/main",
  ]) {
    assert.throws(() => assertTestDatabaseTarget(url, options), /production/);
  }
  assert.throws(
    () =>
      assertTestDatabaseTarget(
        "postgresql://user:pass@foreign.test/main",
        options,
      ),
    /approved/,
  );
  assert.throws(
    () =>
      assertTestDatabaseTarget(approvedTestUrl, {
        approvedTestUrl,
        productionUrls: [],
      }),
    /declared/,
  );
});

test("F05: fixture events are independent and signatures match exact body bytes", () => {
  const fixtures = createEventFixtures();
  const signed = signFixtureEvent(fixtures.booked, createTestClock());
  const timestamp = Date.parse(FIXTURE_NOW) / 1000;
  const digest = createHmac("sha256", FIXTURE_SIGNING_KEY)
    .update(`${timestamp}.${signed.rawBody}`)
    .digest("hex");
  assert.equal(signed.signature, `t=${timestamp},v1=${digest}`);
  fixtures.booked.payload.email = "changed@pmh.test";
  fixtures.booked.payload.tracking.utm_term = "changed-chip";
  assert.equal(fixtures.canceled.payload.tracking.utm_term, "synthetic-chip");
  assert.equal(createEventFixtures().booked.payload.email, "customer@pmh.test");
  assert.equal(fixtures.canceled.payload.rescheduled, false);
  assert.equal(
    fixtures.rescheduleCanceled.payload.new_invitee,
    fixtures.replacement.payload.uri,
  );
  assert.ok(fixtures.replacement.payload.old_invitee);
});

test("F05: foundation reports repeat exactly and unsupported gates do not pass", async () => {
  for (const id of implementedScenarios) {
    const first = await runFoundationScenario(id);
    assert.equal(first.status, "passed", JSON.stringify(first));
    assert.deepEqual(first, await runFoundationScenario(id));
  }
  assert.equal((await runFoundationScenario("F01")).status, "failed");
  assert.equal((await runFoundationScenario("F06")).status, "failed");
  assert.equal(
    (await runFoundationScenario("F03", { expectedCaptures: 2 })).status,
    "failed",
  );
});

test("F05: CLI exits unsuccessfully on a deliberately wrong expectation", () => {
  const cli = fileURLToPath(
    new URL("../../scripts/simulate-follow-up.mjs", import.meta.url),
  );
  const result = spawnSync(
    process.execPath,
    [cli, "--scenario", "F03", "--expect-captures", "2"],
    { encoding: "utf8" },
  );
  assert.equal(result.status, 1, result.stderr);
  assert.equal(JSON.parse(result.stdout).status, "failed");
});
