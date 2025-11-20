// import twilio from "twilio";

// export async function POST(req) {
//   try {
//     const { name, mobile, message } = await req.json();

//     const client = twilio(
//       process.env.TWILIO_ACCOUNT_SID,
//       process.env.TWILIO_AUTH_TOKEN
//     );

//     const result = await client.messages.create({
//       body: `
// New Puppy Inquiry
// Name: ${name}
// Phone: ${mobile}
// Message: ${message}
//       `,
//       from: process.env.TWILIO_PHONE_NUMBER, // +16164392063
//       to: "+16162389368", // <-- your personal Mint Mobile number
//     });

//     return Response.json({ success: true, result });
//   } catch (err) {
//     console.error("Twilio Error:", err);
//     return Response.json(
//       { success: false, error: err.message },
//       { status: 500 }
//     );
//   }
// }
import { NextResponse } from "next/server";
import { sendGmailMessage } from "../../../utils/gmail-sender";

export async function POST(req) {
  try {
    const { name, mobile, message } = await req.json();

    if (!name || !mobile || !message) {
      return NextResponse.json(
        { success: false, error: "Missing fields" },
        { status: 400 }
      );
    }

    // Build the text content
    const body = `
New Puppy Inquiry
Name: ${name}
Phone: ${mobile}
Message: ${message}
    `.trim();

    // Your Mint Mobile SMS gateway email
    const smsRecipient = `${process.env.MY_SMS_EMAIL_GATEWAY}`;

    const result = await sendGmailMessage({
      to: smsRecipient,
      subject: "New Puppy Inquiry",
      body,
    });

    return NextResponse.json({ success: true, data: result }, { status: 200 });
  } catch (error) {
    console.error("GMAIL SMS SEND ERROR:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
