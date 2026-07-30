// WEBSITE — herdflow-web/src/app/(farmapp)/app/profile/activity/page.tsx
import { getTranslations } from "next-intl/server";
import { getFarmWebUser } from "@/lib/farm-web-auth";
import { listActivity } from "@/lib/farm-profile/queries";
import { formatDateTime } from "@/lib/farm-finance/format";
import { Card, CardHeader } from "@/components/farm/Card";

export const dynamic = "force-dynamic";

export default async function ActivityFeedPage() {
  const t = await getTranslations("profile");
  const user = await getFarmWebUser();
  if (!user) return null;

  const logs = await listActivity(user.effectiveFarmerId);

  return (
    <div className="space-y-6 pb-10">
      <header>
        <h1 className="text-navy-600 text-2xl font-semibold">{t("activity_title")}</h1>
        <p className="text-sm text-navy-300">{t("activity_subtitle")}</p>
      </header>

      <Card>
        <CardHeader title={t("activity_title")} />
        {logs.length === 0 ? (
          <p className="p-6 text-center text-sm text-navy-300">{t("no_activity_yet")}</p>
        ) : (
          <div className="divide-y divide-navy-50">
            {logs.map((log) => (
              <div key={log.id} className="flex items-center justify-between gap-4 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-navy-600">{log.description}</p>
                  <p className="truncate text-xs text-navy-300">{log.userName}</p>
                </div>
                <p className="shrink-0 text-xs text-navy-300">{formatDateTime(log.createdAt)}</p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
