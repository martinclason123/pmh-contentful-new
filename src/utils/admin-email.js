import { Resend } from "resend";

export default async function adminEmail(user, puppy, transaction_type) {
  let subject;
  let message;

  const recipients = [
    "martin@martinclason.net",
    "karaclason@gmail.com",
    "cassiefaith08@gmail.com",
    "rmartin4583@mailbug.com",
  ];

  if (transaction_type === "waitlist") {
    subject = `New Waitlist Signup (${user.breedName || "Unknown breed"})`;

    message = `
      <strong>New waitlist signup</strong><br/><br/>
      Name: ${user.name}<br/>
      Email: ${user.email}<br/>
      Phone: ${user.phone || "N/A"}<br/>
      Breed: ${user.breedName || "Unknown"}<br/>
      Waitlist ID: ${user.waitlistId || "N/A"}<br/>
      Code: ${user.code}<br/>
    `;
  } else if (transaction_type === "deposit") {
    subject = `Deposit on ${puppy.name} (Paw Prints on My Heart)`;
    message = `
      A deposit on <strong>${puppy.name}</strong> was placed.<br/><br/>
      Buyer: ${user.first} ${user.last}<br/>
      Phone: ${user.phone}<br/>
      Email: ${user.email}
    `;
  } else {
    subject = `Balance Paid on ${puppy.name} (Paw Prints on My Heart)`;
    message = `
      The balance has been paid on <strong>${puppy.name}</strong>.<br/><br/>
      Buyer: ${user.first} ${user.last}<br/>
      Phone: ${user.phone}<br/>
      Email: ${user.email}
    `;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    await resend.emails.send({
      from: "Paw Prints on My Heart <support@pmhpuppies.com>",
      to: recipients,
      subject,
      html: `<p>${message}</p>`,
    });
  } catch (error) {
    console.error("Error sending admin email via Resend:", error);
  }
}
