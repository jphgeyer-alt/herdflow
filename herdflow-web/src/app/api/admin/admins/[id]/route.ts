import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminFromRequest } from "@/lib/admin-auth";
import { logAdminActivity } from "@/lib/admin-activity";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (admin.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Only super admins can manage staff accounts." }, { status: 403 });
  }

  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as {
    role?: "SUPER_ADMIN" | "ADMIN";
    isActive?: boolean;
  };

  if (id === admin.id && body.isActive === false) {
    return NextResponse.json({ error: "You cannot deactivate your own account." }, { status: 400 });
  }

  const target = await prisma.adminUser.findUnique({ where: { id } });
  if (!target) return NextResponse.json({ error: "Admin not found" }, { status: 404 });

  const updated = await prisma.adminUser.update({
    where: { id },
    data: {
      ...(body.role && { role: body.role }),
      ...(typeof body.isActive === "boolean" && { isActive: body.isActive }),
    },
    select: { id: true, email: true, fullName: true, role: true, isActive: true },
  });

  logAdminActivity(admin, "admin.update", "AdminUser", {
    entityId: updated.id,
    entityLabel: updated.email,
    metadata: { role: updated.role, isActive: updated.isActive },
  });

  return NextResponse.json({ ok: true, admin: updated });
}
