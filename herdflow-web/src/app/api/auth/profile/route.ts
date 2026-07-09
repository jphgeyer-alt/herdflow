// WEBSITE — /api/auth/profile/route.ts
// Get or update the authenticated user's profile
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMobileUser, isMobileUser } from "@/lib/mobile-auth";

export async function GET(request: Request) {
  const auth = await requireMobileUser(request);
  if (!isMobileUser(auth)) return auth;

  const user = await prisma.user.findUnique({
    where: { id: auth.id },
    select: { id: true, fullName: true, email: true, phone: true, createdAt: true },
  });
  const profile = await prisma.farmerProfile.findUnique({ where: { userId: auth.id } });

  return NextResponse.json({
    id: auth.id,
    name: user?.fullName ?? "",
    email: user?.email ?? "",
    phone: user?.phone ?? null,
    role: profile?.mobileRole ?? "FARMER",
    farmName: profile?.farmName ?? "",
    province: profile?.province ?? "",
    species: profile?.species ?? [],
    farmCode: profile?.farmCode ?? null,
    ownerUserId: profile?.ownerUserId ?? null,
    createdAt: user?.createdAt,
  });
}

export async function PATCH(request: Request) {
  const auth = await requireMobileUser(request);
  if (!isMobileUser(auth)) return auth;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const b = body as Record<string, unknown>;

  // Update User table fields
  const userUpdate: Record<string, unknown> = {};
  if (b.name) userUpdate.fullName = String(b.name).trim();
  if (b.phone !== undefined) userUpdate.phone = b.phone ? String(b.phone).trim() : null;

  if (Object.keys(userUpdate).length > 0) {
    await prisma.user.update({ where: { id: auth.id }, data: userUpdate });
  }

  // Update FarmerProfile fields
  const profileUpdate: Record<string, unknown> = {};
  if (b.farmName !== undefined) profileUpdate.farmName = String(b.farmName ?? "").trim();
  if (b.province !== undefined) profileUpdate.province = String(b.province ?? "").trim();
  if (b.species !== undefined) profileUpdate.species = Array.isArray(b.species) ? b.species : [];

  if (Object.keys(profileUpdate).length > 0) {
    await prisma.farmerProfile.upsert({
      where: { userId: auth.id },
      update: profileUpdate,
      create: { userId: auth.id, ...profileUpdate, mobileRole: "FARMER" },
    });
  }

  // Return updated profile
  const user = await prisma.user.findUnique({
    where: { id: auth.id },
    select: { fullName: true, email: true, phone: true },
  });
  const profile = await prisma.farmerProfile.findUnique({ where: { userId: auth.id } });

  return NextResponse.json({
    id: auth.id,
    name: user?.fullName ?? "",
    email: user?.email ?? "",
    phone: user?.phone ?? null,
    role: profile?.mobileRole ?? "FARMER",
    farmName: profile?.farmName ?? "",
    province: profile?.province ?? "",
    species: profile?.species ?? [],
    farmCode: profile?.farmCode ?? null,
  });
}
