import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    {
      status: "ok",
      service: "herdflow-web",
      scope: ["store", "auction"],
      commit: process.env.RENDER_GIT_COMMIT || "local",
      deployId: process.env.RENDER_DEPLOY_ID || "local",
      timestamp: new Date().toISOString(),
    },
    {
      headers: {
        "cache-control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        pragma: "no-cache",
        expires: "0",
      },
    },
  );
}
