import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const CURRENCY = "usd";

async function createCheckoutSession(puppyData, userData) {
  const origin = process.env.ORIGIN_URL || "http://localhost:3000";

  const TAX_RATE = 0.06; // 6% Michigan Sales Tax
  const taxAmount = Math.round(10341 * TAX_RATE); // Calculate tax in cents

  const checkoutSession = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: CURRENCY,
          product_data: {
            name: "Puppy Deposit",
            description: `Deposit for ${puppyData.name} (${puppyData.breed})`,
          },
          unit_amount: 10341,
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
    metadata: {
      puppy: JSON.stringify(puppyData),
      user: JSON.stringify(userData),
      transaction_type: "deposit",
    },
    payment_intent_data: {
      metadata: {
        puppy: JSON.stringify(puppyData),
        user: JSON.stringify(userData),
        transaction_type: "deposit",
      },
    },
    success_url: `${origin}/deposit-success/${puppyData.chip}?session_id={CHECKOUT_SESSION_ID}`,
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
