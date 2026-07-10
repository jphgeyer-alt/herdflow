import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getUserIdFromSession, USER_SESSION_COOKIE } from "@/lib/user-auth";

export async function getApprovedLogisticsPartner() {
  const jar = await cookies();
  const sessionValue = jar.get(USER_SESSION_COOKIE)?.value;
  const userId = await getUserIdFromSession(sessionValue);
  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { logisticsProfile: true },
  });

  if (!user?.logisticsProfile || user.logisticsProfile.status !== "APPROVED") return null;

  return user.logisticsProfile;
}
