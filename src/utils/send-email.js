import { Resend } from "resend";

export default async function sendEmail(user, puppy, transaction_type) {
  let message;
  let subject;

  if (transaction_type === "deposit") {
    subject = `Your Deposit on ${puppy.name}`;
    message = `Congratulations ${user.first}! You have successfully placed a deposit on ${puppy.name}! If we have not been in contact already, we will be soon to set up visit/pick-up arrangements. If you need to get ahold of us, please do not hesitate to call or text (616) 613-6801. If you would like to pay off your balance ahead of time, please use this link: <a href="https://www.peacefulcountrypets.com/balance/${puppy.chip}">https://www.peacefulcountrypets.com/balance/${puppy.chip}</a> Thank you!`;
  } else {
    subject = `Your Purchase of ${puppy.name}`;
    message = `Congratulations ${user.first}! You have successfully purchased ${puppy.name}! If we have not been in contact already, we will be soon to set up visit/pick-up arrangements. If you need to get ahold of us, please do not hesitate to call or text (616) 613-6801. Thank you!`;
  }

  // Initialize Resend
  const resend = new Resend(process.env.RESEND_API_KEY);

  const emailData = {
    from: "Prairie Creek Puppies <support@prairiecreekpuppies.com>",
    to: user.email,
    subject: subject,
    html: `<p>${message}</p>`,
  };

  try {
    const response = await resend.emails.send(emailData);
  } catch (error) {
    console.error("Error sending email via Resend:", error);
  }
}
