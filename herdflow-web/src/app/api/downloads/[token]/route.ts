import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getObjectStream } from "@/lib/storage/s3";

type Params = { params: Promise<{ token: string }> };

// Purchased files are never public — this route is the ONLY way to fetch
// one, gated by a per-purchase token (not the S3 key, which the client
// never sees), expiry, and a max download count.
export async function GET(_request: Request, { params }: Params) {
  const { token } = await params;

  try {
    const purchase = await prisma.digitalPurchase.findUnique({
      where: { downloadToken: token },
      include: { product: true },
    });

    if (!purchase || purchase.status !== "COMPLETE") {
      return NextResponse.json({ error: "Invalid or unpaid download link." }, { status: 404 });
    }
    if (purchase.expiresAt < new Date()) {
      return NextResponse.json({ error: "This download link has expired." }, { status: 410 });
    }
    if (purchase.downloadCount >= purchase.maxDownloads) {
      return NextResponse.json({ error: "Download limit reached for this link." }, { status: 429 });
    }

    const { stream, contentType } = await getObjectStream(purchase.product.fileKey);

    await prisma.digitalPurchase.update({
      where: { id: purchase.id },
      data: { downloadCount: { increment: 1 } },
    });

    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk as Buffer);
    }
    const buffer = Buffer.concat(chunks);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType || purchase.product.fileType,
        "Content-Disposition": `attachment; filename="${purchase.product.fileName}"`,
        "Content-Length": String(buffer.length),
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("Download error:", err);
    return NextResponse.json({ error: "Failed to process download." }, { status: 500 });
  }
}
