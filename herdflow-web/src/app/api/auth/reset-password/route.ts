import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/user-auth";

export const dynamic = "force-dynamic";

// ── GET — verify token ─────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  if (!token || token.length !== 64) {
    return NextResponse.json({ valid: false, reason: "invalid" });
  }

  try {
    const record = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: { select: { email: true, fullName: true } } },
    });

    if (!record) return NextResponse.json({ valid: false, reason: "invalid" });
    if (record.usedAt) return NextResponse.json({ valid: false, reason: "used" });
    if (record.expiresAt < new Date()) return NextResponse.json({ valid: false, reason: "expired" });

    return NextResponse.json({ valid: true, email: record.user.email });
  } catch {
    return NextResponse.json({ valid: false, reason: "error" });
  }
}

// ── POST — reset password ──────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  let body: { token?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const token = (body.token || "").trim();
  const password = (body.password || "").trim();

  if (!token || token.length !== 64) {
    return NextResponse.json({ error: "Invalid reset token." }, { status: 400 });
  }

  // Server-side password validation
  if (!password || password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }
  if (password.length > 128) {
    return NextResponse.json({ error: "Password is too long (max 128 characters)." }, { status: 400 });
  }
  if (!/[A-Z]/.test(password)) {
    return NextResponse.json({ error: "Password must contain at least one uppercase letter." }, { status: 400 });
  }
  if (!/[0-9]/.test(password)) {
    return NextResponse.json({ error: "Password must contain at least one number." }, { status: 400 });
  }

  try {
    const record = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!record) return NextResponse.json({ error: "Invalid or expired reset link." }, { status: 400 });
    if (record.usedAt) return NextResponse.json({ error: "This reset link has already been used." }, { status: 400 });
    if (record.expiresAt < new Date()) return NextResponse.json({ error: "This reset link has expired. Please request a new one." }, { status: 400 });

    const passwordHash = await hashPassword(password);

    // Use transaction: update password + mark token used atomically
    await prisma.$transaction([
      prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
      prisma.passwordResetToken.update({ where: { token }, data: { usedAt: new Date() } }),
    ]);

    return NextResponse.json({ success: true, message: "Password updated successfully." });
  } catch (err) {
    console.error("Reset password error:", err);
    return NextResponse.json({ error: "Failed to reset password. Please try again." }, { status: 500 });
  }
}
