import { followUpRuntime } from "../../../../lib/customer-follow-up/runtime.mjs";
import { validStopToken } from "../../../../lib/customer-follow-up/stop-link.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const tokenPattern = /^[a-f0-9]{64}\.[a-f0-9]{64}$/;

function page(message, status = 200) {
  return new Response(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Pickup email preferences</title></head><body><main><h1>Pickup email preferences</h1>${message}</main></body></html>`, {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store",
      "Referrer-Policy": "no-referrer", "X-Robots-Tag": "noindex",
    },
  });
}

const invalid = () => page("<p>This email preference link is invalid.</p>", 400);

export function GET(request) {
  const token = new URL(request.url).searchParams.get("token") || "";
  if (!tokenPattern.test(token)) return invalid();
  return page(`<form method="post" action="/api/follow-up/stop"><input type="hidden" name="token" value="${token}"><button>Stop pickup follow-up emails</button></form>`);
}

export async function POST(request) {
  try {
    const token = (await request.formData()).get("token");
    if (typeof token !== "string" || !tokenPattern.test(token)) return invalid();
    const context = followUpRuntime();
    if (!context) return page("<p>Please reply to the email to change your preferences.</p>", 503);
    const { config, repository } = context;
    const stopped = await repository.transaction(config.breederId, async (tx) => {
      const journey = await tx.getJourney(token.split(".")[0]);
      if (!journey || !validStopToken(config, journey, token)) return false;
      await tx.suppress(journey.customerEmail, new Date().toISOString());
      return true;
    });
    return stopped ? page("<p>Pickup follow-up emails have been stopped.</p>") : invalid();
  } catch {
    return page("<p>We could not update your preferences. Please try again or reply to the email.</p>", 503);
  }
}
