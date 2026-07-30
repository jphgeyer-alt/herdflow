"use server";
// WEBSITE — herdflow-web/src/app/(farmapp)/app/profile/team/actions.ts
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getFarmWebUser } from "@/lib/farm-web-auth";
import { generateInvite, revokeInvite, removeTeamMember } from "@/lib/farm-profile/queries";

export interface TeamActionState {
  error?: string;
}

// Only the farm owner (effectiveFarmerId === own id — i.e. not a manager/
// worker resolving to someone else's farm) can manage the team, same
// restriction the mobile /api/app/farm-invites route enforces.
async function requireOwner() {
  const user = await getFarmWebUser();
  if (!user) redirect("/auth/login?redirect=/app/profile/team");
  if (user.id !== user.effectiveFarmerId) return null;
  return user;
}

export async function generateInviteCode(
  _prev: TeamActionState,
  formData: FormData,
): Promise<TeamActionState> {
  const t = await getTranslations("profile");
  const user = await requireOwner();
  if (!user) return { error: t("only_owner_can_manage_team") };

  const role = String(formData.get("role") ?? "");
  if (role !== "FARM_MANAGER" && role !== "FARM_WORKER") return { error: t("required_field") };

  const invite = await generateInvite(user.id, user.fullName, role);
  if (!invite) return { error: t("only_owner_can_manage_team") };

  revalidatePath("/app/profile/team");
  return {};
}

export async function revokeInviteCode(
  _prev: TeamActionState,
  formData: FormData,
): Promise<TeamActionState> {
  const t = await getTranslations("profile");
  const user = await requireOwner();
  if (!user) return { error: t("only_owner_can_manage_team") };

  const inviteCode = String(formData.get("inviteCode") ?? "");
  await revokeInvite(user.id, inviteCode);

  revalidatePath("/app/profile/team");
  return {};
}

export async function removeMember(_prev: TeamActionState, formData: FormData): Promise<TeamActionState> {
  const t = await getTranslations("profile");
  const user = await requireOwner();
  if (!user) return { error: t("only_owner_can_manage_team") };

  const staffUserId = String(formData.get("staffUserId") ?? "");
  await removeTeamMember(user.id, staffUserId);

  revalidatePath("/app/profile/team");
  return {};
}
