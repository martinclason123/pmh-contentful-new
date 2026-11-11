import assert from "node:assert/strict";
import { test } from "node:test";
import {
  identityUrl,
  readDatabaseTargets,
  runDatabaseFoundation,
  validateDatabaseTarget,
} from "./support/database.mjs";

test("F04: registered test and production identities are distinct", async () => {
  const targets = await readDatabaseTargets();
  validateDatabaseTarget(identityUrl(targets.test), targets);
  assert.notEqual(targets.test.branchId, targets.production[0].branchId);
});

test("F04: production, pooled aliases and unknown targets fail before client creation", async () => {
  const targets = await readDatabaseTargets();
  let clientsCreated = 0;
  const createClient = () => {
    clientsCreated += 1;
    throw new Error("Must never construct a client");
  };
  const production = identityUrl(targets.production[0]);
  const aliases = [
    production,
    production
      .replace("identity@", "different:password@")
      .replace(".c-14.", "-pooler.c-14."),
    "postgresql://user:secret@unknown.test/neondb",
    identityUrl(targets.test).replace(".c-14.", "-pooler.c-14."),
    `${identityUrl(targets.test)}?host=${targets.production[0].host}`,
  ];
  for (const target of aliases) {
    await assert.rejects(runDatabaseFoundation(target, targets, createClient));
  }
  assert.equal(clientsCreated, 0);
});
