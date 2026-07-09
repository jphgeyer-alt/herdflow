import { prisma } from "@/lib/prisma";
import { ContentEditor } from "./content-editor";

export const dynamic = "force-dynamic";

async function getContent() {
  try {
    const [configs, categories] = await Promise.all([
      prisma.siteConfig.findMany(),
      prisma.category.findMany({ orderBy: { name: "asc" } }),
    ]);
    const content = Object.fromEntries(configs.map((c) => [c.key, c.value]));
    return { content, categories };
  } catch {
    return { content: {}, categories: [] };
  }
}

export default async function AdminContentPage() {
  const { content, categories } = await getContent();

  return (
    <main className="space-y-4 pb-10">
      <header>
        <h1 className="text-brand-navy text-3xl font-semibold">Site Content Editor</h1>
        <p className="text-sm text-[#38537a]">
          Edit the homepage banner and rename categories without touching code. Changes take effect
          immediately.
        </p>
      </header>
      <ContentEditor initialContent={content} initialCategories={categories} />
    </main>
  );
}
