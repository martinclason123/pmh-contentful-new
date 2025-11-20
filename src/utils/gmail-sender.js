import { google } from "googleapis";

export function getGmailClient() {
  const {
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI,
    GMAIL_ACCESS_TOKEN,
    GMAIL_REFRESH_TOKEN,
    GMAIL_SCOPE,
    GMAIL_TOKEN_TYPE,
    GMAIL_EXPIRY_DATE,
  } = process.env;

  const oAuth2Client = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI
  );

  oAuth2Client.setCredentials({
    access_token: GMAIL_ACCESS_TOKEN,
    refresh_token: GMAIL_REFRESH_TOKEN,
    scope: GMAIL_SCOPE,
    token_type: GMAIL_TOKEN_TYPE,
    expiry_date: Number(GMAIL_EXPIRY_DATE),
  });

  return google.gmail({ version: "v1", auth: oAuth2Client });
}

/**
 * Sends a plain-text email through Gmail API.
 * @param {string} to - Recipient email address (e.g. 6162389368@tmomail.net)
 * @param {string} subject - Email subject
 * @param {string} body - Plain text body
 */
export async function sendGmailMessage({ to, subject, body }) {
  const gmail = getGmailClient();

  const message = [`To: ${to}`, `Subject: ${subject}`, "", body].join("\n");

  const encodedMessage = Buffer.from(message)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const res = await gmail.users.messages.send({
    userId: "me",
    resource: {
      raw: encodedMessage,
    },
  });

  return res.data;
}
