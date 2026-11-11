import assert from "node:assert/strict";
import { getFollowUpConfig } from "../../../src/lib/customer-follow-up/config.mjs";
import {
  FIXTURE_VERSION,
  createFixtureEnvironment,
  createEventFixtures,
  signFixtureEvent,
} from "./fixtures.mjs";
import {
  assertTestDatabaseTarget,
  blockNetwork,
  createEmailCapture,
  createFakeServices,
  createTestClock,
} from "./harness.mjs";

export const implementedScenarios = ["F02", "F03", "F04", "F05"];

/** These reports prove harness contracts, not PMH readiness or the future flow. */
export async function runFoundationScenario(id, { expectedCaptures = 1 } = {}) {
  const clock = createTestClock();
  const report = {
    scenario: id,
    fixtureVersion: FIXTURE_VERSION,
    status: "passed",
    checks: [],
    timeline: [],
  };
  const restoreNetwork = blockNetwork();
  try {
    if (id === "F02") {
      assert.deepEqual(getFollowUpConfig({}), { enabled: false });
      assert.throws(
        () => getFollowUpConfig({ FOLLOW_UP_ENABLED: "true" }),
        /Missing follow-up settings/,
      );
      const fixture = createFixtureEnvironment();
      assert.equal(getFollowUpConfig(fixture).breederId, "syntheticPmh");
      assert.throws(
        () =>
          getFollowUpConfig({ ...fixture, SCHEDULING_TIME_ZONE: "invalid" }),
        /SCHEDULING_TIME_ZONE/,
      );
      report.checks.push(
        "Disabled by default",
        "No breeder fallback",
        "Invalid settings rejected without secret values",
      );
    } else if (id === "F03") {
      const capture = createEmailCapture();
      const services = createFakeServices();
      const event = createEventFixtures().booked;
      const signed = signFixtureEvent(event, clock);
      assert.match(signed.signature, /^t=\d+,v1=[a-f0-9]{64}$/);
      assert.equal(
        (await services.getPuppy(event.payload.tracking.utm_term)).name,
        "Synthetic Puppy",
      );
      assert.equal(
        (await services.getCalendlyResource(event.payload.event)).start_time,
        "2026-10-18T16:00:00.000Z",
      );
      await services.notify("confirmation");
      await services.notify("admin-email");
      await services.notify("fax");
      assert.throws(
        () => globalThis.fetch("https://never-contact.test"),
        /Network disabled/,
      );
      report.timeline.push({
        at: new Date(clock.now()).toISOString(),
        action:
          "Synthetic booking fixture available; no scheduling handler yet",
      });
      clock.advance(24 * 24 * 60 * 60 * 1000);
      await capture.send(
        {
          to: event.payload.email,
          from: "sender@pmh.test",
          subject: "Harness capture demonstration",
          text: "Synthetic message; not a follow-up template",
        },
        { idempotencyKey: "synthetic-capture-demo" },
      );
      assert.equal(capture.messages.length, expectedCaptures);
      report.timeline.push({
        at: new Date(clock.now()).toISOString(),
        action: "Clock advanced 24 days; synthetic transport call captured",
      });
      report.capturedEmails = capture.messages;
      report.checks.push(
        "Network blocked",
        "Calendar and puppy lookups stubbed",
        "Email/fax notifications captured",
        "Instant clock advance",
        "Expected capture count matched",
      );
    } else if (id === "F04") {
      const approvedTestUrl = "postgresql://fixture:secret@test-db.test/test";
      const productionUrl =
        "postgresql://fixture:secret@production-db.test/main";
      assertTestDatabaseTarget(approvedTestUrl, {
        approvedTestUrl,
        productionUrls: [productionUrl],
      });
      assert.throws(
        () =>
          assertTestDatabaseTarget(productionUrl, {
            approvedTestUrl,
            productionUrls: [productionUrl],
          }),
        /Refusing production/,
      );
      const capture = createEmailCapture();
      capture.reset();
      assert.deepEqual(capture.messages, []);
      report.checks.push(
        "Approved test identity accepted",
        "Production identity refused",
        "Capture reset is repeatable; no database reset implemented",
      );
    } else if (id === "F05") {
      assert.deepEqual(createEventFixtures(), createEventFixtures());
      assert.deepEqual(createFixtureEnvironment(), createFixtureEnvironment());
      assert.deepEqual(
        signFixtureEvent(createEventFixtures().booked, clock),
        signFixtureEvent(createEventFixtures().booked, createTestClock()),
      );
      report.checks.push(
        "Fresh fixtures are identical",
        "Signed payloads are deterministic",
      );
    } else {
      throw new Error(
        "Scenario not implemented in M1; F01 and F06 require PMH inputs and joint review",
      );
    }
  } catch (error) {
    report.status = "failed";
    report.failure = error.message;
  } finally {
    restoreNetwork();
  }
  return report;
}
