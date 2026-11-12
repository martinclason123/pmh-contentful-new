import { readFile } from "node:fs/promises";

const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character],
);

const googleReviewUrl = "https://g.page/r/CY790YOY8l0sEBM/review";
const facebookUrl = "https://www.facebook.com/profile.php?id=61582896891113";
const phone = "616-302-5766";
const logo = new URL("./email-assets/pmh-heart-logo.png", import.meta.url);

export async function reviewEmail({
  customerName, puppyName, breederName = "Paw Prints on My Heart", stopUrl, reviewUrl = googleReviewUrl,
}) {
  const greeting = customerName ? `Hi ${customerName},` : "Hi there,";
  const intro = `We hope you and ${puppyName} are having fun getting to know each other! Would you take a minute to leave us an honest Google review about your experience? Your review helps other families know what to expect and makes it easier for them to find us. It means a lot to our small team.`;
  const feedback = "Is there anything we could have done better? We’d love your suggestions. Just reply to this email or send us a message on Facebook.";
  const concern = "If something is concerning you, please call us or send us a message. We absolutely want to know.";
  const signoff = `Thanks for choosing us and for giving ${puppyName} a loving home!`;
  const stopLabel = "Stop pickup follow-up emails";
  const text = [
    greeting, intro, "Leave a Google review: " + reviewUrl,
    feedback, "Visit us on Facebook: " + facebookUrl, concern, "Call us at " + phone + ".",
    signoff, breederName, ...(stopUrl ? [`${stopLabel}: ${stopUrl}`] : []),
  ].join("\n\n");
  const html = `<div style="font-family:Arial,sans-serif;font-size:16px;line-height:1.5;color:#242424;max-width:560px;margin:0 auto;padding:16px;">
    <p>${escapeHtml(greeting)}</p>
    <p>${escapeHtml(intro)}</p>
    <p><a href="${escapeHtml(reviewUrl)}" style="display:inline-block;background-color:#a80030;color:#ffffff;padding:12px 16px;border-radius:6px;font-weight:bold;text-decoration:underline;">Leave a Google review</a></p>
    <p>Is there anything we could have done better? We’d love your suggestions. Just reply to this email or <a href="${facebookUrl}">visit us on Facebook</a> and tap <strong>Message</strong>.</p>
    <p>${concern} Call us at <a href="tel:+16163025766">${phone}</a>.</p>
    <p>${escapeHtml(signoff)}</p><p><strong>${escapeHtml(breederName)}</strong></p>
    <img src="cid:pmh-logo" alt="Paw Prints on My Heart logo" width="105" style="display:block;width:105px;height:auto;">
    ${stopUrl ? `<p style="font-size:13px;"><a href="${escapeHtml(stopUrl)}">${stopLabel}</a></p>` : ""}
  </div>`;
  return {
    subject: "How did we do?",
    text,
    html,
    attachments: [{
      filename: "pmh-heart-logo.png", content_id: "pmh-logo", content_type: "image/png",
      content: (await readFile(logo)).toString("base64"),
    }],
  };
}
