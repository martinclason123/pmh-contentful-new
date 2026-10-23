// Run after npm run build: node --test test/missing-records.integration.mjs
// Content comes from a local fixture API; no CMS writes or checkout actions occur.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { createServer } from "node:http";
import { createServer as createSocketServer } from "node:net";
import { setTimeout as delay } from "node:timers/promises";
import { after, before, test } from "node:test";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const parent = {
  name: "Fixture Parent",
  breed: "Golden Retriever",
  image: "/assets/og/og-image-01.jpg",
  description: "Synthetic test record",
  weight: 50,
  certificationImages: [],
};
const litter = {
  id: "fixture-litter",
  breed: "Golden Retriever",
  hero: "/assets/og/og-image-01.jpg",
  birthdate: "2026-09-01",
  message: "Fixture litter",
  parents: { dam: parent, sire: parent },
};
const puppy = {
  chip: "fixture-puppy",
  name: "Fixture Puppy",
  litter: litter.id,
  breed: [litter.breed],
  gender: "Male",
  hero: litter.hero,
  gallery: [],
  birthdate: litter.birthdate,
  available: "2026-11-01",
  availability: "Available",
  price: 1200,
  description: "Synthetic test record",
  parents: litter.parents,
};

let fixtureServer;
let app;
let origin;
let serverOutput = "";
const fixtureRequests = [];

before(async () => {
  fixtureServer = createServer((req, res) => {
    const url = new URL(req.url, "http://fixture.local");
    fixtureRequests.push(url.pathname + url.search);
    const id = url.searchParams.get("puppyId") || url.searchParams.get("id");
    res.setHeader("Content-Type", "application/json");

    if (id === "upstream-failure") {
      res.writeHead(503).end(JSON.stringify({ error: "Fixture outage" }));
    } else if (url.pathname === "/api/puppy") {
      if (id === puppy.chip) {
        res.end(JSON.stringify({ puppy }));
      } else {
        res.writeHead(404).end(JSON.stringify({ error: "Puppy not found" }));
      }
    } else if (url.pathname === "/api/litters") {
      const records = id === "empty-litter"
        ? [{ ...litter, id }]
        : !id || id === litter.id ? [litter] : [];
      res.end(JSON.stringify({ litters: records }));
    } else if (url.pathname === "/api/puppies") {
      // An existing puppy must still render if its litter-mate list is empty.
      const records = url.searchParams.has("litterId")
        ? []
        : [{ ...puppy, availability: [puppy.availability] }];
      res.end(JSON.stringify({ puppies: records }));
    } else {
      res.writeHead(404).end(JSON.stringify({ error: "Unknown fixture route" }));
    }
  });
  fixtureServer.listen(0, "127.0.0.1");
  await once(fixtureServer, "listening");
  const fixtureOrigin = "http://127.0.0.1:" + fixtureServer.address().port;

  const socket = createSocketServer();
  socket.listen(0, "127.0.0.1");
  await once(socket, "listening");
  const port = socket.address().port;
  await new Promise((resolve) => socket.close(resolve));
  origin = "http://127.0.0.1:" + port;

  app = spawn(process.execPath, [
    "node_modules/next/dist/bin/next", "start", "-H", "127.0.0.1", "-p", String(port),
  ], {
    cwd: root,
    env: { ...process.env, ORIGIN_URL: fixtureOrigin, NEXT_TELEMETRY_DISABLED: "1" },
    windowsHide: true,
    stdio: ["ignore", "pipe", "pipe"],
  });
  app.stdout.on("data", (data) => { serverOutput += data; });
  app.stderr.on("data", (data) => { serverOutput += data; });

  const deadline = Date.now() + 30000;
  while (Date.now() < deadline) {
    assert.equal(app.exitCode, null, "Production test server exited early");
    try {
      await fetch(origin + "/robots.txt", { signal: AbortSignal.timeout(1000) });
      return;
    } catch {
      await delay(100);
    }
  }
  throw new Error("Production test server did not become ready");
}, { timeout: 35000 });

after(async () => {
  if (app && app.exitCode === null && app.signalCode === null) {
    const exited = once(app, "exit");
    app.kill();
    await exited;
  }
  if (fixtureServer) {
    fixtureServer.closeAllConnections();
    await new Promise((resolve) => fixtureServer.close(resolve));
  }
});

const browserAgent = "Mozilla/5.0 Chrome/155.0.0.0 Safari/537.36";
for (const path of [
  "/puppies/missing-puppy",
  "/puppies/undefined",
  "/litters/missing-litter",
  "/litters/puppies",
  "/deposit/missing-puppy",
  "/balance/missing-puppy",
]) {
  test(path + " returns a real 404 with noindex", async () => {
    const response = await fetch(origin + path, {
      headers: { "User-Agent": browserAgent },
    });
    assert.equal(response.status, 404);
    assert.match(await response.text(), /name="robots" content="noindex"/);
  });
}

for (const path of ["/puppies/missing-puppy", "/litters/missing-litter"]) {
  test(path + " returns 404 for crawlers and HEAD requests", async () => {
    const crawler = await fetch(origin + path, {
      headers: { "User-Agent": "Googlebot" },
    });
    assert.equal(crawler.status, 404);
    await crawler.text();
    const head = await fetch(origin + path, { method: "HEAD" });
    assert.equal(head.status, 404);
    assert.equal(await head.text(), "");
  });
}

test("an existing puppy with no litter mates still renders", async () => {
  const response = await fetch(origin + "/puppies/" + puppy.chip);
  assert.equal(response.status, 200);
  assert.match(await response.text(), /Fixture Puppy/);
});

test("an existing litter with no puppies still renders its empty state", async () => {
  const response = await fetch(origin + "/litters/empty-litter");
  assert.equal(response.status, 200);
  assert.match(await response.text(), /No pictures of this litter yet/);
});

for (const path of ["/puppies/upstream-failure", "/litters/upstream-failure"]) {
  test(path + " preserves an upstream outage as a server error", async () => {
    const response = await fetch(origin + path);
    assert.equal(response.status, 500);
    await response.text();
  });
}

test("missing records stop before fetching litter mates or rendering details", () => {
  assert.ok(!fixtureRequests.includes("/api/puppies?litterId=missing-litter"));
  assert.doesNotMatch(serverOutput, /gallery is not iterable|Cannot destructure property 'parents'/);
  assert.doesNotMatch(serverOutput, /Failed to fetch puppy: Not Found/);
});
