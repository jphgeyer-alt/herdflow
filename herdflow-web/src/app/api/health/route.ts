import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "herdflow-web",
    scope: ["store", "auction"],
    timestamp: new Date().toISOString(),
  });
}
