// WEBSITE — herdflow-web/src/app/(farmapp)/app/page.tsx
// Real farm command-centre dashboard (Priority 4) -- replaces the static
// 6-card link grid. Every KPI/list here is read directly from the same
// domain query modules the rest of /app uses (farm-herd, farm-finance,
// farm-health, farm-profile), plus a new lightweight farm-camps summary
// written specifically to avoid the per-camp transaction fan-out that
// makes the Camps page itself prone to DB pool exhaustion (see
// src/lib/farm-camps/queries.ts).
import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import {
  PawPrint,
  Wallet,
  Syringe,
  Leaf,
  PlusCircle,
  Weight,
  ArrowLeftRight,
  Camera,
  ArrowRight,
  Activity,
  Heart,
} from "lucide-react";
import { getFarmWebUser } from "@/lib/farm-web-auth";
import { getHerdSummary, getUpcomingBreedings } from "@/lib/farm-herd/queries";
import { getFinanceTotals } from "@/lib/farm-finance/queries";
import { periodRange, previousPeriodRange, trendLabel } from "@/lib/farm-finance/periods";
import { listVaccinationsBucketed } from "@/lib/farm-health/queries";
import { getCampHealthSummary } from "@/lib/farm-camps/queries";
import { listActivity } from "@/lib/farm-profile/queries";
import { formatCurrency, formatDate, formatRelativeTime } from "@/lib/farm-finance/format";
import { Card, CardHeader, StatCard } from "@/components/farm/Card";
import { EmptyState } from "@/components/farm/EmptyState";

export const dynamic = "force-dynamic";

export default async function FarmAppHubPage() {
  const t = await getTranslations("hub");
  const user = await getFarmWebUser();
  if (!user) redirect("/auth/login?redirect=/app");

  const thisMonth = periodRange("this_month");
  const lastMonth = previousPeriodRange("this_month");

  // Sequential, deliberately not Promise.all -- each of these opens its own
  // withFarmerContext transaction, and the DB connection pool is only 3
  // wide (see DATABASE_URL's connection_limit=3). Firing all seven at once
  // reproduces the exact "Unable to start a transaction in the given time"
  // pool exhaustion the Camps page already suffers from, except here it
  // would hit on every single login instead of one map view. A little
  // extra latency on a dashboard load is a much better trade than that.
  const herdSummary = await getHerdSummary(user.effectiveFarmerId);
  const thisMonthTotals = await getFinanceTotals(user.effectiveFarmerId, thisMonth);
  const lastMonthTotals = await getFinanceTotals(user.effectiveFarmerId, lastMonth);
  const vaccBuckets = await listVaccinationsBucketed(user.effectiveFarmerId);
  const campHealth = await getCampHealthSummary(user.effectiveFarmerId);
  const activityLogs = await listActivity(user.effectiveFarmerId);
  const upcomingBreedings = await getUpcomingBreedings(user.effectiveFarmerId, 3);

  const incomeTrend = trendLabel(thisMonthTotals.income, lastMonthTotals.income);
  const vaccDueCount = vaccBuckets.thisWeek.length;
  const vaccOverdueCount = vaccBuckets.overdue.length;
  const recentActivity = activityLogs.slice(0, 5);
  const upcomingVaccinations = vaccBuckets.thisWeek.slice(0, 3);

  return (
    <div className="space-y-6 pb-10">
      <header>
        <h1 className="text-navy-600 text-2xl font-semibold">
          {t("title", { name: user.fullName ? `, ${user.fullName.split(" ")[0]}` : "" })}
        </h1>
        <p className="text-sm text-navy-300">{t("subtitle")}</p>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={t("active_animals")}
          value={herdSummary.activeCount}
          icon={<PawPrint size={18} />}
          hint={herdSummary.sickCount > 0 ? t("sick_count", { count: herdSummary.sickCount }) : t("no_sick_animals")}
          tone={herdSummary.sickCount > 0 ? "danger" : "navy"}
        />
        <StatCard
          label={t("month_income")}
          value={formatCurrency(thisMonthTotals.income)}
          icon={<Wallet size={18} />}
          tone="success"
          trend={incomeTrend}
        />
        <StatCard
          label={t("vaccinations_due")}
          value={vaccDueCount}
          icon={<Syringe size={18} />}
          hint={vaccOverdueCount > 0 ? t("overdue_count", { count: vaccOverdueCount }) : t("due_next_7_days")}
          tone={vaccOverdueCount > 0 ? "danger" : vaccDueCount > 0 ? "warning" : "success"}
        />
        <StatCard
          label={t("camp_health")}
          value={campHealth.avgScore != null ? `${campHealth.avgScore.toFixed(1)}/10` : t("no_data_yet")}
          icon={<Leaf size={18} />}
          hint={campHealth.campCount > 0 ? t("avg_ndvi_score") : t("no_camps_yet")}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title={t("recent_activity")}
            action={
              <Link
                href="/app/profile/activity"
                className="flex items-center gap-1 text-sm font-semibold text-navy-600 hover:underline"
              >
                {t("view_all")} <ArrowRight size={14} />
              </Link>
            }
          />
          {recentActivity.length === 0 ? (
            <EmptyState
              icon={<Activity size={20} />}
              title={t("no_recent_activity")}
              message={t("no_recent_activity_message")}
            />
          ) : (
            <div className="divide-y divide-navy-50">
              {recentActivity.map((log) => (
                <div key={log.id} className="flex items-center justify-between gap-4 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-navy-600">{log.description}</p>
                    <p className="truncate text-xs text-navy-300">{log.userName}</p>
                  </div>
                  <p className="shrink-0 text-xs text-navy-300">{formatRelativeTime(log.createdAt)}</p>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <CardHeader title={t("quick_actions")} />
          <div className="grid grid-cols-2 gap-3 p-4">
            <QuickAction href="/app/herd/new" icon={<PlusCircle size={20} />} label={t("add_animal")} />
            <QuickAction href="/app/herd" icon={<Weight size={20} />} label={t("record_weight")} />
            <QuickAction
              href="/app/finance/transactions/new"
              icon={<ArrowLeftRight size={20} />}
              label={t("add_transaction")}
            />
            <QuickAction icon={<Camera size={20} />} label={t("scan_receipt")} disabledHint={t("scan_receipt_hint")} />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            title={t("vaccinations_this_week")}
            action={
              <Link
                href="/app/health/vaccinations"
                className="flex items-center gap-1 text-sm font-semibold text-navy-600 hover:underline"
              >
                {t("view_all")} <ArrowRight size={14} />
              </Link>
            }
          />
          {upcomingVaccinations.length === 0 ? (
            <EmptyState
              icon={<Syringe size={20} />}
              title={t("no_vaccinations_this_week")}
              message={t("no_vaccinations_this_week_message")}
            />
          ) : (
            <div className="divide-y divide-navy-50">
              {upcomingVaccinations.map((v) => (
                <div key={v.id} className="flex items-center justify-between gap-4 px-4 py-3">
                  <p className="truncate text-sm font-medium text-navy-600">{v.animalName}</p>
                  <p className="shrink-0 text-xs text-navy-300">
                    {t("due_label", { date: v.nextDueDate ? formatDate(v.nextDueDate) : "—" })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <CardHeader
            title={t("breeding_dates_upcoming")}
            action={
              <Link
                href="/app/herd"
                className="flex items-center gap-1 text-sm font-semibold text-navy-600 hover:underline"
              >
                {t("view_all")} <ArrowRight size={14} />
              </Link>
            }
          />
          {upcomingBreedings.length === 0 ? (
            <EmptyState
              icon={<Heart size={20} />}
              title={t("no_breeding_dates_upcoming")}
              message={t("no_breeding_dates_upcoming_message")}
            />
          ) : (
            <div className="divide-y divide-navy-50">
              {upcomingBreedings.map((b) => (
                <div key={b.id} className="flex items-center justify-between gap-4 px-4 py-3">
                  <p className="truncate text-sm font-medium text-navy-600">{b.femaleAnimalTag}</p>
                  <p className="shrink-0 text-xs text-navy-300">
                    {t("due_label", { date: formatDate(b.expectedDueDate) })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function QuickAction({
  href,
  icon,
  label,
  disabledHint,
}: {
  href?: string;
  icon: ReactNode;
  label: string;
  disabledHint?: string;
}) {
  const content = (
    <>
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy-25 text-navy-600">{icon}</div>
      <p className="text-sm font-semibold text-navy-600">{label}</p>
      {disabledHint && <p className="text-xs text-navy-300">{disabledHint}</p>}
    </>
  );

  if (!href) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-lg border border-navy-50 bg-navy-25/40 p-4 text-center opacity-60">
        {content}
      </div>
    );
  }

  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-2 rounded-lg border border-navy-100 bg-white p-4 text-center transition hover:border-navy-200 hover:shadow-sm"
    >
      {content}
    </Link>
  );
}
