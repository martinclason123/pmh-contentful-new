import http from "node:http";
import https from "node:https";
import net from "node:net";
import tls from "node:tls";
import { syncBuiltinESMExports } from "node:module";
import { FIXTURE_NOW, createEventFixtures } from "./fixtures.mjs";

/** Explicit timestamps prevent tests from depending on the machine's timezone. */
export function createTestClock(initial = FIXTURE_NOW) {
  let current = Date.parse(initial);
  if (!Number.isFinite(current))
    throw new Error("Invalid test clock timestamp");
  return Object.freeze({
    now: () => current,
    advance(milliseconds) {
      if (
        !Number.isSafeInteger(milliseconds) ||
        milliseconds < 0 ||
        !Number.isSafeInteger(current + milliseconds)
      ) {
        throw new Error("Clock advance must be a nonnegative safe integer");
      }
      current += milliseconds;
    },
  });
}

/** Block fetch and native network clients, including existing notification code. */
export function blockNetwork() {
  const originalFetch = globalThis.fetch;
  const entries = [
    [http, "request"],
    [http, "get"],
    [https, "request"],
    [https, "get"],
    [net, "connect"],
    [net, "createConnection"],
    [tls, "connect"],
  ];
  const originals = entries.map(([owner, key]) => owner[key]);
  const deny = () => {
    throw new Error("Network disabled in follow-up simulation");
  };
  globalThis.fetch = deny;
  entries.forEach(([owner, key]) => {
    owner[key] = deny;
  });
  syncBuiltinESMExports();
  return () => {
    globalThis.fetch = originalFetch;
    entries.forEach(([owner, key], index) => {
      owner[key] = originals[index];
    });
    syncBuiltinESMExports();
  };
}

function requireSyntheticAddress(address) {
  const mailbox = /<([^<>]+)>$/.exec(address)?.[1] ?? address;
  if (!/^[^\s@]+@[^\s@]+\.test$/.test(mailbox)) {
    throw new Error("Email capture only accepts synthetic .test addresses");
  }
}

/** Records transport calls; does not simulate scheduling or duplicate prevention. */
export function createEmailCapture() {
  const captured = [];
  return {
    get messages() {
      return structuredClone(captured);
    },
    async send(email, { idempotencyKey }) {
      for (const field of ["to", "cc", "bcc", "from", "replyTo"]) {
        if (email[field])
          for (const address of [email[field]].flat())
            requireSyntheticAddress(address);
      }
      if (!email.to || !idempotencyKey)
        throw new Error(
          "Captured email requires recipient and idempotency key",
        );
      const id = `synthetic-email-${captured.length + 1}`;
      captured.push({ id, email: structuredClone(email), idempotencyKey });
      return { id };
    },
    reset() {
      captured.length = 0;
    },
  };
}

/** Unknown resources fail locally instead of falling back to Calendly/Contentful. */
export function createFakeServices() {
  const fixtures = createEventFixtures();
  const notificationCalls = [];
  return {
    notifications: notificationCalls,
    async getCalendlyResource(uri) {
      const invitees = [fixtures.booked.payload, fixtures.replacement.payload];
      const value =
        fixtures.resources[uri] ??
        invitees.find((invitee) => invitee.uri === uri);
      if (!value) throw new Error("Unknown synthetic Calendly resource");
      return structuredClone(value);
    },
    async getPuppy(chip) {
      if (chip !== fixtures.puppy.chip)
        throw new Error("Unknown synthetic puppy");
      return structuredClone(fixtures.puppy);
    },
    async notify(type) {
      if (!["confirmation", "admin-email", "fax"].includes(type))
        throw new Error("Unknown synthetic notification");
      notificationCalls.push(type);
    },
  };
}

function databaseIdentity(connectionString) {
  let url;
  try {
    url = new URL(connectionString);
  } catch {
    throw new Error("Invalid test database connection");
  }
  if (!["postgres:", "postgresql:"].includes(url.protocol))
    throw new Error("Invalid test database protocol");
  // Neon pooled/unpooled hosts may point to the same database. Credentials are
  // excluded so another password or role cannot bypass the production guard.
  return `${url.hostname.replace(/-pooler(?=\.)/, "")}:${url.port || "5432"}${decodeURIComponent(url.pathname)}`;
}

/** Guard contract for M2; this milestone implements no database reset operation. */
export function assertTestDatabaseTarget(
  target,
  { approvedTestUrl, productionUrls },
) {
  if (
    !approvedTestUrl ||
    !Array.isArray(productionUrls) ||
    productionUrls.length === 0
  ) {
    throw new Error(
      "Test database and production identities must be explicitly declared",
    );
  }
  const identity = databaseIdentity(target);
  if (productionUrls.some((url) => databaseIdentity(url) === identity)) {
    throw new Error("Refusing production database target");
  }
  if (identity !== databaseIdentity(approvedTestUrl))
    throw new Error("Database target is not the approved test database");
}
