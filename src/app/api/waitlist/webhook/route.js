import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const rawBody = await req.text();

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error("[waitlist/webhook] error:", error);

    return NextResponse.json({ received: false }, { status: 400 });
  }
}
