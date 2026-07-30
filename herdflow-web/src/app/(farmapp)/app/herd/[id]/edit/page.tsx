// WEBSITE — herdflow-web/src/app/(farmapp)/app/herd/[id]/edit/page.tsx
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getFarmWebUser } from "@/lib/farm-web-auth";
import { getAnimalDetail } from "@/lib/farm-herd/queries";
import { EditAnimalForm } from "./EditAnimalForm";

export const dynamic = "force-dynamic";

export default async function EditAnimalPage({ params }: { params: Promise<{ id: string }> }) {
  const t = await getTranslations("herd");
  const user = await getFarmWebUser();
  if (!user) return null;

  const { id } = await params;
  const detail = await getAnimalDetail(user.effectiveFarmerId, id);
  if (!detail) notFound();

  const { animal } = detail;

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-10">
      <header>
        <h1 className="text-navy-600 text-2xl font-semibold">{t("edit_animal")}</h1>
      </header>
      <EditAnimalForm
        animal={{
          id: animal.id,
          name: animal.name,
          species: animal.species,
          breed: animal.breed,
          gender: animal.gender,
          tagNumber: animal.tagNumber,
          dateOfBirth: animal.dateOfBirth ? animal.dateOfBirth.toISOString().slice(0, 10) : null,
          weight: animal.weight != null ? Number(animal.weight) : null,
          colour: animal.colour,
          camp: animal.camp,
          notes: animal.notes,
        }}
      />
    </div>
  );
}
