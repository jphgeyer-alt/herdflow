import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getUserIdFromSession, USER_SESSION_COOKIE } from "@/lib/user-auth";

export async function getApprovedSeller() {
  const jar = await cookies();
  const sessionValue = jar.get(USER_SESSION_COOKIE)?.value;
  const userId = await getUserIdFromSession(sessionValue);
  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { sellerProfile: true },
  });

  if (!user?.sellerProfile || user.sellerProfile.status !== "APPROVED") return null;

  return user.sellerProfile;
}
