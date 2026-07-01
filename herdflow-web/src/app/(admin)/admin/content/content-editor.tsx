"use client";

import { useState } from "react";

type Category = { id: string; name: string; slug: string; kind: string };

type ContentEditorProps = {
  initialContent: Record<string, string>;
  initialCategories: Category[];
};

const BANNER_FIELDS = [
  { key: "banner_heading", label: "Banner Heading", placeholder: "e.g. Buy & Sell Livestock Online" },
  { key: "banner_subheading", label: "Banner Subheading", placeholder: "e.g. South Africa's trusted farm trade platform" },
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
      body: JSON.stringify({ type: "category", id: editingCategory.id, name: editingCategory.name }),
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
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-700">Homepage Banner</h2>
          <p className="text-xs text-gray-500 mt-0.5">Changes here update the public storefront banner without touching code.</p>
        </div>
        <div className="px-6 py-5 space-y-4">
          {BANNER_FIELDS.map((field) => (
            <div key={field.key}>
              <label className="block text-xs font-medium text-gray-600 mb-1">{field.label}</label>
              <input
                type="text"
                value={banner[field.key] ?? ""}
                placeholder={field.placeholder}
                onChange={(e) => setBanner((prev) => ({ ...prev, [field.key]: e.target.value }))}
                className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-navy/40"
              />
            </div>
          ))}

          {/* Preview */}
          {(banner.banner_image_url || banner.banner_heading) && (
            <div
              className="rounded-lg overflow-hidden relative min-h-[120px] flex items-center"
              style={{
                backgroundImage: banner.banner_image_url ? `url(${banner.banner_image_url})` : undefined,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundColor: banner.banner_image_url ? undefined : "#1B3A6B",
              }}
            >
              <div className="absolute inset-0 bg-black/40" />
              <div className="relative px-6 py-6 text-white">
                {banner.banner_heading && <h3 className="text-xl font-bold">{banner.banner_heading}</h3>}
                {banner.banner_subheading && <p className="text-sm mt-1 opacity-90">{banner.banner_subheading}</p>}
                {banner.banner_cta_label && (
                  <span className="inline-block mt-3 rounded bg-white/20 border border-white/40 px-4 py-1.5 text-sm font-medium">
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
              className="rounded bg-brand-navy px-4 py-2 text-sm font-medium text-white hover:bg-brand-navy/90 transition disabled:opacity-50"
            >
              {bannerSaving ? "Saving…" : "Save Banner"}
            </button>
            {bannerSuccess && <span className="text-sm text-green-600 font-medium">Saved!</span>}
            {bannerError && <span className="text-sm text-red-600">{bannerError}</span>}
          </div>
        </div>
      </section>

      {/* Category Editor */}
      <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-700">Category Names</h2>
          <p className="text-xs text-gray-500 mt-0.5">Rename categories shown in the listings filter and product pages.</p>
        </div>
        <div className="divide-y divide-gray-100">
          {catError && (
            <p className="px-6 py-3 text-sm text-red-600 bg-red-50 border-b border-red-100">{catError}</p>
          )}
          {categories.map((cat) => (
            <div key={cat.id} className="flex items-center gap-3 px-6 py-3">
              <span className="text-xs text-gray-400 w-16 uppercase tracking-wide">{cat.kind}</span>
              {editingCategory?.id === cat.id ? (
                <>
                  <input
                    type="text"
                    value={editingCategory.name}
                    onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                    className="flex-1 rounded border border-brand-navy/40 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand-navy/40"
                    autoFocus
                  />
                  <button
                    onClick={saveCategory}
                    disabled={catSaving}
                    className="rounded bg-brand-navy px-3 py-1 text-xs text-white hover:bg-brand-navy/90 disabled:opacity-50"
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
                  <span className="text-xs text-gray-400 font-mono">{cat.slug}</span>
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
