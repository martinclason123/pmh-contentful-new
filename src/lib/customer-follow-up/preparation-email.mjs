const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character],
);

export function preparationEmail({ customerName, puppyName, pickupAt, timeZone, breederName }) {
  const appointment = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(new Date(pickupAt));

  const subject = `Getting ready to bring ${puppyName} home`;
  const greeting = `Hi ${customerName},`;
  const intro = `We’re excited for you to bring ${puppyName} home! Your pickup is scheduled for ${appointment}.`;
  const checklist = [
    "Bring a secure carrier or crate and a washable towel or blanket for the ride home.",
    "Have your pickup confirmation and any remaining paperwork handy.",
    "Bring any questions about your puppy’s first few days at home.",
  ];
  const food = "We’ll go over your puppy’s current food and feeding routine at pickup. If you plan to switch foods, ask us how to make the transition gradually.";
  const crate = "Set up a quiet spot with a crate before pickup. Ask us what your puppy is used to so you can build on that routine at home.";
  const closing = "If you have questions before pickup, just reply to this email. We’re happy to help.";

  const text = [
    greeting, intro, "What to bring\n" + checklist.map((item) => "- " + item).join("\n"),
    "Food and feeding\n" + food, "Getting the crate ready\n" + crate, closing, breederName,
  ].join("\n\n");
  const html = `<p>${escapeHtml(greeting)}</p><p>${escapeHtml(intro)}</p>
    <h2>What to bring</h2><ul>${checklist.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
    <h2>Food and feeding</h2><p>${escapeHtml(food)}</p>
    <h2>Getting the crate ready</h2><p>${escapeHtml(crate)}</p>
    <p>${escapeHtml(closing)}</p><p>${escapeHtml(breederName)}</p>`;
  return { subject, text, html };
}
