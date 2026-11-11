import "server-only";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";

export const testPuppyChip = "0000";
const stateFile = ".local-checkout/puppy.json";

export function localDepositTest() {
  return process.env.NODE_ENV === "development" &&
    process.env.LOCAL_DEPOSIT_TEST === "true";
}

export async function sendLocalTestEmail({ from, subject, html }, session, kind) {
  const recipient = process.env.LOCAL_TEST_EMAIL?.trim();
  if (!localDepositTest() || !session || !recipient ||
      !/^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/.test(recipient)) {
    throw new Error("Local test email requires a checkout session and one test recipient");
  }
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `local-deposit/${session}/${kind}`,
    },
    body: JSON.stringify({ from, to: [recipient], subject: `[LOCAL TEST] ${subject}`, html }),
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error(`Resend rejected the test email (HTTP ${response.status})`);
}

export async function readTestPuppy() {
  let update = {};
  try {
    update = JSON.parse(await readFile(stateFile, "utf8"));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }

  return {
    chip: testPuppyChip,
    name: "Test Puppy",
    breed: "Cavapoo",
    price: 2500,
    available: "2026-01-01",
    availability: ["Available"],
    deposit: false,
    buyer: false,
    pickupScheduled: false,
    ...update,
  };
}

export async function saveTestPuppy(chip, update) {
  if (String(chip) !== testPuppyChip) throw new Error("Expected the local test puppy");
  await mkdir(".local-checkout", { mode: 0o700, recursive: true });
  const temporary = `${stateFile}.${randomUUID()}.tmp`;
  await writeFile(temporary, JSON.stringify({ ...await readTestPuppy(), ...update }, null, 2), { mode: 0o600 });
  await rename(temporary, stateFile);
}
