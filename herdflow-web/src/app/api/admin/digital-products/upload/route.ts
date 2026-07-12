import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { randomBytes } from "crypto";
import { getAdminFromRequest } from "@/lib/admin-auth";
import { uploadObject, isStorageConfigured } from "@/lib/storage/s3";

const MAX_SIZE = 25 * 1024 * 1024; // 25MB

export async function POST(request: NextRequest) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isStorageConfigured()) {
    return NextResponse.json(
      { error: "Object storage is not configured. Set S3_BUCKET, S3_ACCESS_KEY_ID, and S3_SECRET_ACCESS_KEY." },
      { status: 503 },
    );
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "A file is required." }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "File must be smaller than 25MB." }, { status: 400 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.name.includes(".") ? file.name.slice(file.name.lastIndexOf(".")) : "";
    const key = `digital-products/${randomBytes(12).toString("hex")}${ext}`;
    await uploadObject(key, buffer, file.type || "application/octet-stream");

    return NextResponse.json({ ok: true, key, fileName: file.name, fileType: file.type || "application/octet-stream" });
  } catch (err) {
    console.error("Digital product upload error:", err);
    return NextResponse.json({ error: "Failed to upload file." }, { status: 500 });
  }
}
