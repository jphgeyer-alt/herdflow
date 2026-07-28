// WEBSITE — herdflow-web/src/app/(farmapp)/app/camps/layout.tsx
// CAMPS-MAP: first web/desktop UI for camps (previously mobile-only, web
// had only sync API routes) -- mirrors finance/layout.tsx's auth guard +
// FarmShell wrap, pointed at the camps nav/namespace instead.
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { getFarmWebUser } from "@/lib/farm-web-auth";
import { FarmShell } from "@/components/farm/FarmShell";
import { FARM_CAMPS_NAV } from "@/lib/farm-nav";

export const dynamic = "force-dynamic";

export default async function FarmCampsLayout({ children }: { children: ReactNode }) {
  const user = await getFarmWebUser();

  if (!user) {
    redirect("/auth/login?redirect=/app/camps");
  }

  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <FarmShell
        fullName={user.fullName}
        mobileRole={user.mobileRole}
        farmName={user.farmName}
        navItems={FARM_CAMPS_NAV}
        namespace="camps"
        homeHref="/app/camps"
        sectionLabelKey="camps_section_title"
      >
        {children}
      </FarmShell>
    </NextIntlClientProvider>
  );
}
