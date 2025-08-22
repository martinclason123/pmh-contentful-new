// src/app/api/payout-webhook/route.js
export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  const buf = Buffer.from(await req.arrayBuffer());
  const sig = req.headers.get("stripe-signature");

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      buf,
      sig,
      process.env.STRIPE_PAYOUT_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("❌ Webhook signature verification failed:", err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  switch (event.type) {
    case "payout.paid": {
      const payout = event.data.object;
      const payoutId = payout.id;

      try {
        const origin = process.env.ORIGIN_URL || "http://localhost:3000";

        const tableResponse = await fetch(`${origin}/api/table`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ payoutId }),
        });

        const result = await tableResponse.json();

        console.log("✅ Payout processed and fax sent:", result);
      } catch (err) {
        console.error("❌ Error sending to /api/table:", err.message);
      }

      break;
    }

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  return new Response(null, { status: 200 });
}
