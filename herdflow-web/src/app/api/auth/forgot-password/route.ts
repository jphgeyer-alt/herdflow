import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

// ── Simple in-memory rate limiting ────────────────────────────────────────────
// Resets on server restart — good enough for MVP without Redis
const ipRequests = new Map<string, { count: number; resetAt: number }>();
const emailRequests = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(
  key: string,
  store: Map<string, { count: number; resetAt: number }>,
  maxRequests: number,
  windowMs: number,
): boolean {
  const now = Date.now();
  const entry = store.get(key);
  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return false; // not rate limited
  }
  if (entry.count >= maxRequests) return true; // rate limited
  entry.count++;
  return false;
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

  // Rate limit: 10 req/IP per hour, 3 req/email per 15 min
  if (checkRateLimit(ip, ipRequests, 10, 60 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Too many requests. Please wait before trying again." },
      { status: 429 },
    );
  }

  // Always return the same success response to prevent email enumeration
  const successResponse = NextResponse.json({
    success: true,
    message: "If an account exists with this email you will receive a reset link shortly.",
  });

  let email: string;
  try {
    const body = await request.json();
    email = (body.email || "").toLowerCase().trim();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!email || !/\S+@\S+\.\S+/.test(email)) {
    return NextResponse.json({ error: "Valid email address is required." }, { status: 400 });
  }

  // Per-email rate limit: 3 per 15 min
  if (checkRateLimit(email, emailRequests, 3, 15 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Too many requests for this email. Please wait 15 minutes." },
      { status: 429 },
    );
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return successResponse; // don't reveal email doesn't exist

    // Delete any existing unused tokens
    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id, usedAt: null } });

    // Generate secure 32-byte random token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.passwordResetToken.create({ data: { userId: user.id, token, expiresAt } });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.herdflow.co.za";
    const resetUrl = `${appUrl}/auth/reset-password?token=${token}`;

    await sendPasswordResetEmail({
      to: user.email,
      name: user.fullName || "HerdFlow User",
      resetUrl,
      expiresIn: "1 hour",
    });
  } catch (err) {
    console.error("Forgot password error:", err);
    // Return success anyway to prevent info leakage
  }

  return successResponse;
}
