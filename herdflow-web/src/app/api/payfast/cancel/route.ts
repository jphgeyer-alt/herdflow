import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    provider: "PayFast",
    message: "PayFast cancel placeholder",
  });
}
