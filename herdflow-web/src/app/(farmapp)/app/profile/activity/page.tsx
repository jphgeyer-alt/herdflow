// WEBSITE — herdflow-web/src/app/(farmapp)/app/profile/activity/page.tsx
import { getTranslations } from "next-intl/server";
import { getFarmWebUser } from "@/lib/farm-web-auth";
import { listActivity } from "@/lib/farm-profile/queries";
import { Card, CardHeader } from "@/components/farm/Card";
import { ActivityFeedList, type ActivityLogRow } from "./ActivityFeedList";

export const dynamic = "force-dynamic";

export default async function ActivityFeedPage() {
  const t = await getTranslations("profile");
  const user = await getFarmWebUser();
  if (!user) return null;

  const logs = await listActivity(user.effectiveFarmerId);
  const rows: ActivityLogRow[] = logs.map((log) => ({
    id: log.id,
    description: log.description,
    userName: log.userName,
    createdAt: log.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6 pb-10">
      <header>
        <h1 className="text-navy-600 text-2xl font-semibold">{t("activity_title")}</h1>
        <p className="text-sm text-navy-300">{t("activity_subtitle")}</p>
      </header>

      <Card>
        <CardHeader title={t("activity_title")} />
        {rows.length === 0 ? (
          <p className="p-6 text-center text-sm text-navy-300">{t("no_activity_yet")}</p>
        ) : (
          <ActivityFeedList logs={rows} />
        )}
      </Card>
    </div>
  );
}
