export function faxTransactionNotification(
  user,
  puppy,
  transaction_type,
  amount
) {
  try {
    let markup = "";
    const formattedAmount = `$${amount}`;

    if (transaction_type === "deposit") {
      markup = `
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              p { font-size: 14px; }
            </style>
          </head>
          <body>
            <h1>Deposit Notification</h1>
            <p>A deposit has been placed on <strong>${puppy.name}</strong> (${puppy.breed}).</p>
            <p><strong>Amount:</strong> ${formattedAmount}</p>
            <p>Buyer: ${user.first} ${user.last}</p>
            <p>Phone: ${user.phone}</p>
            <p>Email: ${user.email}</p>
          </body>
        </html>
      `.trim();
    } else {
      markup = `
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              p { font-size: 14px; }
            </style>
          </head>
          <body>
            <h1>Balance Payment Notification</h1>
            <p>The balance has been paid on <strong>${puppy.name}</strong> (${puppy.breed}).</p>
            <p><strong>Amount:</strong> ${formattedAmount}</p>
            <p>Buyer: ${user.first} ${user.last}</p>
            <p>Phone: ${user.phone}</p>
            <p>Email: ${user.email}</p>
          </body>
        </html>
      `.trim();
    }

    const baseUrl = process.env.ORIGIN_URL;

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
