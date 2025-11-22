// src/app/api/send-sms/route.js (or route.ts)
export async function POST(req) {
  try {
    const { name, mobile, message } = await req.json();

    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    if (!webhookUrl) {
      console.error("Missing DISCORD_WEBHOOK_URL env var");
      return Response.json(
        { success: false, error: "Server not configured" },
        { status: 500 }
      );
    }

    const content = [
      "**New Puppy Inquiry** 🐾",
      `**Name:** ${name || "N/A"}`,
      `**Phone:** ${mobile || "N/A"}`,
      `**Message:**`,
      message || "(no message)",
    ].join("\n");

    const discordRes = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content,
      }),
    });

    if (!discordRes.ok) {
      const text = await discordRes.text();
      console.error("Discord webhook error:", discordRes.status, text);
      return Response.json(
        { success: false, error: "Discord webhook failed" },
        { status: 500 }
      );
    }

    return Response.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Notification Error:", error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
