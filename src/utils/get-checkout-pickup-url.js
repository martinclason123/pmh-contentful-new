import "server-only";

import Stripe from "stripe";

export default async function getCheckoutPickupUrl(sessionId, puppyChip) {
  if (!sessionId || !process.env.STRIPE_SECRET_KEY) {
    return null;
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const sessionPuppy = JSON.parse(session.metadata?.puppy || "{}");

    if (`${sessionPuppy.chip}` !== `${puppyChip}`) {
      return null;
    }

    return session.metadata?.pickup_scheduling_url || null;
  } catch (error) {
    console.error("Unable to retrieve the pickup scheduling link:", error);
    return null;
  }
}
