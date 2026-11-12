import { readFile } from "node:fs/promises";

const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character],
);
const phone = "616-302-5766";
const logo = new URL("./email-assets/pmh-heart-logo.png", import.meta.url);

export async function pickupDayEmail({ customerName, puppyName, breederName = "Paw Prints on My Heart", stopUrl }) {
  const greeting = customerName ? `Hi ${customerName},` : "Hi there,";
  const intro = `Happy pickup day! The first couple of nights with ${puppyName} may be a little bumpy. A bit of whining, restless sleep, or a soft stool can happen as your puppy settles in. A quiet routine and familiar food can help.`;
  const crate = "Keep the crate near you at night. Let your puppy explore it with a treat, start with short, calm sessions, and expect a quiet potty break or two overnight.";
  const symptoms = "A move can upset a puppy’s stomach. Loose stool is somewhat common, but if you observe concerning symptoms, or you notice blood in their stool or anything else that worries you, please reach out right away.";
  const support = "Call your breeder at";
  const triage = "We know your puppy’s routine and health history. We can talk through what you’re seeing and help you figure out the next step.";
  const urgent = "If your puppy seems very weak, refuses food or water, vomits repeatedly, can’t keep water down, or has heavy bloody diarrhea, get urgent help without waiting for a callback.";
  const check = "Please call to book your puppy’s first vet check as soon as you can. The visit should happen within one week of pickup, as outlined in your health guarantee, so your vet can document how your puppy is doing after coming home.";
  const stopLabel = "Stop pickup follow-up emails";
  const text = [
    greeting, intro, "The first few nights\n" + crate,
    "If something seems off\n" + symptoms + "\n\n" + support + " " + phone + ". " + triage + "\n\n" + urgent,
    "Book the first vet visit\n" + check, "We’re excited for you both!", breederName,
    ...(stopUrl ? [`${stopLabel}: ${stopUrl}`] : []),
  ].join("\n\n");
  const heading = (label) => `<h2 style="font-size:18px;margin:22px 0 6px;">${label}</h2>`;
  const html = `<div style="font-family:Arial,sans-serif;font-size:16px;line-height:1.5;color:#242424;max-width:560px;margin:0 auto;padding:16px;">
    <p>${escapeHtml(greeting)}</p><p>${escapeHtml(intro)}</p>
    ${heading("The first few nights")}<p style="margin-top:0;">${escapeHtml(crate)}</p>
    ${heading("If something seems off")}<p style="margin-top:0;">${escapeHtml(symptoms)}</p>
    <p>${support} <a href="tel:+16163025766">${phone}</a>. ${escapeHtml(triage)}</p>
    <p>${escapeHtml(urgent)}</p>
    ${heading("Book the first vet visit")}<p style="margin-top:0;">${escapeHtml(check)}</p>
    <p>We’re excited for you both!</p><p><strong>${escapeHtml(breederName)}</strong></p>
    <img src="cid:pmh-logo" alt="Paw Prints on My Heart logo" width="105" style="display:block;width:105px;height:auto;">
    ${stopUrl ? `<p style="font-size:13px;"><a href="${escapeHtml(stopUrl)}">${stopLabel}</a></p>` : ""}
  </div>`;
  return {
    subject: `Welcome home, ${puppyName}! The first few nights`,
    text,
    html,
    attachments: [{
      filename: "pmh-heart-logo.png", content_id: "pmh-logo", content_type: "image/png",
      content: (await readFile(logo)).toString("base64"),
    }],
  };
}
