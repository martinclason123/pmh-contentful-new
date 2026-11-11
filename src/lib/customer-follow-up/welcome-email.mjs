import { readFile } from "node:fs/promises";

const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character],
);

const images = {
  entrance: { id: "pmh-entrance", filename: "pmh-barn-entrance.jpg", alt: "The brown barn and pickup entrance", width: 520, source: new URL("./email-assets/pmh-barn-entrance.jpg", import.meta.url) },
  logo: { id: "pmh-logo", filename: "pmh-heart-logo.png", alt: "Paw Prints on My Heart logo", width: 105, source: new URL("./email-assets/pmh-heart-logo.png", import.meta.url), contentType: "image/png" },
  food: { id: "pmh-food", filename: "royal-canin-small-puppy.jpg", alt: "Royal Canin Small Puppy dry dog food bag", width: 200, source: new URL("./email-assets/royal-canin-small-puppy.jpg", import.meta.url) },
};

function inlineImage({ id, alt, width }) {
  return `<img src="cid:${id}" alt="${alt}" width="${width}" style="display:block;width:100%;max-width:${width}px;height:auto;border-radius:8px;">`;
}

export async function welcomeEmail({ customerName, puppyName, pickupAt, timeZone, breederName, stopUrl }) {
  const appointment = new Intl.DateTimeFormat("en-US", {
    timeZone, weekday: "long", month: "long", day: "numeric",
    hour: "numeric", minute: "2-digit", timeZoneName: "short",
  }).format(new Date(pickupAt));
  const subject = `See you soon! Pickup details for ${puppyName}`;
  const greeting = customerName ? `Hi ${customerName},` : "Hi there,";
  const intro = `We’re excited to see you and send ${puppyName} home with you!`;
  const street = "7303 S Wicker Rd";
  const city = "Sheridan, MI 48884, United States";
  const directions = "Use this address for directions. We’ll meet you at the brown barn across the street.";
  const videoUrl = "https://youtube.com/shorts/RTbVOvEzsI4?feature=share";
  const videoLabel = "Click here to watch the pickup video";
  const ride = "Bring a secure crate or carrier and a washable blanket. Some puppies get carsick, so pack paper towels, wipes, and a bag for cleanup.";
  const food = "Your puppy eats Royal Canin Small Puppy (Small / Petit) dry food.";
  const home = "Set up a crate in a quiet spot at home. A crate gives your puppy a place to rest and can help with house training. A puppy-sized KONG can give them something to do while you supervise.";
  const closing = "Questions before pickup? Just reply to this email. See you soon!";
  const stopLabel = "Stop pickup follow-up emails";
  const text = [
    greeting, intro, `Pickup\n${appointment}\n${street}\n${city}\n${directions}
${videoLabel}: ${videoUrl}`,
    `For the ride home\n${ride}`, `Food\n${food}`, `At home\n${home}`, closing, breederName, ...(stopUrl ? [`${stopLabel}: ${stopUrl}`] : []),
  ].join("\n\n");
  const heading = (label) => `<h2 style="font-size:18px;margin:24px 0 6px;">${label}</h2>`;
  const html = `<div style="font-family:Arial,sans-serif;font-size:16px;line-height:1.5;color:#242424;max-width:560px;margin:0 auto;padding:16px;">
    <p>${escapeHtml(greeting)}</p><p>${escapeHtml(intro)}</p>
    ${heading("Pickup")}
    <p style="margin:0;"><strong>${escapeHtml(appointment)}</strong><br>${street}<br>${city}</p>
    <p>${directions}</p>
    <p style="margin-bottom:8px;">See the barn entrance and where we’ll meet you.</p>
    <p style="margin:0 0 6px;"><a href="${escapeHtml(videoUrl)}" style="display:inline-block;background-color:#a80030;color:#ffffff;padding:12px 16px;border-radius:6px;font-weight:bold;text-decoration:underline;">${videoLabel}</a></p>
    <p style="margin:0 0 12px;">The video opens on YouTube.</p>
    ${inlineImage(images.entrance)}
    ${heading("For the ride home")}<p style="margin-top:0;">${ride}</p>
    ${heading("Food")}<p style="margin-top:0;">${food}</p>${inlineImage(images.food)}
    ${heading("At home")}<p style="margin-top:0;">${home}</p>
    <p>${closing}</p><p style="margin-bottom:8px;"><strong>${escapeHtml(breederName)}</strong></p>
    ${inlineImage(images.logo)}
    ${stopUrl ? `<p style="font-size:13px;"><a href="${escapeHtml(stopUrl)}">${stopLabel}</a></p>` : ""}
  </div>`;
  const attachments = await Promise.all(Object.values(images).map(async ({ id, filename, source, contentType = "image/jpeg" }) => ({
    filename,
    content_id: id,
    content_type: contentType,
    content: (await readFile(source)).toString("base64"),
  })));
  return { subject, text, html, attachments };
}
