import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const fullName = (b.fullName as string | undefined)?.trim();
  const email = (b.email as string | undefined)?.trim().toLowerCase();
  const phone = (b.phone as string | undefined)?.trim() || null;
  const subject = (b.subject as string | undefined)?.trim();
  const message = (b.message as string | undefined)?.trim();

  // Validation
  if (!fullName || fullName.length < 2) {
    return NextResponse.json({ error: "Full name must be at least 2 characters" }, { status: 400 });
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
  }

  if (!subject || subject.length < 3) {
    return NextResponse.json({ error: "Subject must be at least 3 characters" }, { status: 400 });
  }

  if (!message || message.length < 10) {
    return NextResponse.json({ error: "Message must be at least 10 characters" }, { status: 400 });
  }

  try {
    // Generate unique inquiry number
    const inquiryNumber = `INQ-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    // Save to database
    const inquiry = await prisma.contactInquiry.create({
      data: {
        inquiryNumber,
        fullName,
        email,
        phone,
        subject,
        message,
        status: "NEW",
      },
    });

    // TODO: Send email notification (requires SMTP configuration)
    // In production, integrate with email service like SendGrid, AWS SES, or Resend

    return NextResponse.json({
      ok: true,
      inquiryNumber: inquiry.inquiryNumber,
      message: "Your inquiry has been submitted successfully.",
    });
  } catch (err) {
    console.error("Contact form error:", err);
    return NextResponse.json({ error: "Failed to submit inquiry. Please try again." }, { status: 500 });
  }
}
