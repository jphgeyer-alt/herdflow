// WEBSITE — herdflow-web/src/app/(farmapp)/app/herd/[id]/weights/new/page.tsx
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getFarmWebUser } from "@/lib/farm-web-auth";
import { getAnimalDetail } from "@/lib/farm-herd/queries";
import { AddWeightForm } from "./AddWeightForm";

export const dynamic = "force-dynamic";

export default async function NewWeightPage({ params }: { params: Promise<{ id: string }> }) {
  const t = await getTranslations("herd");
  const user = await getFarmWebUser();
  if (!user) return null;

  const { id } = await params;
  const detail = await getAnimalDetail(user.effectiveFarmerId, id);
  if (!detail) notFound();

  return (
    <div className="mx-auto max-w-lg space-y-6 pb-10">
      <header>
        <h1 className="text-navy-600 text-2xl font-semibold">{t("add_weight")}</h1>
        <p className="text-sm text-navy-300">{detail.animal.name || detail.animal.tagNumber}</p>
      </header>
      <AddWeightForm animalId={detail.animal.id} />
    </div>
  );
}
