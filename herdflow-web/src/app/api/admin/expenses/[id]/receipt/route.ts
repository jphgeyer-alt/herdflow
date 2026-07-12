import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { randomBytes } from "crypto";
import { getAdminFromRequest } from "@/lib/admin-auth";
import { logAdminActivity } from "@/lib/admin-activity";
import { withAdminContext } from "@/lib/tenant-prisma";
import { uploadObject, getObjectStream, isStorageConfigured } from "@/lib/storage/s3";

type Params = { params: Promise<{ id: string }> };

const MAX_SIZE = 10 * 1024 * 1024; // 10MB — receipts are small documents/photos, not the 25MB digital-product ceiling
const ALLOWED_TYPES = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]);

// Receipts are financial records, so unlike the public digitalPurchase
// download flow (token-gated, anyone with the link) this is admin-session
// gated only — there is no legitimate non-admin reader.
export async function POST(request: NextRequest, { params }: Params) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isStorageConfigured()) {
    return NextResponse.json(
      { error: "Object storage is not configured. Set S3_BUCKET, S3_ACCESS_KEY_ID, and S3_SECRET_ACCESS_KEY." },
      { status: 503 },
    );
  }

  const { id } = await params;
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "A file is required." }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "File must be smaller than 10MB." }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: "Receipts must be a PDF, JPEG, PNG, or WebP file." },
      { status: 400 },
    );
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.name.includes(".") ? file.name.slice(file.name.lastIndexOf(".")) : "";
    const key = `expense-receipts/${id}/${randomBytes(12).toString("hex")}${ext}`;
    await uploadObject(key, buffer, file.type);

    const expense = await withAdminContext((tx) =>
      tx.expense.update({ where: { id }, data: { receiptUrl: key } }),
    );

    logAdminActivity(admin, "expense.receipt_upload", "Expense", {
      entityId: expense.id,
      entityLabel: expense.description,
    });

    return NextResponse.json({ ok: true, expense });
  } catch (err) {
    console.error("Expense receipt upload error:", err);
    return NextResponse.json({ error: "Failed to upload receipt." }, { status: 500 });
  }
}

export async function GET(request: NextRequest, { params }: Params) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const expense = await withAdminContext((tx) =>
      tx.expense.findUnique({ where: { id }, select: { receiptUrl: true, description: true } }),
    );
    if (!expense?.receiptUrl) {
      return NextResponse.json({ error: "No receipt on file for this expense." }, { status: 404 });
    }

    const { stream, contentType } = await getObjectStream(expense.receiptUrl);
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk as Buffer);
    }
    const buffer = Buffer.concat(chunks);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType || "application/octet-stream",
        "Content-Disposition": `inline; filename="${expense.description}-receipt"`,
        "Content-Length": String(buffer.length),
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("Expense receipt download error:", err);
    return NextResponse.json({ error: "Failed to load receipt." }, { status: 500 });
  }
}
