import { Resend } from "resend";

export default async function adminEmail(user, puppy, transaction_type) {
  let message;
  let subject;

  const recipients = [
    "martin@martinclason.net",
    "karaclason@gmail.com",
    "cassiefaith08@gmail.com",
    "rmartin4583@mailbug.com",
  ];

  if (transaction_type === "deposit") {
    subject = `Deposit on ${puppy.name} (Paw Prints on My Heart)`;
    message = `A deposit on ${puppy.name} was placed by ${user.first} ${user.last}. Phone: ${user.phone}, Email: ${user.email}`;
  } else {
    subject = `Balance Paid on ${puppy.name} (Paw Prints on My Heart)`;
    message = `The balance has been paid on ${puppy.name} by ${user.first} ${user.last}. Phone: ${user.phone}, Email: ${user.email}`;
  }

  // Initialize Resend
  const resend = new Resend(process.env.RESEND_API_KEY);

  const emailData = {
    from: "Paw Prints on My Heart <support@pmhpuppies.com>",
    to: recipients, // Array of recipients
    subject: subject,
    html: `<p>${message}</p>`,
  };

  try {
    const response = await resend.emails.send(emailData);
  } catch (error) {
    console.error("Error sending admin email via Resend:", error);
  }
}
