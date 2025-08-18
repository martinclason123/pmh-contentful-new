export default async function addSubscriber(email, interests) {
  const response = await fetch("/api/mailchimp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ subscriber: email, interests: interests }),
  });

  if (!response.ok) {
    return "Errors";
  } else {
    return "Success!";
  }
}
