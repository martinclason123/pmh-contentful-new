export function faxTransactionNotification(
  user,
  puppy,
  transaction_type,
  amount
) {
  try {
    let markup = "";
    const formattedAmount =
      amount !== undefined && amount !== null && amount !== ""
        ? `$${amount}`
        : null;

    const baseStyles = `
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        p { font-size: 14px; margin: 6px 0; }
        .muted { color: #555; }
      </style>
    `.trim();

    if (transaction_type === "waitlist") {
      // user expected shape for waitlist:
      // { name, email, phone, breedName, waitlistId, code }
      markup = `
        <html>
          <head>${baseStyles}</head>
          <body>
            <h1>Waitlist Signup Notification</h1>

            <p>A new customer has joined the waitlist.</p>

            ${
              formattedAmount
                ? `<p><strong>Amount:</strong> ${formattedAmount}</p>`
                : ""
            }

            <p><strong>Name:</strong> ${user?.name || "N/A"}</p>
            <p><strong>Phone:</strong> ${user?.phone || "N/A"}</p>
            <p><strong>Email:</strong> ${user?.email || "N/A"}</p>
            <p><strong>Breed:</strong> ${user?.breedName || "N/A"}</p>
            <p><strong>Waitlist ID:</strong> ${user?.waitlistId || "N/A"}</p>
            <p><strong>Code:</strong> ${user?.code || "N/A"}</p>

            <p class="muted">This customer should be added to Contentful waitlist members and contacted when relevant litters are available.</p>
          </body>
        </html>
      `.trim();
    } else if (transaction_type === "deposit") {
      markup = `
        <html>
          <head>${baseStyles}</head>
          <body>
            <h1>Deposit Notification</h1>
            <p>A deposit has been placed on <strong>${puppy.name}</strong> (${
        puppy.breed
      }).</p>
            ${
              formattedAmount
                ? `<p><strong>Amount:</strong> ${formattedAmount}</p>`
                : ""
            }
            <p>Buyer: ${user.first} ${user.last}</p>
            <p>Phone: ${user.phone}</p>
            <p>Email: ${user.email}</p>
          </body>
        </html>
      `.trim();
    } else {
      markup = `
        <html>
          <head>${baseStyles}</head>
          <body>
            <h1>Balance Payment Notification</h1>
            <p>The balance has been paid on <strong>${puppy.name}</strong> (${
        puppy.breed
      }).</p>
            ${
              formattedAmount
                ? `<p><strong>Amount:</strong> ${formattedAmount}</p>`
                : ""
            }
            <p>Buyer: ${user.first} ${user.last}</p>
            <p>Phone: ${user.phone}</p>
            <p>Email: ${user.email}</p>
          </body>
        </html>
      `.trim();
    }

    const baseUrl = process.env.ORIGIN_URL;

    // Make sure ORIGIN_URL exists in the environment where this runs
    fetch(`${baseUrl}/api/fax`, {
      method: "POST",
      headers: { "Content-Type": "text/html" },
      body: markup,
    });
  } catch (error) {
    console.log("Error sending fax notification", error);
  }
}

export default faxTransactionNotification;
