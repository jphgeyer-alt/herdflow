"use client";

import { useState } from "react";

type Category = { id: string; name: string; slug: string; kind: string };

type ContentEditorProps = {
  initialContent: Record<string, string>;
  initialCategories: Category[];
};

const BANNER_FIELDS = [
  {
    key: "banner_heading",
    label: "Banner Heading",
    placeholder: "e.g. Buy & Sell Livestock Online",
  },
  {
    key: "banner_subheading",
    label: "Banner Subheading",
    placeholder: "e.g. South Africa's trusted farm trade platform",
  },
  { key: "banner_image_url", label: "Banner Image URL", placeholder: "https://..." },
  { key: "banner_cta_label", label: "CTA Button Label", placeholder: "e.g. Browse Listings" },
  { key: "banner_cta_url", label: "CTA Button URL", placeholder: "/listings" },
] as const;

export function ContentEditor({ initialContent, initialCategories }: ContentEditorProps) {
  const [banner, setBanner] = useState<Record<string, string>>({
    banner_heading: initialContent.banner_heading ?? "",
    banner_subheading: initialContent.banner_subheading ?? "",
    banner_image_url: initialContent.banner_image_url ?? "",
    banner_cta_label: initialContent.banner_cta_label ?? "",
    banner_cta_url: initialContent.banner_cta_url ?? "",
  });
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [editingCategory, setEditingCategory] = useState<{ id: string; name: string } | null>(null);

  const [bannerSaving, setBannerSaving] = useState(false);
  const [bannerSuccess, setBannerSuccess] = useState(false);
  const [bannerError, setBannerError] = useState<string | null>(null);

  const [catSaving, setCatSaving] = useState(false);
  const [catError, setCatError] = useState<string | null>(null);

  async function saveBanner() {
    setBannerSaving(true);
    setBannerError(null);
    setBannerSuccess(false);
    const res = await fetch("/api/admin/content", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "banner", updates: banner }),
    });
    setBannerSaving(false);
    if (!res.ok) {
      const p = await res.json().catch(() => ({}));
      setBannerError(typeof p.error === "string" ? p.error : "Failed to save.");
      return;
    }
    setBannerSuccess(true);
    setTimeout(() => setBannerSuccess(false), 3000);
  }

  async function saveCategory() {
    if (!editingCategory) return;
    setCatSaving(true);
    setCatError(null);
    const res = await fetch("/api/admin/content", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "category",
        id: editingCategory.id,
        name: editingCategory.name,
      }),
    });
    setCatSaving(false);
    if (!res.ok) {
      const p = await res.json().catch(() => ({}));
      setCatError(typeof p.error === "string" ? p.error : "Failed to save.");
      return;
    }
    setCategories((prev) =>
      prev.map((c) => (c.id === editingCategory.id ? { ...c, name: editingCategory.name } : c)),
    );
    setEditingCategory(null);
  }

  return (
    <div className="space-y-10">
      {/* Banner Editor */}
      <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-6 py-4">
          <h2 className="text-base font-semibold text-gray-700">Homepage Banner</h2>
          <p className="mt-0.5 text-xs text-gray-500">
            Changes here update the public storefront banner without touching code.
          </p>
        </div>
        <div className="space-y-4 px-6 py-5">
          {BANNER_FIELDS.map((field) => (
            <div key={field.key}>
              <label className="mb-1 block text-xs font-medium text-gray-600">{field.label}</label>
              <input
                type="text"
                value={banner[field.key] ?? ""}
                placeholder={field.placeholder}
                onChange={(e) => setBanner((prev) => ({ ...prev, [field.key]: e.target.value }))}
                className="focus:ring-brand-navy/40 w-full rounded border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2"
              />
            </div>
          ))}

          {/* Preview */}
          {(banner.banner_image_url || banner.banner_heading) && (
            <div
              className="relative flex min-h-[120px] items-center overflow-hidden rounded-lg"
              style={{
                backgroundImage: banner.banner_image_url
                  ? `url(${banner.banner_image_url})`
                  : undefined,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundColor: banner.banner_image_url ? undefined : "#1B3A6B",
              }}
            >
              <div className="absolute inset-0 bg-black/40" />
              <div className="relative px-6 py-6 text-white">
                {banner.banner_heading && (
                  <h3 className="text-xl font-bold">{banner.banner_heading}</h3>
                )}
                {banner.banner_subheading && (
                  <p className="mt-1 text-sm opacity-90">{banner.banner_subheading}</p>
                )}
                {banner.banner_cta_label && (
                  <span className="mt-3 inline-block rounded border border-white/40 bg-white/20 px-4 py-1.5 text-sm font-medium">
                    {banner.banner_cta_label}
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={saveBanner}
              disabled={bannerSaving}
              className="bg-brand-navy hover:bg-brand-navy/90 rounded px-4 py-2 text-sm font-medium text-white transition disabled:opacity-50"
            >
              {bannerSaving ? "Saving…" : "Save Banner"}
            </button>
            {bannerSuccess && <span className="text-sm font-medium text-green-600">Saved!</span>}
            {bannerError && <span className="text-sm text-red-600">{bannerError}</span>}
          </div>
        </div>
      </section>

      {/* Category Editor */}
      <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-6 py-4">
          <h2 className="text-base font-semibold text-gray-700">Category Names</h2>
          <p className="mt-0.5 text-xs text-gray-500">
            Rename categories shown in the listings filter and product pages.
          </p>
        </div>
        <div className="divide-y divide-gray-100">
          {catError && (
            <p className="border-b border-red-100 bg-red-50 px-6 py-3 text-sm text-red-600">
              {catError}
            </p>
          )}
          {categories.map((cat) => (
            <div key={cat.id} className="flex items-center gap-3 px-6 py-3">
              <span className="w-16 text-xs uppercase tracking-wide text-gray-400">{cat.kind}</span>
              {editingCategory?.id === cat.id ? (
                <>
                  <input
                    type="text"
                    value={editingCategory.name}
                    onChange={(e) =>
                      setEditingCategory({ ...editingCategory, name: e.target.value })
                    }
                    className="border-brand-navy/40 focus:ring-brand-navy/40 flex-1 rounded border px-2 py-1 text-sm focus:outline-none focus:ring-2"
                    autoFocus
                  />
                  <button
                    onClick={saveCategory}
                    disabled={catSaving}
                    className="bg-brand-navy hover:bg-brand-navy/90 rounded px-3 py-1 text-xs text-white disabled:opacity-50"
                  >
                    {catSaving ? "Saving…" : "Save"}
                  </button>
                  <button
                    onClick={() => setEditingCategory(null)}
                    className="rounded border border-gray-300 px-3 py-1 text-xs text-gray-600 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-sm text-gray-800">{cat.name}</span>
                  <span className="font-mono text-xs text-gray-400">{cat.slug}</span>
                  <button
                    onClick={() => setEditingCategory({ id: cat.id, name: cat.name })}
                    className="rounded border border-gray-300 px-3 py-1 text-xs text-gray-600 hover:bg-gray-50"
                  >
                    Rename
                  </button>
                </>
              )}
            </div>
          ))}
          {categories.length === 0 && (
            <p className="px-6 py-6 text-sm text-gray-400">No categories found.</p>
          )}
        </div>
      </section>
    </div>
  );
}
