const singleEmail = /^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/;

export async function sendFollowUpEmail({
  email, customerEmail, from, replyTo, auditEmail, apiKey, idempotencyKey, preview = false,
}) {
  const audit = auditEmail?.trim();
  const recipient = preview ? audit : customerEmail?.trim();
  if (!singleEmail.test(audit || "") || !singleEmail.test(recipient || "") ||
      !from || !singleEmail.test(replyTo || "") || !apiKey || !idempotencyKey) {
    throw new Error("Follow-up delivery requires a sender, reply address, audit inbox and delivery key");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify({
      from,
      reply_to: replyTo,
      to: [recipient],
      ...(recipient.toLowerCase() !== audit.toLowerCase() && { bcc: [audit] }),
      subject: preview ? `[LOCAL TEST] ${email.subject}` : email.subject,
      html: email.html,
      text: email.text,
      ...(email.attachments?.length && { attachments: email.attachments }),
    }),
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error(`Resend rejected the follow-up (HTTP ${response.status})`);
  const { id } = await response.json();
  if (typeof id !== "string" || !id) throw new Error("Resend did not return a delivery ID");
  return id;
}
