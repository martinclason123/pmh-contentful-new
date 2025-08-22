export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const CURRENCY = "usd";

async function createCheckoutSession(puppyData, userData) {
  const origin = process.env.ORIGIN_URL || "http://localhost:3000";
  const TAX_RATE = 0.06; // 6% Michigan Sales Tax

  let price;
  if (puppyData.deposit === true) {
    price = puppyData.price - 100;
  } else {
    price = puppyData.price;
  }

  const feeMultiplier = 1.0341; // To cover 3.3% Stripe fee
  const taxableAmount = price * feeMultiplier;
  const taxAmount = Math.round(taxableAmount * TAX_RATE * 100); // in cents

  const metadata = {
    puppy: JSON.stringify(puppyData),
    user: JSON.stringify(userData),
    transaction_type: "balance",
  };

  const checkoutSession = await stripe.checkout.sessions.create({
    payment_method_types: ["card", "klarna"],
    mode: "payment",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: CURRENCY,
          product_data: {
            name: "Puppy Purchase",
            description: `Purchase of ${puppyData.name} (${puppyData.breed})`,
          },
          unit_amount: Math.round(price * feeMultiplier * 100),
        },
      },
      {
        quantity: 1,
        price_data: {
          currency: CURRENCY,
          product_data: {
            name: "Sales Tax (MI)",
            description: "6% Michigan Sales Tax",
          },
          unit_amount: taxAmount,
        },
      },
    ],
    metadata,
    payment_intent_data: {
      metadata,
    },
    success_url: `${origin}/purchase-success/${puppyData.chip}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/puppies/${puppyData.chip}`,
  });

  return {
    client_secret: checkoutSession.client_secret,
    url: checkoutSession.url,
  };
}

export async function POST(req) {
  try {
    const { puppyData, userData } = await req.json();
    const session = await createCheckoutSession(puppyData, userData);

    return NextResponse.json(session);
  } catch (error) {
    console.error("Error:", error); // Log the error
    return new Response("Error creating Stripe checkout session", {
      status: 500,
    });
  }
}
