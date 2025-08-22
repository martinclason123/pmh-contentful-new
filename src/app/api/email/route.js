export const dynamic = "force-dynamic";
import sgMail from "@sendgrid/mail";

export async function POST(req) {
  try {
    const apiKey = req.headers.get("x-api-key");
    if (apiKey !== process.env.EMAIL_LOCAL_KEY) {
      console.error("Invalid API Key");
      return new Response("Forbidden", { status: 403 });
    }

    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    const body = await req.json();
    const { recipients, subject, message } = body;

    const msg = {
      to: recipients, // Change to your recipient
      from: "support@pmhpuppies.com", // Change to your verified sender
      subject: subject,
      text: message,
      html: `<p>${message}</p>`,
    };

    sgMail
      .send(msg)
      .then(() => {})
      .catch((error) => {
        console.error("Error from SendGrid", error.response.body);
      });

    return new Response(null, { status: 200 });
  } catch (error) {
    console.error("Error processing email request:", error);
    return new Response(error.message, { status: 500 });
  }
}
