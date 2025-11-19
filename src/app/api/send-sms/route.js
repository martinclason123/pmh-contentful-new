import twilio from "twilio";

export async function POST(req) {
  try {
    const { name, mobile, message } = await req.json();

    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    const result = await client.messages.create({
      body: `
New Puppy Inquiry
Name: ${name}
Phone: ${mobile}
Message: ${message}
      `,
      from: process.env.TWILIO_PHONE_NUMBER, // +16164392063
      to: "+16162389368", // <-- your personal Mint Mobile number
    });

    return Response.json({ success: true, result });
  } catch (err) {
    console.error("Twilio Error:", err);
    return Response.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
