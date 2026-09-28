import "server-only";

import { createHmac, timingSafeEqual } from "crypto";

const CALENDLY_API_ORIGIN = "https://api.calendly.com";
const SIGNATURE_TOLERANCE_SECONDS = 180;

export function verifyCalendlyWebhookSignature(
  rawBody,
  signatureHeader,
  signingKey
) {
  if (!signatureHeader || !signingKey) {
    return false;
  }

  const values = signatureHeader.split(",").reduce((result, value) => {
    const separatorIndex = value.indexOf("=");

    if (separatorIndex > 0) {
      const key = value.slice(0, separatorIndex).trim();
      const item = value.slice(separatorIndex + 1).trim();
      result[key] = [...(result[key] || []), item];
    }

    return result;
  }, {});

  const timestamp = Number(values.t?.[0]);
  const signatures = values.v1 || [];
  const age = Math.abs(Date.now() / 1000 - timestamp);

  if (
    !Number.isFinite(timestamp) ||
    signatures.length === 0 ||
    age > SIGNATURE_TOLERANCE_SECONDS
  ) {
    return false;
  }

  const expectedSignature = createHmac("sha256", signingKey)
    .update(`${timestamp}.${rawBody}`)
    .digest("hex");
  const expectedBuffer = Buffer.from(expectedSignature, "utf8");

  return signatures.some((signature) => {
    const signatureBuffer = Buffer.from(signature, "utf8");

    return (
      signatureBuffer.length === expectedBuffer.length &&
      timingSafeEqual(signatureBuffer, expectedBuffer)
    );
  });
}

export async function getCalendlyResource(uri) {
  const data = await getCalendlyResponse(uri);
  return data.resource;
}

export async function getCalendlyCollection(uri) {
  const data = await getCalendlyResponse(uri);
  return data.collection || [];
}

async function getCalendlyResponse(uri) {
  const url = new URL(uri, CALENDLY_API_ORIGIN);

  if (url.origin !== CALENDLY_API_ORIGIN) {
    throw new Error("Unexpected Calendly resource URL");
  }

  if (!process.env.CALENDLY_ACCESS_TOKEN) {
    throw new Error("CALENDLY_ACCESS_TOKEN is not configured");
  }

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${process.env.CALENDLY_ACCESS_TOKEN}`,
    },
    cache: "no-store",
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    throw new Error(`Calendly resource request failed (${response.status})`);
  }

  const data = await response.json();
  return data;
}

export function extractPuppyChip(invitee) {
  const trackedChip = invitee.tracking?.utm_term?.trim();

  if (trackedChip) {
    return trackedChip;
  }

  const puppyAnswer = [...(invitee.questions_and_answers || [])]
    .sort(
      (left, right) =>
        (left.position ?? Number.MAX_SAFE_INTEGER) -
        (right.position ?? Number.MAX_SAFE_INTEGER)
    )
    .find((item) => item.answer?.trim())?.answer;
  const chipMatch = puppyAnswer?.match(/\(([^()]+)\)\s*$/);

  return chipMatch?.[1]?.trim() || null;
}
