import "server-only";

export { verifyCalendlyWebhookSignature } from "../lib/customer-follow-up/signature.mjs";

const CALENDLY_API_ORIGIN = "https://api.calendly.com";

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
        (right.position ?? Number.MAX_SAFE_INTEGER),
    )
    .find((item) => item.answer?.trim())?.answer;
  const chipMatch = puppyAnswer?.match(/\(([^()]+)\)\s*$/);

  return chipMatch?.[1]?.trim() || null;
}
