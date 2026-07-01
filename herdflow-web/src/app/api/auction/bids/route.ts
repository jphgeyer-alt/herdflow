import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({
    domain: "auction",
    message: "Auction bid endpoint placeholder",
  });
}
