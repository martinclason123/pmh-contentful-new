// src/app/api/test/route.js
import Stripe from "stripe";
import { NextResponse } from "next/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

function generateFaxHTML(payoutId, transactions) {
  const total = transactions.reduce((sum, tx) => sum + parseFloat(tx.net), 0);

  const rows = transactions
    .map(
      (tx) => `
      <tr>
        <td>$${tx.amount}</td>
        <td>${tx.description || ""}</td>
        <td>${tx.name || ""}</td>
        <td>${tx.phone || ""}</td>
      </tr>`
    )
    .join("");

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <title>Stripe Payout Report</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        h1, h3 { margin-bottom: 10px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { border: 1px solid #333; padding: 8px; text-align: left; }
        th { background-color: #f4f4f4; }
      </style>
    </head>
    <body>
      <h1>New Stripe Payout</h1>
      <h3>Payout ID: ${payoutId}</h3>
      <h3>Date: ${new Date().toLocaleString()}</h3>
      <table>
        <thead>
          <tr>
            <th>Amount</th>
            <th>Description</th>
            <th>Customer Name</th>
            <th>Customer Number</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
      <h3>Total Payout: $${total.toFixed(2)}</h3>
    </body>
    </html>
  `.trim();
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { payoutId } = body;

    if (!payoutId) {
      return NextResponse.json({ error: "Missing payoutId" }, { status: 400 });
    }

    const txList = await stripe.balanceTransactions.list({
      payout: payoutId,
      limit: 100,
    });

    const transactions = await Promise.all(
      txList.data
        .filter((tx) => tx.type === "charge")
        .map(async (tx) => {
          const { id, amount, net, source } = tx;

          let name = "";
          let email = "";
          let phone = "";
          let description = "";

          try {
            const charge = await stripe.charges.retrieve(source);
            name = charge.billing_details?.name || "";
            email = charge.billing_details?.email || "";

            const metadata = charge.metadata || {};

            let puppy = {};
            let user = {};

            try {
              puppy = JSON.parse(metadata.puppy || "{}");
              phone = puppy.buyerPhone || "";
            } catch {}

            try {
              user = JSON.parse(metadata.user || "{}");
              phone = phone || user.phone || "";
            } catch {}

            const type = metadata.transaction_type || "";
            const puppyName = puppy.name || "";
            const puppyBreed = Array.isArray(puppy.breed)
              ? puppy.breed.join(", ")
              : puppy.breed || "";

            description = `${type} - ${puppyName} - ${puppyBreed}`;
          } catch (err) {
            console.warn(`⚠️ Could not enrich charge ${source}:`, err.message);
          }

          return {
            id,
            name,
            email,
            phone,
            amount: ((net || 0) / 100).toFixed(2),
            net: (tx.net / 100).toFixed(2),
            description,
          };
        })
    );

    const htmlContent = generateFaxHTML(payoutId, transactions);

    const baseUrl = process.env.ORIGIN_URL;

    const faxResponse = await fetch(`${baseUrl}/api/fax`, {
      method: "POST",
      headers: { "Content-Type": "text/html" },
      body: htmlContent,
    });

    const faxResult = await faxResponse.json();

    return NextResponse.json({
      message: "Fax initiated",
      faxResult,
    });
  } catch (err) {
    console.error("❌ Error in /api/test:", err.message);
    return NextResponse.json(
      { error: "Internal server error", details: err.message },
      { status: 500 }
    );
  }
}
