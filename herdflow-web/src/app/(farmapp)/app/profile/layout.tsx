// WEBSITE — herdflow-web/src/app/(farmapp)/app/profile/layout.tsx
// Farm-operation profile section (farm profile, team, activity) --
// deliberately separate from /account/settings (marketplace user identity).
// Mirrors finance/layout.tsx's auth guard + FarmShell wrap.
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { getFarmWebUser } from "@/lib/farm-web-auth";
import { FarmShell } from "@/components/farm/FarmShell";

export const dynamic = "force-dynamic";

export default async function FarmProfileLayout({ children }: { children: ReactNode }) {
  const user = await getFarmWebUser();

  if (!user) {
    redirect("/auth/login?redirect=/app/profile");
  }

  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <FarmShell
        fullName={user.fullName}
        mobileRole={user.mobileRole}
        farmName={user.farmName}
        section="profile"
      >
        {children}
      </FarmShell>
    </NextIntlClientProvider>
  );
}
