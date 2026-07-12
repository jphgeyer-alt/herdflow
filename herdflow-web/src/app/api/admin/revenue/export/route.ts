import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAdminFromRequest } from "@/lib/admin-auth";
import { withAdminContext } from "@/lib/tenant-prisma";
import { getVatConfig, calculateVatCents } from "@/lib/marketplace/commission";
import { centsToRand } from "@/lib/money";

export async function GET(request: NextRequest) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const [payments, vatConfig] = await Promise.all([
      withAdminContext((tx) =>
        tx.payment.findMany({
          where: { status: "COMPLETE" },
          orderBy: { paidAt: "desc" },
          include: { user: { select: { email: true } } },
        }),
      ),
      getVatConfig(),
    ]);

    const rows = [
      vatConfig.enabled
        ? "Date,Type,Reference,Email,Amount (R),VAT Collected (R)"
        : "Date,Type,Reference,Email,Amount (R)",
    ];
    for (const p of payments) {
      const fields = [
        p.paidAt ? p.paidAt.toISOString().slice(0, 10) : "",
        p.paymentType,
        p.reference,
        p.user?.email || "",
        Number(p.amount).toFixed(2),
      ];
      if (vatConfig.enabled) {
        const vatCents = calculateVatCents(Number(p.amount), p.vatRateBps, p.vatInclusive);
        fields.push(centsToRand(vatCents).toFixed(2));
      }
      rows.push(fields.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","));
    }

    return new NextResponse(rows.join("\n"), {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="revenue-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (err) {
    console.error("Revenue export error:", err);
    return NextResponse.json({ error: "Failed to export revenue." }, { status: 500 });
  }
}
