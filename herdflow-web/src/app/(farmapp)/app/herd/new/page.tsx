// WEBSITE — herdflow-web/src/app/(farmapp)/app/herd/new/page.tsx
import { getTranslations } from "next-intl/server";
import { AddAnimalForm } from "./AddAnimalForm";

export const dynamic = "force-dynamic";

export default async function NewAnimalPage() {
  const t = await getTranslations("herd");

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-10">
      <header>
        <h1 className="text-navy-600 text-2xl font-semibold">{t("add_animal")}</h1>
      </header>
      <AddAnimalForm />
    </div>
  );
}
