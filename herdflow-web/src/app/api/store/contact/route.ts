import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type ContactBody = {
  fullName?: string;
  email?: string;
  phone?: string;
  subject?: string;
  message?: string;
};

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as ContactBody;

  const fullName = (body.fullName || "").trim();
  const email = (body.email || "").trim();
  const phone = (body.phone || "").trim();
  const subject = (body.subject || "").trim();
  const message = (body.message || "").trim();

  if (!fullName || !email || !subject || !message) {
    return NextResponse.json(
      { error: "fullName, email, subject, and message are required." },
      { status: 400 },
    );
  }

  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Please provide a valid email address." }, { status: 400 });
  }

  if (message.length < 15) {
    return NextResponse.json({ error: "Please provide more details in your message." }, { status: 400 });
  }

  const inquiryId = `INQ-${Date.now()}`;

  try {
    await prisma.contactInquiry.create({
      data: {
        inquiryNumber: inquiryId,
        fullName,
        email: email.toLowerCase(),
        phone: phone || null,
        subject,
        message,
      },
    });

    return NextResponse.json({
      inquiryId,
      message: "Your enquiry has been submitted. The HerdFlow team will respond during business hours.",
      received: {
        fullName,
        email,
        phone,
        subject,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to save enquiry at the moment." },
      { status: 500 },
    );
  }
}
