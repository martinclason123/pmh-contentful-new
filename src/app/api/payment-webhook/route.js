export const dynamic = "force-dynamic";
import Stripe from "stripe";
import sendEmail from "../../../utils/send-email";
import adminEmail from "../../../utils/admin-email";
import { updatePuppy } from "../../../utils/update-puppy";
import { faxTransactionNotification } from "../../../utils";
import addToWaitlist from "../../../utils/stripe/addToWaitlist";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  const buf = Buffer.from(await req.arrayBuffer());
  const sig = req.headers.get("stripe-signature");

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      buf,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("⚠️ Webhook signature verification failed.", err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;

      // Normalize metadata + transaction type to support both naming conventions
      const metadata = session?.metadata || {};
      const transactionType =
        metadata.transaction_type || metadata.transactionType || null;

      // NEW: waitlist branch (keep it early and minimal)
      if (transactionType === "waitlist") {
        const waitlistPayload = {
          transactionType: "waitlist",
          requestId: metadata.request_id || metadata.requestId || null,
          waitlistId: metadata.waitlist_id || metadata.waitlistId || null,
          breedName: metadata.breed_name || metadata.breedName || null,
          name: metadata.name || null,
          phone: metadata.phone || null,
          email: metadata.email || null,
          code: metadata.code || null,

          // helpful context (not required for Contentful, but useful for logs)
          stripe: {
            sessionId: session?.id,
            paymentIntent: session?.payment_intent || null,
            amountTotal: session?.amount_total || null,
            currency: session?.currency || null,
          },
        };

        // For this milestone: just log from the utility
        await addToWaitlist(waitlistPayload);
        await sendEmail(
          {
            name: waitlistPayload.name,
            email: waitlistPayload.email,
            breedName: waitlistPayload.breedName,
            code: waitlistPayload.code,
          },
          null,
          "waitlist"
        );
        await adminEmail(
          {
            name: waitlistPayload.name,
            email: waitlistPayload.email,
            phone: waitlistPayload.phone,
            breedName: waitlistPayload.breedName,
            waitlistId: waitlistPayload.waitlistId,
            code: waitlistPayload.code,
          },
          null,
          "waitlist"
        );
        await faxTransactionNotification(
          {
            name: waitlistPayload.name,
            email: waitlistPayload.email,
            phone: waitlistPayload.phone,
            breedName: waitlistPayload.breedName,
            waitlistId: waitlistPayload.waitlistId,
            code: waitlistPayload.code,
          },
          null,
          "waitlist",
          session?.amount_total ? (session.amount_total / 100).toFixed(2) : null
        );

        break;
      }

      // --- existing deposit / balance logic unchanged below ---
      // Guard: deposit/balance expects puppy + user metadata
      if (!metadata.puppy || !metadata.user) {
        console.log(
          "[payment-webhook] Missing puppy/user metadata for session:",
          {
            sessionId: session?.id,
            transactionType,
            metadataKeys: Object.keys(metadata),
          }
        );
        break;
      }

      const amount = (session.amount_total / 100).toFixed(2);

      let puppy;
      let user;

      try {
        puppy = JSON.parse(metadata.puppy);
        user = JSON.parse(metadata.user);
      } catch (parseErr) {
        console.error(
          "[payment-webhook] Failed to parse puppy/user metadata:",
          {
            sessionId: session?.id,
            transactionType,
            error: parseErr?.message || parseErr,
          }
        );
        break;
      }

      const { first, last, phone, email, street, city, state, zip, foundUs } =
        user;

      if (transactionType === "deposit") {
        puppy.availability = ["Reserved"];
        puppy.deposit = true;
      } else {
        puppy.availability = ["Sold"];
      }

      // Send email and fax notifications
      sendEmail(user, puppy, transactionType);
      adminEmail(user, puppy, transactionType);
      faxTransactionNotification(user, puppy, transactionType, amount);

      const updateObj =
        !puppy.buyer || transactionType === "deposit"
          ? {
              availability: puppy.availability,
              deposit: puppy.deposit || false,
              buyerEmail: email,
              buyerPhone: phone,
              buyerName: `${first} ${last}`,
              buyerCity: city,
              buyerState: state,
              buyerZip: zip,
              buyerStreet: street,
              foundOn: foundUs,
              buyer: true,
            }
          : {
              availability: puppy.availability,
              deposit: puppy.deposit || false,
            };

      try {
        await updatePuppy(puppy.chip, updateObj);
      } catch (error) {
        console.error("Error updating puppy in Contentful:", error);
        return new Response("Failed to update puppy", { status: 500 });
      }

      break;
    }

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  return new Response(null, { status: 200 });
}
