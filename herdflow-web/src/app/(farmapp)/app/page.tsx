// WEBSITE — herdflow-web/src/app/(farmapp)/app/page.tsx
// Landing hub for the web farm app -- the desktop equivalent of the mobile
// app's Home tab. No FarmShell sidebar chrome here (this page IS the picker
// between sections), just an auth check + a card per section.
import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import {
  ArrowLeftRight,
  Map,
  PawPrint,
  HeartPulse,
  LineChart,
  UserCircle,
  ArrowRight,
} from "lucide-react";
import { getFarmWebUser } from "@/lib/farm-web-auth";

export const dynamic = "force-dynamic";

const SECTIONS = [
  { href: "/app/finance", icon: ArrowLeftRight, titleKey: "finance_title", descKey: "finance_desc" },
  { href: "/app/camps", icon: Map, titleKey: "camps_title", descKey: "camps_desc" },
  { href: "/app/herd", icon: PawPrint, titleKey: "herd_title", descKey: "herd_desc" },
  { href: "/app/health", icon: HeartPulse, titleKey: "health_title", descKey: "health_desc" },
  { href: "/app/market", icon: LineChart, titleKey: "market_title", descKey: "market_desc" },
  { href: "/app/profile", icon: UserCircle, titleKey: "profile_title", descKey: "profile_desc" },
] as const;

export default async function FarmAppHubPage() {
  const t = await getTranslations("common");
  const user = await getFarmWebUser();

  if (!user) {
    redirect("/auth/login?redirect=/app");
  }

  return (
    <div className="min-h-screen bg-navy-25 px-4 py-10 sm:px-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <header>
          <h1 className="text-navy-600 text-3xl font-bold">
            {t("hub.title", { name: user.fullName ? `, ${user.fullName.split(" ")[0]}` : "" })}
          </h1>
          <p className="mt-1 text-sm text-navy-300">{t("hub.subtitle")}</p>
        </header>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SECTIONS.map(({ href, icon: Icon, titleKey, descKey }) => (
            <Link
              key={href}
              href={href}
              className="group flex flex-col gap-3 rounded-xl border border-navy-50 bg-white p-5 shadow-sm transition hover:border-navy-100 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <div className="rounded-lg bg-navy-25 p-2.5 text-navy-600">
                  <Icon size={20} />
                </div>
                <ArrowRight size={16} className="text-navy-300 transition group-hover:text-navy-600" />
              </div>
              <div>
                <p className="text-navy-600 text-base font-semibold">{t(`hub.${titleKey}`)}</p>
                <p className="mt-0.5 text-sm text-navy-300">{t(`hub.${descKey}`)}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
