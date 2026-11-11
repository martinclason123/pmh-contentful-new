import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import pg from "pg";
import { assertTestDatabaseTarget } from "./harness.mjs";

export async function readDatabaseTargets() {
  const path = new URL("../database-targets.json", import.meta.url);
  return JSON.parse(await readFile(path, "utf8"));
}

/** Public endpoint identities are independent of the private test password. */
export function identityUrl(target) {
  return `postgresql://identity@${target.host}:5432/${target.database}`;
}

export function validateDatabaseTarget(connectionString, targets) {
  assertTestDatabaseTarget(connectionString, {
    approvedTestUrl: identityUrl(targets.test),
    productionUrls: targets.production.map(identityUrl),
  });
  const parsed = new URL(connectionString);
  // Drivers can interpret query parameters as connection overrides. Accept
  // only Neon\'s TLS parameters so an allowed hostname cannot redirect SQL.
  for (const key of parsed.searchParams.keys()) {
    if (!["sslmode", "channel_binding"].includes(key)) {
      throw new Error("Unexpected test database connection parameter");
    }
  }
  if (parsed.hostname.includes("-pooler.")) {
    throw new Error("Database rehearsal requires the direct test connection");
  }
}

/**
 * This dedicated test schema proves persistent seed/reset behavior only.
 * It is not the customer journey schema or a production migration.
 * Validate the target before constructing a client or executing any SQL.
 */
export async function runDatabaseFoundation(
  connectionString,
  targets,
  createClient = (options) => new pg.Client(options),
) {
  validateDatabaseTarget(connectionString, targets);
  const secureUrl = new URL(connectionString);
  secureUrl.searchParams.set("sslmode", "verify-full");
  const client = createClient({
    connectionString: secureUrl.toString(),
    connectionTimeoutMillis: 15000,
    application_name: "pmh-follow-up-foundation-test",
    enableChannelBinding: true,
  });
  let transactionOpen = false;
  try {
    await client.connect();
    const database = await client.query("SELECT current_database() AS name");
    assert.equal(database.rows[0].name, targets.test.database);
    await client.query("BEGIN");
    transactionOpen = true;
    await client.query("SET LOCAL statement_timeout = '10s'");
    // Serialize rehearsals so two local runs cannot race on the fixture key.
    await client.query("SELECT pg_advisory_xact_lock(10608, 1)");
    await client.query("CREATE SCHEMA IF NOT EXISTS follow_up_test");
    await client.query(`
      CREATE TABLE IF NOT EXISTS follow_up_test.foundation_fixtures (
        fixture_key TEXT PRIMARY KEY CHECK (fixture_key LIKE 'synthetic-%'),
        email TEXT NOT NULL CHECK (email LIKE '%@%.test'),
        payload JSONB NOT NULL
      )
    `);

    const key = "synthetic-m1-foundation";
    const payload = {
      customer: "Synthetic Customer",
      puppy: "Synthetic Puppy",
    };
    const reset = () =>
      client.query(
        "DELETE FROM follow_up_test.foundation_fixtures WHERE fixture_key = $1",
        [key],
      );
    const read = () =>
      client.query(
        "SELECT email, payload FROM follow_up_test.foundation_fixtures WHERE fixture_key = $1",
        [key],
      );

    for (let run = 0; run < 2; run += 1) {
      // Reset just this tool's fixture; never truncate a database or schema.
      await reset();
      assert.equal((await read()).rows.length, 0);
      await client.query(
        "INSERT INTO follow_up_test.foundation_fixtures (fixture_key, email, payload) VALUES ($1, $2, $3)",
        [key, "customer@pmh.test", payload],
      );
      assert.deepEqual((await read()).rows, [
        { email: "customer@pmh.test", payload },
      ]);
    }
    await reset();
    assert.equal((await read()).rows.length, 0);
    await client.query("COMMIT");
    transactionOpen = false;

    return {
      scenario: "F04",
      mode: "postgres",
      status: "passed",
      projectId: targets.projectId,
      branchId: targets.test.branchId,
      checks: [
        "Approved direct test endpoint verified before connection",
        "TLS certificate verification enabled",
        "Two persistent reset/seed/read cycles matched",
        "Synthetic fixture removed; no production connection",
      ],
      rowsAfterReset: 0,
    };
  } finally {
    if (transactionOpen) {
      await client.query("ROLLBACK").catch(() => {});
    }
    await client.end();
  }
}
