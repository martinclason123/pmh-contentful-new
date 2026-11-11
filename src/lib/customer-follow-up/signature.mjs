import { createHmac, timingSafeEqual } from "node:crypto";

/** Verify exact request bytes; tests supply time without altering the system clock. */
export function verifyCalendlyWebhookSignature(
  rawBody,
  header,
  key,
  now = Date.now(),
) {
  if (typeof header !== "string" || !key) return false;
  const fields = header.split(",").reduce((result, field) => {
    const [name, ...parts] = field.trim().split("=");
    (result[name] ??= []).push(parts.join("="));
    return result;
  }, {});
  const timestamp = Number(fields.t?.[0]);
  if (
    !/^\d+$/.test(fields.t?.[0] ?? "") ||
    !Number.isFinite(timestamp) ||
    Math.abs(now / 1000 - timestamp) > 180
  )
    return false;
  const expected = Buffer.from(
    createHmac("sha256", key).update(`${timestamp}.${rawBody}`).digest("hex"),
  );
  return (fields.v1 ?? []).some((signature) => {
    const actual = Buffer.from(signature);
    return (
      actual.length === expected.length && timingSafeEqual(actual, expected)
    );
  });
}
