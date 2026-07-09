import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { saveUploadedFile } from "@/lib/server/upload-storage";

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function isAllowedDocumentType(file: File) {
  const allowed = ["application/pdf", "image/jpeg", "image/png"];
  return allowed.includes(file.type);
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(request: Request) {
  const formData = await request.formData();

  const farmName = readString(formData, "farmName");
  const location = readString(formData, "location");
  const region = readString(formData, "region");
  const contactPhone = readString(formData, "contactPhone");
  const contactEmail = readString(formData, "contactEmail");
  const nationalIdNumber = readString(formData, "nationalIdNumber");
  const idDocumentEntry = formData.get("idDocument");

  if (!farmName || !location || !region || !contactPhone || !contactEmail || !nationalIdNumber) {
    return NextResponse.json(
      {
        error:
          "farmName, location, region, contactPhone, contactEmail, and nationalIdNumber are required.",
      },
      { status: 400 },
    );
  }

  if (!isValidEmail(contactEmail)) {
    return NextResponse.json({ error: "Please provide a valid email address." }, { status: 400 });
  }

  if (!(idDocumentEntry instanceof File)) {
    return NextResponse.json({ error: "ID document upload is required." }, { status: 400 });
  }

  if (idDocumentEntry.size === 0) {
    return NextResponse.json({ error: "Uploaded ID document is empty." }, { status: 400 });
  }

  if (idDocumentEntry.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "ID document must be smaller than 5MB." }, { status: 400 });
  }

  if (!isAllowedDocumentType(idDocumentEntry)) {
    return NextResponse.json({ error: "ID document must be PDF, JPG, or PNG." }, { status: 400 });
  }

  const applicationId = `SELL-${Date.now()}`;

  try {
    const user = await prisma.user.upsert({
      where: { email: contactEmail.toLowerCase() },
      update: {
        fullName: farmName,
        phone: contactPhone,
      },
      create: {
        email: contactEmail.toLowerCase(),
        fullName: farmName,
        phone: contactPhone,
      },
    });

    const idDocumentUrl = await saveUploadedFile(idDocumentEntry, "seller", applicationId);

    await prisma.seller.upsert({
      where: { userId: user.id },
      update: {
        farmName,
        location,
        region,
        contactPhone,
        nationalIdNumber,
        idDocumentUrl,
        status: "PENDING",
      },
      create: {
        userId: user.id,
        farmName,
        location,
        region,
        contactPhone,
        nationalIdNumber,
        idDocumentUrl,
        status: "PENDING",
      },
    });

    return NextResponse.json({
      applicationId,
      status: "PENDING",
      message: "Seller application submitted successfully. Verification is pending.",
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to save seller application at the moment." },
      { status: 500 },
    );
  }
}
