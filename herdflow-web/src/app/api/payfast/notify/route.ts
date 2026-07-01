import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({
    provider: "PayFast",
    message: "PayFast ITN placeholder",
  });
}
