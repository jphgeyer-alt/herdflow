import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAdminFromRequest } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

function csvField(value: string) {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function GET(request: NextRequest) {
  const admin = await getAdminFromRequest(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const consentOnly = request.nextUrl.searchParams.get("consentOnly") === "true";

  const users = await prisma.user.findMany({
    where: consentOnly ? { marketingConsent: true } : undefined,
    orderBy: { createdAt: "desc" },
    select: {
      fullName: true,
      email: true,
      phone: true,
      role: true,
      marketingConsent: true,
      createdAt: true,
    },
  });

  const header = ["Full Name", "Email", "Phone", "Role", "Marketing Consent", "Joined"];
  const rows = users.map((u) =>
    [
      csvField(u.fullName),
      csvField(u.email),
      csvField(u.phone ?? ""),
      u.role,
      u.marketingConsent ? "Yes" : "No",
      u.createdAt.toISOString(),
    ].join(","),
  );
  const csv = [header.join(","), ...rows].join("\n");

  const filename = consentOnly ? "herdflow-marketing-list.csv" : "herdflow-customers.csv";

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
