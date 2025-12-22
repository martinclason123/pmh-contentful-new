import { Resend } from "resend";

export default async function sendEmail(user, puppy, transaction_type) {
  let message;
  let subject;

  // Base domain for links inside emails
  const origin = process.env.ORIGIN_URL || "https://www.pmhpuppies.com";
  const waitlistFaqUrl = `${origin}/waitlist#faq`;

  // NEW: Waitlist email branch
  if (transaction_type === "waitlist") {
    // Support either shapes:
    // - user.email / user.first
    // - user.name / user.breedName / user.code (if you pass waitlist payload as "user")
    const firstName =
      (user?.first && String(user.first).trim()) ||
      (user?.name && String(user.name).trim().split(" ")[0]) ||
      "there";

    const breedName =
      (user?.breedName && String(user.breedName).trim()) ||
      (user?.breed && String(user.breed).trim()) ||
      "your selected breed";

    const code = (user?.code && String(user.code).trim()) || "";

    subject = `You're on the ${breedName} priority list`;

    message = `
      <p>Congratulations ${firstName}! You have successfully joined our priority list for <strong>${breedName}</strong>.</p>

      ${code ? `<p><strong>Your waitlist code:</strong> ${code}</p>` : ""}

      <p>
        We will use your contact information to alert you about upcoming litters matching your preferences.
        If you have any questions, please check our FAQ here:
        <a href="${waitlistFaqUrl}">${waitlistFaqUrl}</a>
      </p>

      <p>
        If you need to get ahold of us, please call or text (616) 613-6801.
      </p>

      <p>Thank you!</p>
    `;
  } else if (transaction_type === "deposit") {
    subject = `Your Deposit on ${puppy.name}`;
    message = `Congratulations ${user.first}! You have successfully placed a deposit on ${puppy.name}! If we have not been in contact already, we will be soon to set up visit/pick-up arrangements. If you need to get ahold of us, please do not hesitate to call or text (616) 613-6801. If you would like to pay off your balance ahead of time, please use this link: <a href="https://www.pmhpuppies.com/balance/${puppy.chip}">https://www.pmhpuppies.com/balance/${puppy.chip}</a> Thank you!`;
  } else {
    subject = `Your Purchase of ${puppy.name}`;
    message = `Congratulations ${user.first}! You have successfully purchased ${puppy.name}! If we have not been in contact already, we will be soon to set up visit/pick-up arrangements. If you need to get ahold of us, please do not hesitate to call or text (616) 613-6801. Thank you!`;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  // Choose recipient depending on which branch
  const toEmail = transaction_type === "waitlist" ? user?.email : user?.email;

  if (!toEmail) {
    console.error("[send-email] Missing recipient email:", {
      transaction_type,
      userKeys: Object.keys(user || {}),
    });
    return;
  }

  const emailData = {
    from: "Paw Prints on My Heart <support@pmhpuppies.com>",
    to: toEmail,
    subject,
    html: message,
  };

  try {
    await resend.emails.send(emailData);
  } catch (error) {
    console.error("Error sending email via Resend:", error);
  }
}
