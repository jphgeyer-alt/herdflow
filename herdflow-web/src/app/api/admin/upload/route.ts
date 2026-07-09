import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { ADMIN_SESSION_COOKIE, isValidAdminSession } from "@/lib/admin-auth";

const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export async function POST(request: NextRequest) {
  const session = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  if (!isValidAdminSession(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  if (!file || typeof file.name !== "string") {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Only JPEG, PNG, and WebP images are allowed" },
      { status: 400 },
    );
  }

  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: "File must be smaller than 10 MB" }, { status: 400 });
  }

  const ext = file.type === "image/png" ? ".png" : file.type === "image/webp" ? ".webp" : ".jpg";
  const uniqueName = `${randomBytes(12).toString("hex")}${ext}`;
  const uploadsDir = path.join(process.cwd(), "public", "uploads", "admin");

  await mkdir(uploadsDir, { recursive: true });
  const diskPath = path.join(uploadsDir, uniqueName);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(diskPath, buffer);

  return NextResponse.json({ ok: true, url: `/uploads/admin/${uniqueName}` });
}
