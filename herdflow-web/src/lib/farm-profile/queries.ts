// herdflow-web/src/lib/farm-profile/queries.ts
// Shared data-access for the farm-operation profile web section (farm
// profile, team, activity feed) — the desktop-page twin of
// src/app/api/app/{farm-profile,farm-code,farm-invites,farm-team,activity}/*
// (mobile, bearer-token auth). Deliberately separate from the marketplace
// User account settings at /account/settings (name/email/password) — see
// the plan's Profile section scope.
import { prisma } from "@/lib/prisma";
import { withAdminContext, withFarmerContext } from "@/lib/tenant-prisma";

export async function getFarmProfile(userId: string) {
  return prisma.farmerProfile.findUnique({ where: { userId } });
}

export async function updateFarmProfile(
  userId: string,
  input: { farmName: string; province: string; country: string; traceabilityGln: string | null },
) {
  return prisma.farmerProfile.update({
    where: { userId },
    data: {
      farmName: input.farmName,
      province: input.province,
      country: input.country,
      traceabilityGln: input.traceabilityGln,
    },
  });
}

export async function getFarmTeam(ownerUserId: string) {
  const staffProfiles = await prisma.farmerProfile.findMany({ where: { ownerUserId } });
  const staff = await Promise.all(
    staffProfiles.map(async (s) => {
      const u = await prisma.user.findUnique({
        where: { id: s.userId },
        select: { fullName: true, email: true, createdAt: true },
      });
      return {
        userId: s.userId,
        name: u?.fullName ?? "",
        email: u?.email ?? "",
        role: s.mobileRole,
        joinedAt: u?.createdAt ?? null,
      };
    }),
  );

  const invites = await prisma.farmInvite.findMany({
    where: { farmOwnerId: ownerUserId, status: "PENDING" },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return { staff, invites };
}

function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const part = (len: number) =>
    Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `${part(4)}-${part(4)}`;
}

export async function generateInvite(
  ownerUserId: string,
  ownerFullName: string,
  role: "FARM_MANAGER" | "FARM_WORKER",
) {
  const profile = await prisma.farmerProfile.findUnique({ where: { userId: ownerUserId } });
  if (!profile || !profile.farmCode) return null;

  let inviteCode = "";
  for (let i = 0; i < 10; i++) {
    const candidate = generateInviteCode();
    const exists = await prisma.farmInvite.findUnique({ where: { inviteCode: candidate } }).catch(() => null);
    if (!exists) {
      inviteCode = candidate;
      break;
    }
  }
  if (!inviteCode) return null;

  return prisma.farmInvite.create({
    data: {
      farmOwnerId: ownerUserId,
      farmName: profile.farmName,
      farmOwnerName: ownerFullName,
      inviteCode,
      role,
      status: "PENDING",
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });
}

export async function revokeInvite(ownerUserId: string, inviteCode: string) {
  const invite = await prisma.farmInvite.findUnique({ where: { inviteCode } }).catch(() => null);
  if (!invite || invite.farmOwnerId !== ownerUserId) return false;
  await prisma.farmInvite.update({ where: { inviteCode }, data: { status: "REVOKED" } });
  return true;
}

export async function removeTeamMember(ownerUserId: string, staffUserId: string) {
  const staffProfile = await prisma.farmerProfile.findUnique({ where: { userId: staffUserId } });
  if (!staffProfile || staffProfile.ownerUserId !== ownerUserId) return false;
  await prisma.farmerProfile.update({
    where: { userId: staffUserId },
    data: { ownerUserId: null, mobileRole: "FARMER" },
  });
  return true;
}

export async function listActivity(farmOwnerId: string) {
  const staffProfiles = await prisma.farmerProfile.findMany({
    where: { ownerUserId: farmOwnerId },
    select: { userId: true },
  });
  const userIds = [farmOwnerId, ...staffProfiles.map((s) => s.userId)];

  let logs;
  try {
    logs = await withAdminContext((tx) =>
      tx.farmerActivityLog.findMany({
        where: { userId: { in: userIds } },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
    );
  } catch {
    return [];
  }

  // ANIMAL_EDITED entries are logged with the raw animal id instead of a
  // name ("Updated animal cm..."), unlike every other activity type -- the
  // mobile write path is out of scope here, so resolve real names at read
  // time in one batched query instead of leaking ids to the UI.
  const editedIds = [
    ...new Set(logs.filter((l) => l.activityType === "ANIMAL_EDITED" && l.entityId).map((l) => l.entityId as string)),
  ];
  if (editedIds.length === 0) return logs;

  const animals = await withFarmerContext(farmOwnerId, (tx) =>
    tx.farmerAnimal.findMany({ where: { id: { in: editedIds } }, select: { id: true, name: true, tagNumber: true } }),
  );
  const nameById = new Map(animals.map((a) => [a.id, a.name || a.tagNumber]));

  return logs.map((log) => {
    if (log.activityType !== "ANIMAL_EDITED" || !log.entityId) return log;
    const name = nameById.get(log.entityId);
    return name ? { ...log, description: `Updated ${name}` } : log; // animal since deleted -- keep original text
  });
}
