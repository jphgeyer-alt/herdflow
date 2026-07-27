// WEBSITE — herdflow-web/src/app/(farmapp)/app/finance/layout.tsx
// Protected, authenticated farmer finance section -- deliberately outside
// the (store) route group so it inherits none of the public marketing
// site's header/nav/footer chrome (same reasoning as the (admin) section).
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { getFarmWebUser } from "@/lib/farm-web-auth";
import { FarmShell } from "@/components/farm/FarmShell";

export const dynamic = "force-dynamic";

export default async function FarmFinanceLayout({ children }: { children: ReactNode }) {
  const user = await getFarmWebUser();

  if (!user) {
    redirect("/auth/login?redirect=/app/finance");
  }

  // Scoped to the finance section only -- deliberately not added to the
  // root layout, which is shared by the public marketing site.
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <FarmShell fullName={user.fullName} mobileRole={user.mobileRole} farmName={user.farmName}>
        {children}
      </FarmShell>
    </NextIntlClientProvider>
  );
}
