import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    domain: "auction",
    message: "Auction lots endpoint placeholder",
  });
}
