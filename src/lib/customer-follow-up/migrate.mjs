import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

export const schema = "customer_follow_up";
const migrations = ["001-booking-state.sql", "002-configurable-series.sql"];

/** Versioned, checksummed migrations. The webhook never creates tables itself. */
export async function migrateFollowUps(client) {
  const sources = await Promise.all(
    migrations.map(async (file, index) => {
      const sql = await readFile(
        new URL("./migrations/" + file, import.meta.url),
        "utf8",
      );
      const checksum = createHash("sha256")
        .update(sql.replaceAll("\r\n", "\n"))
        .digest("hex");
      return { version: index + 1, sql, checksum };
    }),
  );
  await client.query("BEGIN");
  try {
    await client.query("SELECT pg_advisory_xact_lock(10608, 2)");
    await client.query("SET LOCAL statement_timeout = '30s'");
    await client.query("SET LOCAL lock_timeout = '5s'");
    await client.query(`CREATE SCHEMA IF NOT EXISTS ${schema}`);
    await client.query(
      `CREATE TABLE IF NOT EXISTS ${schema}.migrations (version integer PRIMARY KEY, checksum text NOT NULL)`,
    );
    for (const migration of sources) {
      const previous = await client.query(
        `SELECT checksum FROM ${schema}.migrations WHERE version = $1`,
        [migration.version],
      );
      if (
        previous.rows.length &&
        previous.rows[0].checksum !== migration.checksum
      )
        throw new Error("Applied follow-up migration has changed");
      if (!previous.rows.length) {
        await client.query(migration.sql);
        await client.query(
          `INSERT INTO ${schema}.migrations (version, checksum) VALUES ($1, $2)`,
          [migration.version, migration.checksum],
        );
      }
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}
