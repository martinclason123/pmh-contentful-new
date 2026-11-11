import { parseArgs } from "node:util";
import {
  identityUrl,
  readDatabaseTargets,
  runDatabaseFoundation,
} from "../test/customer-follow-up/support/database.mjs";

try {
  const { values } = parseArgs({
    options: { "target-production": { type: "boolean", default: false } },
  });
  const targets = await readDatabaseTargets();
  const connectionString = values["target-production"]
    ? identityUrl(targets.production[0])
    : process.env.FOLLOW_UP_TEST_DATABASE_URL;
  if (!connectionString) {
    throw new Error("FOLLOW_UP_TEST_DATABASE_URL is required");
  }
  const report = await runDatabaseFoundation(connectionString, targets);
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
} catch (error) {
  // Driver errors may include connection details. Keep output to safe classes.
  const safeMessages = [
    "FOLLOW_UP_TEST_DATABASE_URL is required",
    "Refusing production database target",
    "Database target is not the approved test database",
    "Invalid test database connection",
    "Invalid test database protocol",
    "Unexpected test database connection parameter",
    "Database rehearsal requires the direct test connection",
  ];
  const failure = safeMessages.includes(error.message)
    ? error.message
    : "Postgres rehearsal failed; check the private test configuration and connectivity";
  process.stdout.write(
    `${JSON.stringify({ scenario: "F04", mode: "postgres", status: "failed", failure }, null, 2)}\n`,
  );
  process.exitCode = 1;
}
