import { readFile } from "node:fs/promises";
import { createDatabaseClient } from "../src/lib/customer-follow-up/postgres.mjs";
import { migrateFollowUps } from "../src/lib/customer-follow-up/migrate.mjs";

const { production: [target] } = JSON.parse(await readFile(
  new URL("../test/customer-follow-up/database-targets.json", import.meta.url), "utf8",
));
const connection = process.env.DATABASE_URL || "";
let url;
try {
  url = new URL(connection);
} catch {
  throw new Error("Set DATABASE_URL to the direct PMH production connection");
}
if (process.argv[2] !== "--pmh-production" || !["postgres:", "postgresql:"].includes(url.protocol) ||
    url.hostname !== target.host || url.pathname !== "/" + target.database ||
    !url.username || !url.password) {
  throw new Error("Migration requires --pmh-production and the registered direct PMH production database");
}
const client = createDatabaseClient(connection);
try {
  await client.connect();
  await migrateFollowUps(client);
  console.log("PMH production follow-up migrations are current.");
} catch {
  throw new Error("PMH database migration failed. Inspect the connection and schema through Neon.");
} finally {
  await client.end();
}
