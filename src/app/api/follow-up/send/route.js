import { timingSafeEqual } from "node:crypto";
import { sendScheduledFollowUps } from "../../../../lib/customer-follow-up/runtime.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 180;

export async function GET(request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return new Response("Unauthorized", { status: 401 });
  const actual = Buffer.from(request.headers.get("authorization") || "");
  const expected = Buffer.from(`Bearer ${secret}`);
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    return new Response("Unauthorized", { status: 401 });
  }
  try {
    const report = await sendScheduledFollowUps();
    if (report.failed) console.error("Scheduled follow-up delivery had failures", report.failed);
    return Response.json(report, { status: report.failed ? 503 : 200 });
  } catch {
    return new Response("Follow-up worker unavailable", { status: 503 });
  }
}
