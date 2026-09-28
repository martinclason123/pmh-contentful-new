import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const token = process.env.CALENDLY_ACCESS_TOKEN;
const signingKey = process.env.CALENDLY_WEBHOOK_SIGNING_KEY;
const origin = process.env.ORIGIN_URL;

if (!token || !signingKey || !origin) {
  throw new Error(
    "CALENDLY_ACCESS_TOKEN, CALENDLY_WEBHOOK_SIGNING_KEY, and ORIGIN_URL are required"
  );
}

const callbackUrl = new URL("/api/calendly-webhook", origin).toString();

if (new URL(callbackUrl).protocol !== "https:") {
  throw new Error("The Calendly webhook callback must use HTTPS");
}

async function calendlyRequest(path, options = {}) {
  const response = await fetch(`https://api.calendly.com${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      `Calendly request failed (${response.status}): ${JSON.stringify(body)}`
    );
  }

  return body;
}

const currentUser = (await calendlyRequest("/users/me")).resource;
const query = new URLSearchParams({
  organization: currentUser.current_organization,
  user: currentUser.uri,
  scope: "user",
  count: "100",
});
const subscriptions = await calendlyRequest(
  `/webhook_subscriptions?${query.toString()}`
);
const activeSubscriptions = subscriptions.collection.filter(
  (subscription) =>
    subscription.callback_url === callbackUrl &&
    subscription.state === "active"
);
const desiredEvents = ["invitee.created", "invitee.canceled"];
const completeSubscription = activeSubscriptions.find((subscription) =>
  desiredEvents.every((event) => subscription.events.includes(event))
);

if (completeSubscription) {
  console.log(
    `Calendly webhook is already active for scheduling and cancellations at ${callbackUrl}`
  );
  process.exit(0);
}

for (const subscription of activeSubscriptions) {
  const subscriptionId = subscription.uri.split("/").filter(Boolean).pop();

  await calendlyRequest(`/webhook_subscriptions/${subscriptionId}`, {
    method: "DELETE",
  });
}

await calendlyRequest("/webhook_subscriptions", {
  method: "POST",
  body: JSON.stringify({
    url: callbackUrl,
    events: desiredEvents,
    organization: currentUser.current_organization,
    user: currentUser.uri,
    scope: "user",
    signing_key: signingKey,
  }),
});

console.log(
  `Created Calendly webhook subscription for ${desiredEvents.join(
    ", "
  )} at ${callbackUrl}`
);
