import { readFile } from "node:fs/promises";

const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character],
);

const facebookUrl = "https://www.facebook.com/profile.php?id=61582896891113";
const logo = new URL("./email-assets/pmh-heart-logo.png", import.meta.url);

export async function oneWeekEmail({
  customerName, puppyName, breederName = "Paw Prints on My Heart", stopUrl,
}) {
  const greeting = customerName ? `Hi ${customerName},` : "Hi there,";
  const intro = `Happy first week with ${puppyName}! How’s life together so far?`;
  const support = "We’d love to hear how things are going, even if it’s been a bumpy start. If you’re worried about your puppy’s health or noticing a serious behavior concern, please reach out so we can talk it through. If you’d like help with training, we’re happy to put you in touch with a trainer.";
  const photo = `Found a favorite nap spot or had a little first-week win? We’d love to hear about it! If you’d like to share a photo of ${puppyName} at home, we’d love to see it. Just reply to this email with your photo and a few words, or send us a message on Facebook.`;
  const signoff = "We’d love to hear from you!";
  const stopLabel = "Stop pickup follow-up emails";
  const text = [
    greeting, intro, photo,
    "Find us on Facebook and tap Message: " + facebookUrl,
    support, signoff, breederName, ...(stopUrl ? [`${stopLabel}: ${stopUrl}`] : []),
  ].join("\n\n");
  const html = `<div style="font-family:Arial,sans-serif;font-size:16px;line-height:1.5;color:#242424;max-width:560px;margin:0 auto;padding:16px;">
    <p>${escapeHtml(greeting)}</p>
    <p>${escapeHtml(intro)}</p>
    <p>${escapeHtml(photo)}</p>
    <p style="margin:0 0 8px;"><a href="${facebookUrl}" style="display:inline-block;background-color:#a80030;color:#ffffff;padding:12px 16px;border-radius:6px;font-weight:bold;text-decoration:underline;">Visit us on Facebook</a></p>
    <p style="font-size:14px;margin-top:0;">Tap <strong>Message</strong> on our Facebook page to send your update.</p>
    <p>${support}</p>
    <p>${signoff}</p><p><strong>${escapeHtml(breederName)}</strong></p>
    <img src="cid:pmh-logo" alt="Paw Prints on My Heart logo" width="105" style="display:block;width:105px;height:auto;">
    ${stopUrl ? `<p style="font-size:13px;"><a href="${escapeHtml(stopUrl)}">${stopLabel}</a></p>` : ""}
  </div>`;
  return {
    subject: `How’s ${puppyName} settling in?`,
    text,
    html,
    attachments: [{
      filename: "pmh-heart-logo.png", content_id: "pmh-logo", content_type: "image/png",
      content: (await readFile(logo)).toString("base64"),
    }],
  };
}
