
export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import sendEmail from "../../../utils/send-email";
import adminEmail from "../../../utils/admin-email";
import { updatePuppy } from "../../../utils/update-puppy";
import { faxTransactionNotification } from "../../../utils";

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
    console.error(`⚠️ Webhook signature verification failed.`, err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  // Handle the event
  switch (event.type) {
    case "checkout.session.completed":
      const session = event.data.object;
      const transactionType = session.metadata.transaction_type;
      const amount = (session.amount_total / 100).toFixed(2);

      // Extract customer details
      const buyerName = `${session.customer_details.address.first} ${session.customer_details.address.last}`;
      const buyerEmail = session.customer_details.email;
      const buyerPhone = session.customer_details.phone;
      const buyerCity = session.customer_details.address.city;
      const buyerState = session.customer_details.address.state;

      // puppy object that will be updated in the db
      let puppy = JSON.parse(session.metadata.puppy);
      let user = JSON.parse(session.metadata.user);

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

      // Update the puppy in Contentful using the chip field
      try {
        await updatePuppy(puppy.chip, updateObj);
      } catch (error) {
        console.error("Error updating puppy in Contentful:", error);
        return new Response("Failed to update puppy", { status: 500 });
      }

      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  return new Response(null, { status: 200 });
}
