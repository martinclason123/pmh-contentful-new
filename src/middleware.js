import { NextResponse } from "next/server";

export function middleware(request) {
  if (process.env.NODE_ENV === "development" &&
      process.env.LOCAL_DEPOSIT_TEST === "true") {
    const { pathname } = request.nextUrl;
    const { method } = request;
    const checkout = method === "POST" &&
      (pathname === "/api/deposit" || pathname === "/api/payment-webhook");
    const fixture = method === "GET" && pathname === "/api/puppy";
    if (!checkout && !fixture) {
      return new NextResponse("This API is disabled during local checkout testing", { status: 403 });
    }
  }

  return NextResponse.next();
}

export const config = { matcher: "/api/:path*" };
