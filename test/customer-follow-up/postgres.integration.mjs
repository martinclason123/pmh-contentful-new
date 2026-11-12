import assert from "node:assert/strict";
import { test, before, after } from "node:test";
import pg from "pg";
import { readFile } from "node:fs/promises";
import { seriesCases } from "./support/series-scenarios.mjs";
import { getFollowUpConfig } from "../../src/lib/customer-follow-up/config.mjs";
import { createFixtureEnvironment } from "./support/fixtures.mjs";
import { migrateFollowUps } from "../../src/lib/customer-follow-up/migrate.mjs";
import { createPostgresRepository } from "../../src/lib/customer-follow-up/postgres.mjs";
import {
  readDatabaseTargets,
  validateDatabaseTarget,
} from "./support/database.mjs";
import { createSchedulingEnvironment } from "./support/scheduling-environment.mjs";
import { schedulingCases } from "./support/scheduling-scenarios.mjs";

const targets = await readDatabaseTargets();
const connection = process.env.FOLLOW_UP_TEST_DATABASE_URL;
if (!connection) throw new Error("FOLLOW_UP_TEST_DATABASE_URL is required");
validateDatabaseTarget(connection, targets); // Must precede pool/client creation.
const url = new URL(connection);
url.searchParams.set("sslmode", "verify-full");
const pool = new pg.Pool({
  connectionString: url.toString(),
  max: 4,
  connectionTimeoutMillis: 15000,
  enableChannelBinding: true,
});
const iso = (value) => (value ? new Date(value).toISOString() : null);
const requireSynthetic = (id) => assert.match(id, /^synthetic-m2-[a-z0-9-]+$/);
const clientFactory = () => {
  let client;
  return {
    async connect() {
      client = await pool.connect();
    },
    query: (...args) => client.query(...args),
    async end() {
      client?.release();
    },
  };
};
const base = createPostgresRepository({
  connectionString: connection,
  createClient: clientFactory,
});
const repository = {
  ...base,
  async snapshot(breederId) {
    requireSynthetic(breederId);
    const journeys = await pool.query(
      "SELECT * FROM customer_follow_up.journeys WHERE breeder_id=$1 ORDER BY id",
      [breederId],
    );
    const messages = await pool.query(
      "SELECT * FROM customer_follow_up.messages WHERE breeder_id=$1 ORDER BY journey_id,stage",
      [breederId],
    );
    const receipts = await pool.query(
      "SELECT receipt_key,outcome FROM customer_follow_up.event_receipts WHERE breeder_id=$1 ORDER BY receipt_key",
      [breederId],
    );
    return {
      journeys: journeys.rows.map((row) => ({
        id: row.id,
        rootInvitee: row.root_invitee,
        currentInvitee: row.current_invitee,
        customerEmail: row.customer_email,
        puppyChip: row.puppy_chip,
        pickupAt: iso(row.pickup_at),
        status: row.status,
        stopReason: row.stop_reason,
        scheduleVersion: row.schedule_version,
        enrolledAt: iso(row.enrolled_at),
        series: row.series_definition,
      })),
      messages: messages.rows.map((row) => ({
        journeyId: row.journey_id,
        stage: row.stage,
        dueAt: iso(row.due_at),
        expiresAt: iso(row.expires_at),
        state: row.state,
        scheduleVersion: row.schedule_version,
        sentAt: iso(row.sent_at),
        stopReason: row.stop_reason,
      })),
      receipts: receipts.rows,
    };
  },
  async markSent(breederId, stage, time) {
    requireSynthetic(breederId);
    await pool.query(
      "UPDATE customer_follow_up.messages SET state='sent',sent_at=$3 WHERE breeder_id=$1 AND stage=$2",
      [breederId, stage, time],
    );
  },
  async stop(breederId) {
    requireSynthetic(breederId);
    await pool.query(
      "UPDATE customer_follow_up.journeys SET status='stopped',stop_reason='staff-no-show' WHERE breeder_id=$1",
      [breederId],
    );
  },
  async suppress(breederId, email) {
    requireSynthetic(breederId);
    await pool.query(
      "INSERT INTO customer_follow_up.suppressions VALUES ($1,$2,'synthetic-test',$3)",
      [breederId, email, "2026-10-08T16:00:00Z"],
    );
  },
};

async function cleanup(breederId) {
  requireSynthetic(breederId);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const table of [
      "messages",
      "journeys",
      "bookings",
      "event_receipts",
      "suppressions",
    ]) {
      await client.query(
        `DELETE FROM customer_follow_up.${table} WHERE breeder_id=$1`,
        [breederId],
      );
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

before(async () => {
  const client = await pool.connect();
  try {
    await migrateFollowUps(client);
    await migrateFollowUps(client); // Rerun must be a checksum-verified no-op.
  } finally {
    client.release();
  }
});
after(() => pool.end());

for (let index = 0; index < schedulingCases.length; index++) {
  const item = schedulingCases[index];
  test(`${item.id}: real Postgres / ${item.variant}`, async () => {
    const breederId = `synthetic-m2-case-${index}`;
    await cleanup(breederId);
    try {
      const env = createSchedulingEnvironment({ repository, breederId });
      await item.run(env);
    } finally {
      await cleanup(breederId);
    }
  });
}

for (let index = 0; index < seriesCases.length; index++) {
  const item = seriesCases[index];
  test("M2a: real Postgres / " + item.variant, async () => {
    const breederId = "synthetic-m2-series-" + index;
    await cleanup(breederId);
    await cleanup(breederId + "-other");
    try {
      await item.run(createSchedulingEnvironment({ repository, breederId }));
    } finally {
      await cleanup(breederId);
      await cleanup(breederId + "-other");
    }
  });
}

test("M2a: forward migration preserves legacy data and accepts generic stage IDs", async () => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    // Rehearse both migrations on populated legacy tables, entirely rolled back.
    // Never reset or drop the real test application's schema.
    const schema = "follow_up_migration_rehearsal";
    await client.query("CREATE SCHEMA " + schema);
    const source = async (file) =>
      (
        await readFile(
          new URL(
            "../../src/lib/customer-follow-up/migrations/" + file,
            import.meta.url,
          ),
          "utf8",
        )
      ).replaceAll("customer_follow_up.", schema + ".");
    await client.query(await source("001-booking-state.sql"));
    await client.query(`INSERT INTO ${schema}.journeys VALUES
      ('synthetic-m2-upgrade','legacy','root','current','customer@pmh.test','synthetic-chip',
       '2026-10-18T16:00:00Z','active',NULL,1,'2026-10-08T16:00:00Z')`);
    await client.query(`INSERT INTO ${schema}.messages VALUES
      ('synthetic-m2-upgrade','legacy','preparation','2026-10-15T16:00:00Z',
       '2026-10-18T16:00:00Z','sent',1,'2026-10-15T16:00:00Z')`);
    await client.query(await source("002-configurable-series.sql"));
    const upgraded = (
      await client.query("SELECT * FROM " + schema + ".journeys")
    ).rows[0];
    assert.deepEqual(
      upgraded.series_definition,
      getFollowUpConfig(createFixtureEnvironment()).series,
    );
    const history = (
      await client.query("SELECT * FROM " + schema + ".messages")
    ).rows[0];
    assert.equal(history.state, "sent");
    assert.equal(iso(history.sent_at), "2026-10-15T16:00:00.000Z");
    await client.query(`INSERT INTO ${schema}.messages
      (breeder_id,journey_id,stage,due_at,expires_at,state,schedule_version)
      VALUES ('synthetic-m2-upgrade','legacy','fourth-custom-email',
      '2026-11-17T17:00:00Z','2026-11-24T17:00:00Z','pending',1)`);
    await client.query("SAVEPOINT invalid_stage");
    await assert.rejects(
      client.query(`UPDATE ${schema}.messages SET stage='bad stage'`),
      { code: "23514" },
    );
    await client.query("ROLLBACK TO SAVEPOINT invalid_stage");
    assert.equal(
      (await client.query("SELECT count(*) FROM " + schema + ".messages"))
        .rows[0].count,
      "2",
    );
  } finally {
    await client.query("ROLLBACK");
    client.release();
  }
});

test("S15: actual unique-stage constraint, transaction rollback and tenant isolation", async () => {
  const breederId = "synthetic-m2-constraints";
  const otherId = "synthetic-m2-other-breeder";
  await cleanup(breederId);
  await cleanup(otherId);
  try {
    const env = createSchedulingEnvironment({ repository, breederId });
    assert.equal((await env.post(env.book())).status, 200);
    await assert.rejects(
      pool.query(
        "INSERT INTO customer_follow_up.messages SELECT * FROM customer_follow_up.messages WHERE breeder_id=$1",
        [breederId],
      ),
      { code: "23505" },
    );
    const beforeState = await repository.snapshot(breederId);
    await assert.rejects(
      repository.transaction(breederId, async (tx) => {
        await tx.putReceipt(
          "synthetic-rollback",
          "must-not-persist",
          "2026-10-08T16:00:00Z",
        );
        throw new Error("Synthetic transaction failure");
      }),
      /Synthetic transaction failure/,
    );
    assert.deepEqual(await repository.snapshot(breederId), beforeState);
    assert.deepEqual(await repository.snapshot(otherId), {
      journeys: [],
      messages: [],
      receipts: [],
    });
    // A fresh repository/client sees the same durable receipt.
    const reopened = createPostgresRepository({
      connectionString: connection,
      createClient: clientFactory,
    });
    assert.equal(
      await reopened.transaction(breederId, (tx) =>
        tx.hasReceipt(beforeState.receipts[0].receipt_key),
      ),
      true,
    );
  } finally {
    await cleanup(breederId);
    await cleanup(otherId);
  }
});

test("S15: no synthetic M2 customer rows remain after the rehearsal", async () => {
  for (const table of [
    "journeys",
    "messages",
    "bookings",
    "event_receipts",
    "suppressions",
  ]) {
    const result = await pool.query(
      `SELECT count(*) FROM customer_follow_up.${table} WHERE breeder_id LIKE 'synthetic-m2-%'`,
    );
    assert.equal(Number(result.rows[0].count), 0);
  }
});

test("PMH pickup-only delivery retries, audits and sends a stage at most once", async () => {
  const { deliverDue, getDeliveryConfig } = await import("../../src/lib/customer-follow-up/deliver-due.mjs");
  const { stopToken, validStopToken } = await import("../../src/lib/customer-follow-up/stop-link.mjs");
  const breederId = "synthetic-m2-delivery";
  await cleanup(breederId);
  try {
    const env = createSchedulingEnvironment({ repository, breederId });
    const booking = env.book("delivery", "2026-10-10T16:00:00Z");
    assert.equal((await env.post(booking)).status, 200);
    const { journeys: [journey] } = await env.snapshot();
    const delivery = getDeliveryConfig({
      FOLLOW_UP_DELIVERY_STAGES: "preparation", FOLLOW_UP_CONTENT_KEY: "pmh-welcome",
      FOLLOW_UP_AUDIT_EMAIL: "audit@pmh.test",
    });
    const payloads = [];
    const options = {
      config: env.config, delivery, repository, clock: env.clock,
      getPuppy: async (chip) => ({ chip, name: "Synthetic Puppy" }),
      send: async (payload) => {
        payloads.push(payload);
        if (payloads.length === 1) throw new Error("Synthetic provider timeout");
        return "synthetic-resend-id";
      },
    };
    assert.deepEqual(await deliverDue({ ...options, journeyId: journey.id }), { sent: 0, failed: 1 });
    assert.deepEqual(await deliverDue(options), { sent: 0, failed: 0 });
    env.clock.advance(120000);
    const concurrent = await Promise.all([deliverDue(options), deliverDue(options)]);
    assert.equal(concurrent.reduce((sum, result) => sum + result.sent, 0), 1);
    assert.equal(payloads.length, 2);
    assert.equal(payloads[0].idempotencyKey, payloads[1].idempotencyKey);
    assert.equal(payloads[1].auditEmail, "audit@pmh.test");
    assert.equal(payloads[1].customerEmail, journey.customerEmail);
    assert.match(payloads[1].email.html, /Click here to watch the pickup video/);
    assert.equal(payloads[1].email.attachments.length, 3);
    const token = stopToken(env.config, journey);
    assert.ok(validStopToken(env.config, journey, token));
    assert.ok(!validStopToken(env.config, journey, token.replace(/.$/, "x")));
    await repository.transaction(breederId, (tx) => tx.suppress(journey.customerEmail, new Date(env.clock.now()).toISOString()));
    const after = await env.snapshot();
    assert.equal(after.messages.find(({stage}) => stage === "preparation").state, "sent");
    assert.deepEqual(after.messages.filter(({stage}) => stage !== "preparation").map(({state}) => state), ["pending", "pending"]);
    env.clock.advance(10 * 86400000);
    assert.deepEqual(await deliverDue(options), { sent: 0, failed: 0 });
    assert.equal(payloads.length, 2);
  } finally {
    await cleanup(breederId);
  }
});

test("PMH pickup-day follows a rescheduled pickup and uses the audited sender", async () => {
  const { deliverDue, getDeliveryConfig } = await import("../../src/lib/customer-follow-up/deliver-due.mjs");
  const breederId = "synthetic-m2-pickup-day";
  await cleanup(breederId);
  try {
    const env = createSchedulingEnvironment({
      repository, breederId, overrides: { FOLLOW_UP_SERIES_KEY: "pmh-pickup-v2" },
    });
    const original = env.book("pickup-day", "2026-10-09T16:00:00Z");
    assert.equal((await env.post(original)).status, 200);
    const replacement = env.book("pickup-day-new", "2026-10-10T16:00:00Z", { previous: original });
    assert.equal((await env.post(replacement)).status, 200);
    const { journeys: [journey], messages } = await env.snapshot();
    assert.equal(messages.find(({stage}) => stage === "pickup-day").dueAt, "2026-10-10T16:00:00.000Z");
    assert.ok(!messages.some(({stage}) => stage === "check-in"));
    const payloads = [];
    const options = {
      config: env.config, repository, clock: env.clock,
      delivery: getDeliveryConfig({
        FOLLOW_UP_DELIVERY_STAGES: "pickup-day",
        FOLLOW_UP_CONTENT_KEY: "pmh-welcome",
        FOLLOW_UP_AUDIT_EMAIL: "audit@pmh.test",
      }),
      getPuppy: async (chip) => ({ chip, name: "Synthetic Puppy" }),
      send: async (payload) => {
        payloads.push(payload);
        return "synthetic-pickup-day-id";
      },
    };
    env.clock.advance(86400000);
    assert.deepEqual(await deliverDue(options), { sent: 0, failed: 0 });
    env.clock.advance(86400000);
    assert.deepEqual(await deliverDue({ ...options, journeyId: journey.id }), { sent: 0, failed: 0 });
    assert.deepEqual(await deliverDue(options), { sent: 1, failed: 0 });
    assert.deepEqual(await deliverDue(options), { sent: 0, failed: 0 });
    assert.equal(payloads.length, 1);
    assert.equal(payloads[0].auditEmail, "audit@pmh.test");
    assert.match(payloads[0].email.text, /616-302-5766/);
    assert.match(payloads[0].email.html, /Stop pickup follow-up emails/);
  } finally {
    await cleanup(breederId);
  }
});

test("PMH one-week email sends seven days after pickup with BCC and leaves old bookings alone", async () => {
  const { deliverDue, getDeliveryConfig } = await import("../../src/lib/customer-follow-up/deliver-due.mjs");
  const breederId = "synthetic-m2-one-week";
  const pickup = "2026-10-10T16:00:00Z";
  await cleanup(breederId);
  try {
    const legacy = createSchedulingEnvironment({ repository, breederId });
    assert.equal((await legacy.post(legacy.book("old-check-in", pickup))).status, 200);
    const env = createSchedulingEnvironment({
      repository, breederId, overrides: { FOLLOW_UP_SERIES_KEY: "pmh-pickup-v3" },
    });
    assert.equal((await env.post(env.book("new-one-week", pickup))).status, 200);
    const { messages } = await env.snapshot();
    const week = messages.filter(({stage}) => stage === "one-week");
    assert.equal(week.length, 1);
    assert.equal(week[0].dueAt, "2026-10-17T16:00:00.000Z");
    assert.equal(messages.filter(({stage}) => stage === "check-in").length, 1);

    const payloads = [];
    const originalFetch = globalThis.fetch;
    try {
      globalThis.fetch = async (url, { body }) => {
        assert.equal(url, "https://api.resend.com/emails");
        payloads.push(JSON.parse(body));
        return Response.json({ id: "synthetic-one-week" });
      };
      const options = {
        config: env.config, repository, clock: env.clock,
        delivery: getDeliveryConfig({
          FOLLOW_UP_DELIVERY_STAGES: "one-week",
          FOLLOW_UP_CONTENT_KEY: "pmh-welcome",
          FOLLOW_UP_AUDIT_EMAIL: "audit@pmh.test",
        }),
        getPuppy: async (chip) => ({ chip, name: "Synthetic Puppy" }),
      };
      env.clock.advance(9 * 86400000 - 1);
      assert.deepEqual(await deliverDue(options), { sent: 0, failed: 0 });
      env.clock.advance(1);
      assert.deepEqual(await deliverDue(options), { sent: 1, failed: 0 });
      assert.deepEqual(await deliverDue(options), { sent: 0, failed: 0 });
    } finally {
      globalThis.fetch = originalFetch;
    }
    assert.equal(payloads.length, 1);
    assert.deepEqual(payloads[0].to, ["customer@pmh.test"]);
    assert.deepEqual(payloads[0].bcc, ["audit@pmh.test"]);
    assert.match(payloads[0].html, /https:\/\/www\.facebook\.com\/profile\.php\?id=61582896891113/);
    assert.match(payloads[0].text, /favorite nap spot/);
  } finally {
    await cleanup(breederId);
  }
});
