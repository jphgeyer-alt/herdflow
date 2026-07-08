import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, createUserSessionValue, SESSION_COOKIE_OPTIONS, USER_SESSION_COOKIE } from "@/lib/user-auth";

/** Generate a unique 8-char alphanumeric farm code e.g. "HF-A3B9C2" */
function generateFarmCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous chars
  let code = "HF-";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const fullName = (b.fullName as string | undefined)?.trim();
  const email = (b.email as string | undefined)?.trim().toLowerCase();
  const phone = (b.phone as string | undefined)?.trim();
  const password = b.password as string | undefined;
  const accountType = b.accountType as string | undefined;
  // Mobile app sends role: "farmer" | "worker" | "manager"
  const mobileRole = (b.role as string | undefined)?.toLowerCase();
  const isMobileRegistration = !!mobileRole && !accountType;

  if (!fullName || fullName.length < 2)
    return NextResponse.json({ error: "Full name is required" }, { status: 400 });
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return NextResponse.json({ error: "Valid email address is required" }, { status: 400 });
  if (!password || password.length < 8)
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  if (!isMobileRegistration && !["buyer", "seller", "logistics"].includes(accountType || ""))
    return NextResponse.json({ error: "Please select an account type" }, { status: 400 });

  const passwordHash = await hashPassword(password);

  let user;
  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({
        error: "An account with this email already exists. Please sign in instead.",
        code: "EMAIL_EXISTS",
      }, { status: 409 });
    }

    if (isMobileRegistration) {
      const isWorker  = mobileRole === "worker";
      const isManager = mobileRole === "manager";
      const isFarmer  = !isWorker && !isManager;

      // Workers and managers must supply a farm code OR invite code to link to an owner
      if (!isFarmer) {
        const suppliedCode = (b.farmCode as string | undefined)?.trim().toUpperCase()
                          ?? (b.inviteCode as string | undefined)?.trim().toUpperCase();
        if (!suppliedCode) {
          return NextResponse.json({
            error: "A farm invite code is required. Ask your farm owner to generate one from their HerdFlow Profile screen.",
            code: "FARM_CODE_REQUIRED",
          }, { status: 400 });
        }

        const resolvedMobileRole = isManager ? "FARM_MANAGER" : "FARM_WORKER";
        let ownerProfile: { userId: string; farmName: string; province: string; species: string[] } | null = null;
        let inviteId: string | null = null;

        // Farm codes are always "HF-XXXXXX" (hyphen at index 2). Invite codes are
        // "XXXX-XXXX" (hyphen at index 4). Both are 9 chars with one hyphen, so the
        // hyphen's position — not just length — is what actually distinguishes them.
        if (!suppliedCode.startsWith("HF-") && suppliedCode.includes("-") && suppliedCode.length === 9) {
          const invite = await prisma.farmInvite.findUnique({ where: { inviteCode: suppliedCode } });
          if (!invite || invite.status !== "PENDING") {
            return NextResponse.json({ error: "Invite code not found or already used.", code: "FARM_CODE_INVALID" }, { status: 400 });
          }
          if (new Date(invite.expiresAt) < new Date()) {
            return NextResponse.json({ error: "This invite code has expired. Ask your farm owner for a new one.", code: "INVITE_EXPIRED" }, { status: 410 });
          }
          ownerProfile = await prisma.farmerProfile.findUnique({ where: { userId: invite.farmOwnerId } });
          inviteId = invite.id;
        } else {
          // Try HF-XXXXXX farm code format
          ownerProfile = await prisma.farmerProfile.findUnique({ where: { farmCode: suppliedCode } });
        }

        if (!ownerProfile) {
          return NextResponse.json({
            error: `Code "${suppliedCode}" not found. Please check with your farm owner and try again.`,
            code: "FARM_CODE_INVALID",
          }, { status: 400 });
        }

        const result = await prisma.$transaction(async (tx) => {
          const created = await tx.user.create({
            data: { email, fullName, phone: phone || null, passwordHash, role: "FARMER" },
          });
          const profile = await tx.farmerProfile.create({
            data: {
              userId:      created.id,
              farmName:    ownerProfile!.farmName,
              province:    ownerProfile!.province,
              species:     ownerProfile!.species,
              mobileRole:  resolvedMobileRole,
              ownerUserId: ownerProfile!.userId,
            },
          });
          return { created, profile };
        });
        user = result.created;

        // Mark invite as accepted if we used an invite code
        if (inviteId) {
          await prisma.farmInvite.update({
            where: { id: inviteId },
            data: { status: "ACCEPTED", acceptedBy: user.id, acceptedAt: new Date() },
          }).catch(() => {});
        }

        const sessionValue = createUserSessionValue(user.id);
        return NextResponse.json({
          token: sessionValue,
          user: {
            id:           user.id,
            name:         user.fullName,
            email:        user.email,
            phone:        user.phone ?? null,
            role:         resolvedMobileRole,
            isAdmin:      false,
            farmName:     ownerProfile!.farmName,
            province:     ownerProfile!.province,
            farmCode:     null,
            ownerUserId:  ownerProfile.userId,
            createdAt:    user.createdAt,
          },
        });
      }

      // Farmer registration — create farm and generate unique farm code
      const farmName = (b.farmName as string | undefined)?.trim() ?? "";
      const province = (b.province as string | undefined)?.trim() ?? "";
      const species  = Array.isArray(b.species) ? (b.species as string[]) : [];

      // Generate a unique farm code (retry up to 10 times on collision)
      let farmCode: string | null = null;
      for (let attempt = 0; attempt < 10; attempt++) {
        const candidate = generateFarmCode();
        const exists = await prisma.farmerProfile.findUnique({ where: { farmCode: candidate } });
        if (!exists) { farmCode = candidate; break; }
      }
      if (!farmCode) {
        return NextResponse.json({ error: "Could not generate farm code. Please try again." }, { status: 500 });
      }

      const result = await prisma.$transaction(async (tx) => {
        const created = await tx.user.create({
          data: { email, fullName, phone: phone || null, passwordHash, role: "FARMER" },
        });
        const profile = await tx.farmerProfile.create({
          data: { userId: created.id, farmName, province, species, farmCode, mobileRole: "FARMER" },
        });
        return { created, profile };
      });
      user = result.created;
      const sessionValue = createUserSessionValue(user.id);
      return NextResponse.json({
        token: sessionValue,
        user: {
          id:          user.id,
          name:        user.fullName,
          email:       user.email,
          phone:       user.phone ?? null,
          role:        "FARMER",
          isAdmin:     false,
          farmName,
          province,
          farmCode,
          ownerUserId: null,
          createdAt:   user.createdAt,
        },
      });
    }

    // ── Web registration (buyer / seller / logistics) ──────────────────────
    user = await prisma.user.create({
      data: { email, fullName, phone: phone || null, passwordHash, role: "CUSTOMER" },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("Unique") || msg.includes("already exists")) {
      return NextResponse.json({
        error: "An account with this email already exists. Please sign in instead.",
        code: "EMAIL_EXISTS",
      }, { status: 409 });
    }
    return NextResponse.json({ error: "Service temporarily unavailable. Please try again later." }, { status: 503 });
  }

  const sessionValue = createUserSessionValue(user.id);

  let redirect = "/dashboard/buyer";
  if (accountType === "seller") redirect = "/register/seller";
  if (accountType === "logistics") redirect = "/register/logistics";

  const res = NextResponse.json({ ok: true, redirect, token: sessionValue, user: { id: user.id, name: user.fullName, email: user.email } });
  res.cookies.set(USER_SESSION_COOKIE, sessionValue, SESSION_COOKIE_OPTIONS);
  return res;
}

