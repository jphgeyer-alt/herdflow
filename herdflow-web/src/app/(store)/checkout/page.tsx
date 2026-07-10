import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getUserIdFromSession, USER_SESSION_COOKIE } from "@/lib/user-auth";
import { CheckoutClient } from "./checkout-client";

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const jar = await cookies();
  const sessionValue = jar.get(USER_SESSION_COOKIE)?.value;
  const userId = await getUserIdFromSession(sessionValue);

  if (!userId) {
    redirect("/auth/login?redirect=/checkout");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { fullName: true, email: true, phone: true },
  });

  if (!user) {
    redirect("/auth/login?redirect=/checkout");
  }

  return (
    <CheckoutClient
      initialUser={{
        fullName: user.fullName,
        email: user.email,
        phone: user.phone ?? "",
      }}
    />
  );
}
