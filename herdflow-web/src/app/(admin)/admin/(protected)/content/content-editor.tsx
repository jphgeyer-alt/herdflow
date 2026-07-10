"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card, CardHeader } from "@/components/admin/Card";
import { Input } from "@/components/admin/Field";
import { Button } from "@/components/admin/Button";

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
  const [catSaving, setCatSaving] = useState(false);

  async function saveBanner() {
    setBannerSaving(true);
    try {
      const res = await fetch("/api/admin/content", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "banner", updates: banner }),
      });
      if (!res.ok) {
        const p = await res.json().catch(() => ({}));
        toast.error(typeof p.error === "string" ? p.error : "Failed to save.");
        return;
      }
      toast.success("Banner saved.");
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setBannerSaving(false);
    }
  }

  async function saveCategory() {
    if (!editingCategory) return;
    setCatSaving(true);
    try {
      const res = await fetch("/api/admin/content", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "category",
          id: editingCategory.id,
          name: editingCategory.name,
        }),
      });
      if (!res.ok) {
        const p = await res.json().catch(() => ({}));
        toast.error(typeof p.error === "string" ? p.error : "Failed to save.");
        return;
      }
      setCategories((prev) =>
        prev.map((c) => (c.id === editingCategory.id ? { ...c, name: editingCategory.name } : c)),
      );
      toast.success("Category renamed.");
      setEditingCategory(null);
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setCatSaving(false);
    }
  }

  return (
    <div className="space-y-10">
      {/* Banner Editor */}
      <Card>
        <CardHeader
          title="Homepage Banner"
          description="Changes here update the public storefront banner without touching code."
        />
        <div className="space-y-4 p-6">
          {BANNER_FIELDS.map((field) => (
            <Input
              key={field.key}
              label={field.label}
              value={banner[field.key] ?? ""}
              placeholder={field.placeholder}
              onChange={(e) => setBanner((prev) => ({ ...prev, [field.key]: e.target.value }))}
            />
          ))}

          {/* Preview */}
          {(banner.banner_image_url || banner.banner_heading) && (
            <div
              className="relative flex min-h-30 items-center overflow-hidden rounded-lg"
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

          <div className="pt-2">
            <Button onClick={saveBanner} loading={bannerSaving}>
              Save Banner
            </Button>
          </div>
        </div>
      </Card>

      {/* Category Editor */}
      <Card>
        <CardHeader
          title="Category Names"
          description="Rename categories shown in the listings filter and product pages."
        />
        <div className="divide-y divide-navy-50">
          {categories.map((cat) => (
            <div key={cat.id} className="flex items-center gap-3 px-6 py-3">
              <span className="w-16 text-xs tracking-wide text-navy-300 uppercase">{cat.kind}</span>
              {editingCategory?.id === cat.id ? (
                <>
                  <Input
                    value={editingCategory.name}
                    onChange={(e) =>
                      setEditingCategory({ ...editingCategory, name: e.target.value })
                    }
                    className="flex-1"
                    autoFocus
                  />
                  <Button size="sm" variant="secondary" onClick={saveCategory} loading={catSaving}>
                    Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setEditingCategory(null)}>
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-sm text-navy-600">{cat.name}</span>
                  <span className="font-mono text-xs text-navy-300">{cat.slug}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingCategory({ id: cat.id, name: cat.name })}
                  >
                    Rename
                  </Button>
                </>
              )}
            </div>
          ))}
          {categories.length === 0 && (
            <p className="px-6 py-6 text-sm text-navy-300">No categories found.</p>
          )}
        </div>
      </Card>
    </div>
  );
}
