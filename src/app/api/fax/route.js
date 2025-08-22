
import axios from "axios";
import { NextResponse } from "next/server";
import FormData from "form-data";
import { Readable } from "stream";

export async function POST(req) {
  const ACCESS_KEY = process.env.SINCH_ACCESS_KEY;
  const ACCESS_SECRET = process.env.SINCH_ACCESS_SECRET;
  const PROJECT_ID = process.env.SINCH_PROJECT_ID;

  const TO_NUMBER = process.env.CONTACT_FAX_NUMBER;

  try {
    const html = await req.text();

    const form = new FormData();
    form.append("to", TO_NUMBER);
    form.append("file", Readable.from([html]), {
      filename: "payout-summary.html",
      contentType: "text/html",
    });

    const response = await axios.post(
      `https://fax.api.sinch.com/v3/projects/${PROJECT_ID}/faxes/`,
      form,
      {
        auth: {
          username: ACCESS_KEY,
          password: ACCESS_SECRET,
        },
        headers: form.getHeaders(),
      }
    );

    return NextResponse.json({ success: true, data: response.data });
  } catch (error) {
    if (error.response) {
      console.error("📛 Fax API Error Response:", error.response.data);
      return NextResponse.json(
        {
          success: false,
          status: error.response.status,
          message: error.response.data?.message || "Unknown error from Sinch",
          details: error.response.data,
        },
        { status: error.response.status }
      );
    } else {
      console.error("❗ General Error:", error.message);
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 500 }
      );
    }
  }
}
