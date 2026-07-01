import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    domain: "store",
    message: "Store products endpoint placeholder",
  });
}
