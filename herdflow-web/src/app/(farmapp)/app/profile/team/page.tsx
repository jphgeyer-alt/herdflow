// WEBSITE — herdflow-web/src/app/(farmapp)/app/profile/team/page.tsx
import { getTranslations } from "next-intl/server";
import { getFarmWebUser } from "@/lib/farm-web-auth";
import { getFarmTeam } from "@/lib/farm-profile/queries";
import { TeamManager } from "./TeamManager";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const t = await getTranslations("profile");
  const user = await getFarmWebUser();
  if (!user) return null;

  const isOwner = user.id === user.effectiveFarmerId;
  const { staff, invites } = await getFarmTeam(user.effectiveFarmerId);

  return (
    <div className="space-y-6 pb-10">
      <header>
        <h1 className="text-navy-600 text-2xl font-semibold">{t("team_title")}</h1>
        <p className="text-sm text-navy-300">{t("team_subtitle")}</p>
      </header>
      <TeamManager
        isOwner={isOwner}
        staff={staff.map((s) => ({
          userId: s.userId,
          name: s.name,
          email: s.email,
          role: s.role,
          joinedAt: s.joinedAt ? new Date(s.joinedAt).toISOString() : null,
        }))}
        invites={invites.map((i) => ({
          inviteCode: i.inviteCode,
          role: i.role,
          expiresAt: i.expiresAt.toISOString(),
        }))}
      />
    </div>
  );
}
