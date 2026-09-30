import "server-only";

import Stripe from "stripe";

import {
  getBreederScheduling,
  getPickupSchedulingUrl,
} from "../data/scheduling";

function addDays(dateString, days) {
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export async function createPickupSchedulingLink(
  puppy,
  invitee = {},
  breederId
) {
  const token = process.env.CALENDLY_ACCESS_TOKEN;

  if (!token) {
    throw new Error("CALENDLY_ACCESS_TOKEN is not configured");
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(puppy.available || "")) {
    throw new Error("The puppy go-home date is missing or invalid");
  }

  const scheduling = getBreederScheduling(breederId);
  const response = await fetch("https://api.calendly.com/shares", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      event_type: scheduling.pickupEventTypeUri,
      name: `${puppy.name} (${puppy.chip}) Puppy Pickup`.slice(0, 55),
      period_type: "fixed",
      start_date: puppy.available,
      end_date: addDays(puppy.available, scheduling.pickupWindowDays),
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    throw new Error(`Calendly pickup link request failed (${response.status})`);
  }

  const data = await response.json();
  const bookingUrl = data.resource?.scheduling_links?.[0]?.booking_url;

  if (!bookingUrl) {
    throw new Error("Calendly did not return a pickup booking URL");
  }

  return getPickupSchedulingUrl(puppy, invitee, breederId, bookingUrl);
}

export async function getOrCreatePickupSchedulingLink(
  puppy,
  invitee = {},
  breederId
) {
  if (process.env.STRIPE_SECRET_KEY) {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const sessions = await stripe.checkout.sessions.list({
      status: "complete",
      limit: 100,
    });

    const existingSession = sessions.data.find((session) => {
      let sessionPuppyChip = session.metadata?.puppy_chip;

      if (!sessionPuppyChip && session.metadata?.puppy) {
        try {
          sessionPuppyChip = JSON.parse(session.metadata.puppy).chip;
        } catch {
          return false;
        }
      }

      return (
        `${sessionPuppyChip}` === `${puppy.chip}` &&
        session.metadata?.pickup_scheduling_url
      );
    });

    if (existingSession) {
      return existingSession.metadata.pickup_scheduling_url;
    }
  }

  return createPickupSchedulingLink(puppy, invitee, breederId);
}
