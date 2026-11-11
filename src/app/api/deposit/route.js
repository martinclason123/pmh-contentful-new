export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { localDepositTest, readTestPuppy, testPuppyChip } from "../../../utils/local-deposit-test";
import Stripe from "stripe";
import { getOrCreatePickupSchedulingLink } from "../../../utils/calendly";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const CURRENCY = "usd";

async function createCheckoutSession(puppyData, userData) {
  const origin = process.env.ORIGIN_URL || "http://localhost:3000";
  let pickupSchedulingUrl;
  if (localDepositTest()) {
    pickupSchedulingUrl = new URL("/local-test/pickup", origin).href;
  } else if (!puppyData.pickupScheduled) {
    pickupSchedulingUrl = await getOrCreatePickupSchedulingLink(puppyData, {
      name: `${userData.first} ${userData.last}`.trim(),
      email: userData.email,
    });
  }

  const metadata = {
    puppy: JSON.stringify(puppyData),
    user: JSON.stringify(userData),
    transaction_type: "deposit",
    puppy_chip: `${puppyData.chip}`,
    ...(localDepositTest() && { local_deposit_test: "true" }),
    ...(pickupSchedulingUrl && {
      pickup_scheduling_url: pickupSchedulingUrl,
    }),
  };

  const TAX_RATE = 0.06; // 6% Michigan Sales Tax
  const taxAmount = Math.round(10341 * TAX_RATE); // Calculate tax in cents

  const checkoutSession = await stripe.checkout.sessions.create({
    client_reference_id: `${puppyData.chip}`,
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
          unit_amount: 31023,
        },
      },
      // {
      //   quantity: 1,
      //   price_data: {
      //     currency: CURRENCY,
      //     product_data: {
      //       name: "Sales Tax (MI)",
      //       description: "6% Michigan Sales Tax",
      //     },
      //     unit_amount: taxAmount,
      //   },
      // },
    ],
    metadata,
    payment_intent_data: {
      metadata,
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

    if (localDepositTest()) {
      if (!/^sk_test_/.test(process.env.STRIPE_SECRET_KEY || "")) {
        return new Response("Local checkout requires a Stripe test key", { status: 503 });
      }
      if (String(puppyData?.chip) !== testPuppyChip) {
        return new Response("Use the local test puppy", { status: 400 });
      }
      const puppy = await readTestPuppy();
      // Keep Checkout metadata under Stripe's 500-character value limit.
      const { chip, name, breed, price, available, pickupScheduled } = puppy;
      const session = await createCheckoutSession(
        { chip, name, breed, price, available, pickupScheduled },
        userData,
      );
      return NextResponse.json(session);
    }

    const session = await createCheckoutSession(puppyData, userData);

    return NextResponse.json(session);
  } catch (error) {
    console.error("Error:", error); // Log the error
    return new Response("Error creating Stripe checkout session", {
      status: 500,
    });
  }
}
