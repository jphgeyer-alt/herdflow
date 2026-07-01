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

  const companyName = readString(formData, "companyName");
  const contactPhone = readString(formData, "contactPhone");
  const contactEmail = readString(formData, "contactEmail");
  const routesCovered = readString(formData, "routesCovered");
  const fleetSizeRaw = readString(formData, "fleetSize");
  const vehicleDocumentsEntry = formData.get("vehicleDocuments");
  const fleetSize = Number.parseInt(fleetSizeRaw, 10);

  if (!companyName || !contactPhone || !contactEmail || !routesCovered || !fleetSizeRaw) {
    return NextResponse.json(
      { error: "companyName, contactPhone, contactEmail, fleetSize, and routesCovered are required." },
      { status: 400 },
    );
  }

  if (!Number.isInteger(fleetSize) || fleetSize <= 0) {
    return NextResponse.json({ error: "fleetSize must be a positive integer." }, { status: 400 });
  }

  if (!isValidEmail(contactEmail)) {
    return NextResponse.json({ error: "Please provide a valid email address." }, { status: 400 });
  }

  if (!(vehicleDocumentsEntry instanceof File)) {
    return NextResponse.json({ error: "Vehicle documents upload is required." }, { status: 400 });
  }

  if (vehicleDocumentsEntry.size === 0) {
    return NextResponse.json({ error: "Uploaded vehicle document is empty." }, { status: 400 });
  }

  if (vehicleDocumentsEntry.size > 8 * 1024 * 1024) {
    return NextResponse.json({ error: "Vehicle document must be smaller than 8MB." }, { status: 400 });
  }

  if (!isAllowedDocumentType(vehicleDocumentsEntry)) {
    return NextResponse.json({ error: "Vehicle document must be PDF, JPG, or PNG." }, { status: 400 });
  }

  const applicationId = `LOG-${Date.now()}`;

  try {
    const user = await prisma.user.upsert({
      where: { email: contactEmail.toLowerCase() },
      update: {
        fullName: companyName,
        phone: contactPhone,
      },
      create: {
        email: contactEmail.toLowerCase(),
        fullName: companyName,
        phone: contactPhone,
      },
    });

    const vehicleDocumentsUrl = await saveUploadedFile(vehicleDocumentsEntry, "logistics", applicationId);

    await prisma.logisticsPartner.upsert({
      where: { userId: user.id },
      update: {
        companyName,
        fleetSize,
        routesCovered,
        vehicleDocumentsUrl,
        status: "PENDING",
      },
      create: {
        userId: user.id,
        companyName,
        fleetSize,
        routesCovered,
        vehicleDocumentsUrl,
        status: "PENDING",
      },
    });

    return NextResponse.json({
      applicationId,
      status: "PENDING",
      message: "Logistics application submitted successfully. Verification is pending.",
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to save logistics application at the moment." },
      { status: 500 },
    );
  }
}
