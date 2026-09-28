import "server-only";

export default async function sendFaxHtml(
  html,
  filename = "notification.html"
) {
  const accessKey = process.env.SINCH_ACCESS_KEY;
  const accessSecret = process.env.SINCH_ACCESS_SECRET;
  const projectId = process.env.SINCH_PROJECT_ID;
  const toNumber = process.env.CONTACT_FAX_NUMBER;

  if (!accessKey || !accessSecret || !projectId || !toNumber) {
    throw new Error(
      "SINCH_ACCESS_KEY, SINCH_ACCESS_SECRET, SINCH_PROJECT_ID, and CONTACT_FAX_NUMBER are required"
    );
  }

  const form = new FormData();
  form.append("to", toNumber);
  form.append("file", new Blob([html], { type: "text/html" }), filename);

  const response = await fetch(
    `https://fax.api.sinch.com/v3/projects/${projectId}/faxes/`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(
          `${accessKey}:${accessSecret}`
        ).toString("base64")}`,
      },
      body: form,
      cache: "no-store",
      signal: AbortSignal.timeout(30000),
    }
  );

  if (!response.ok) {
    throw new Error(`Sinch fax request failed (${response.status})`);
  }

  return response.json();
}
