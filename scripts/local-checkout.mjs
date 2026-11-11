import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const port = "3000";
const origin = `http://127.0.0.1:${port}`;
const stripeKey = process.env.STRIPE_SECRET_KEY || "";
const publicKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "";
if (!stripeKey.startsWith("sk_test_") || !publicKey.startsWith("pk_test_")) {
  throw new Error("Local checkout requires a Stripe test secret and publishable key.");
}
if (!process.env.LOCAL_TEST_EMAIL?.trim() || !process.env.RESEND_API_KEY) {
  throw new Error("Set LOCAL_TEST_EMAIL and RESEND_API_KEY in .env.local.");
}

const bundledCli = resolve(".local-checkout/stripe");
const stripe = spawn(existsSync(bundledCli) ? bundledCli : "stripe", [
  "listen", "--events", "checkout.session.completed",
  "--forward-to", `http://127.0.0.1:${port}/api/payment-webhook`,
  "--color", "off",
], {
  env: { PATH: process.env.PATH, HOME: process.env.HOME, STRIPE_API_KEY: stripeKey },
  stdio: ["ignore", "pipe", "pipe"],
});

let next;
let stopped = false;
const timer = setTimeout(() => stop("Timed out waiting for the Stripe listener.", 1), 30000);

function stop(message, code) {
  if (stopped) return;
  stopped = true;
  clearTimeout(timer);
  if (message) console.error(message);
  next?.kill();
  stripe.kill();
  process.exitCode = code;
}

for (const stream of [stripe.stdout, stripe.stderr]) {
  let pending = "";
  stream.setEncoding("utf8").on("data", (chunk) => {
    pending += chunk;
    const lines = pending.split(/\r?\n/);
    pending = lines.pop();
    for (const line of lines) {
      const signingSecret = line.match(/\bwhsec_[A-Za-z0-9]+\b/)?.[0];
      if (signingSecret && !next && !stopped) {
        clearTimeout(timer);
        console.log("Stripe test webhook listener is connected.");
        next = spawn(process.execPath, [
          "node_modules/next/dist/bin/next", "dev", "--hostname", "127.0.0.1", "--port", port,
        ], {
          env: {
            ...process.env,
            NODE_ENV: "development",
            LOCAL_DEPOSIT_TEST: "true",
            ORIGIN_URL: origin,
            FOLLOW_UP_ENABLED: "false",
            STRIPE_WEBHOOK_SECRET: signingSecret,
          },
          stdio: "inherit",
        });
        next.on("error", () => stop("Could not start Next.js.", 1));
        next.on("exit", (code) => stop(null, code ?? 1));
        console.log(`Open ${origin}/deposit/0000 when Next.js is ready.`);
      } else {
        const status = line.match(/\[(\d{3})\].*POST/);
        if (status) console.log(`Stripe webhook forwarded: HTTP ${status[1]}`);
      }
    }
  });
}

stripe.on("error", () => stop("Could not start Stripe CLI. Install it or put it on PATH.", 1));
stripe.on("exit", () => stop("Stripe listener stopped. Check the test key and network connection.", 1));
process.on("SIGINT", () => stop(null, 0));
process.on("SIGTERM", () => stop(null, 0));
