export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import Stripe from "stripe";
import { randomUUID, randomBytes } from "crypto";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const CURRENCY = "usd";
const MI_SALES_TAX_RATE = 0.06;

// You said "deposit amount + stripe fee + sales tax (6%) if true"
const STRIPE_FEE_RATE = 0.03041;

// helpers
function toCents(dollars) {
  // handles "300" or 300
  const n = typeof dollars === "string" ? Number(dollars) : dollars;
  return Math.round(n * 100);
}

function envTrue(value) {
  return String(value).toLowerCase() === "true";
}

function generateCode() {
  // Example: WL-8CHAR (base16-ish)
  // Short, readable, low collision risk for your scale
  const token = randomBytes(4).toString("hex").toUpperCase(); // 8 chars
  return `WL-${token}`;
}

export async function POST(req) {
  try {
    const origin = process.env.ORIGIN_URL || "http://localhost:3000";

    const body = await req.json();

    // Only log what matters
    // console.log("[waitlist/checkout] incoming keys:", Object.keys(body || {}));

    const {
      transactionType = "waitlist",
      waitlistId,
      breedName = "",
      name,
      phone,
      email,
      message = "",
    } = body || {};

    // minimal server-side guardrails (so Stripe isn't called with nonsense)
    if (!waitlistId || !name || !phone || !email) {
      return NextResponse.json(
        { error: "Missing required fields: waitlistId, name, phone, email" },
        { status: 400 }
      );
    }

    const requestId = randomUUID();
    const code = generateCode();

    const baseAmountCents = toCents(process.env.DEPOSIT_CHARGE_AMOUNT || 300);

    // Stripe fee coverage (your specified rate)
    const stripeFeeCents = Math.round(baseAmountCents * STRIPE_FEE_RATE);

    // Sales tax (MI) only if enabled
    const collectsTax = envTrue(process.env.COLLECTS_SALES_TAX);
    // Assumption (reasonable default): tax applies to the base deposit, not to the "processing fee" line item
    const taxCents = collectsTax
      ? Math.round(baseAmountCents * MI_SALES_TAX_RATE)
      : 0;

    const totalCents = baseAmountCents + stripeFeeCents + taxCents;

    // console.log("[waitlist/checkout] amounts (cents):", {
    //   baseAmountCents,
    //   stripeFeeCents,
    //   taxCents,
    //   totalCents,
    //   collectsTax,
    //   requestId,
    //   code,
    // });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",

      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: CURRENCY,
            product_data: {
              name: "Waitlist Fee",
              description: breedName
                ? `Waitlist for ${breedName}`
                : "Waitlist fee",
            },
            unit_amount: baseAmountCents,
          },
        },
        {
          quantity: 1,
          price_data: {
            currency: CURRENCY,
            product_data: {
              name: "Processing Fee",
              description: "Covers payment processing costs",
            },
            unit_amount: stripeFeeCents,
          },
        },
        ...(taxCents > 0
          ? [
              {
                quantity: 1,
                price_data: {
                  currency: CURRENCY,
                  product_data: {
                    name: "Sales Tax (MI)",
                    description: "6% Michigan sales tax",
                  },
                  unit_amount: taxCents,
                },
              },
            ]
          : []),
      ],

      // Put EVERYTHING the webhook needs here
      metadata: {
        transactionType,
        requestId,
        code,

        waitlistId,
        breedName,

        name,
        phone,
        email,

        message,
      },

      // Redundant but useful: sometimes you’ll read from PaymentIntent events
      payment_intent_data: {
        metadata: {
          transactionType,
          requestId,
          code,

          waitlistId,
          breedName,

          name,
          phone,
          email,

          message,
        },
      },

      success_url: `${origin}/waitlist/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/waitlist`,
    });

    return NextResponse.json(
      { url: session.url, requestId, code },
      { status: 200 }
    );
  } catch (error) {
    console.error("[waitlist/checkout] error:", error);
    return NextResponse.json(
      { error: "Error creating Stripe checkout session" },
      { status: 500 }
    );
  }
}
