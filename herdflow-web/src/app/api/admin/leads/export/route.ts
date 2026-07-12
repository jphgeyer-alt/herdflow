import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAdminFromRequest } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const leads = await prisma.lead.findMany({
      include: { category: { select: { displayName: true } } },
      orderBy: { createdAt: "desc" },
    });

    const rows = ["Date,Category,Name,Phone,Email,Province,Status,Amount,Commission Earned"];
    for (const l of leads) {
      rows.push(
        [
          l.createdAt.toISOString().slice(0, 10),
          l.category.displayName,
          l.name,
          l.phone,
          l.email || "",
          l.province,
          l.status,
          l.amountSought ? Number(l.amountSought).toFixed(2) : l.livestockValue ? Number(l.livestockValue).toFixed(2) : "",
          l.commissionEarned ? Number(l.commissionEarned).toFixed(2) : "",
        ]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(","),
      );
    }

    return new NextResponse(rows.join("\n"), {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="leads-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (err) {
    console.error("Leads export error:", err);
    return NextResponse.json({ error: "Failed to export leads." }, { status: 500 });
  }
}
