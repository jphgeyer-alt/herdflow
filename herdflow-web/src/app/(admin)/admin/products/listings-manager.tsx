"use client";

import { useRef, useState } from "react";
import {
  Upload,
  X,
  Plus,
  Pencil,
  Trash2,
  Star,
  CheckCircle,
  Image as ImageIcon,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

type LivestockItem = {
  id: string;
  title: string;
  priceCents: number;
  region: string;
  breed: string;
  weightKg: number | null;
  ageMonths: number | null;
  status: string;
  isFeatured: boolean;
  photos: string[];
  category: { name: string };
  seller: { farmName: string };
};

type ProductItem = {
  id: string;
  name: string;
  priceCents: number;
  region: string | null;
  stockOnHand: number;
  status: string;
  isFeatured: boolean;
  photos: string[];
  category: { name: string };
  seller: { farmName: string } | null;
};

type ListingsManagerProps = {
  initialLivestock: LivestockItem[];
  initialProducts: ProductItem[];
  categories: Array<{ id: string; name: string }>;
  sellers: Array<{ id: string; farmName: string }>;
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function zar(cents: number) {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

const REGIONS = [
  "North West",
  "Free State",
  "Limpopo",
  "Gauteng",
  "Mpumalanga",
  "Northern Cape",
  "KwaZulu-Natal",
  "Western Cape",
  "Eastern Cape",
];
const STATUSES_LIVESTOCK = ["ACTIVE", "DRAFT", "SOLD", "ARCHIVED"];

// Hardcoded categories — used as fallback when DB has none
const STATIC_CATEGORIES = [
  "Cattle",
  "Sheep",
  "Goats",
  "Pigs",
  "Horses",
  "Poultry",
  "Livestock Feed",
  "Equipment",
  "Supplements",
  "Veterinary Supplies",
  "Other",
];
const STATUSES_PRODUCT = ["ACTIVE", "DRAFT", "OUT_OF_STOCK", "ARCHIVED"];

// ── Photo Uploader ───────────────────────────────────────────────────────────
// Images are compressed client-side (canvas, max 900px, JPEG 82%) and stored
// as base64 data URLs directly in the database — no server filesystem needed.

const MAX_SIDE = 900;
const JPEG_QUALITY = 0.82;

function compressToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const scale = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight, 1));
      const w = Math.round(img.naturalWidth * scale);
      const h = Math.round(img.naturalHeight * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas not available"));
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", JPEG_QUALITY));
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to load image"));
    };
    img.src = objectUrl;
  });
}

function PhotoUploader({
  photos,
  onChange,
}: {
  photos: string[];
  onChange: (urls: string[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploadError("");
    setUploading(true);
    const newUrls: string[] = [];
    for (const file of Array.from(files)) {
      if (!["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(file.type)) {
        setUploadError("Only JPEG, PNG and WebP are allowed");
        continue;
      }
      if (file.size > 10 * 1024 * 1024) {
        setUploadError("Max file size is 10 MB");
        continue;
      }
      try {
        const dataUrl = await compressToDataUrl(file);
        newUrls.push(dataUrl);
      } catch {
        setUploadError("Failed to process image. Please try again.");
      }
    }
    setUploading(false);
    if (newUrls.length > 0) onChange([...photos, ...newUrls]);
  }

  function removePhoto(index: number) {
    onChange(photos.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        {photos.map((url, i) => (
          <div
            key={i}
            className="group relative h-24 w-24 overflow-hidden rounded-lg border border-[#cdd8e7]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => removePhoto(i)}
              className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-white opacity-0 transition group-hover:opacity-100"
            >
              <X size={12} />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex h-24 w-24 flex-col items-center justify-center rounded-lg border-2 border-dashed border-[#cdd8e7] text-[#5d7497] transition hover:border-[#1B3A6B] hover:text-[#1B3A6B] disabled:opacity-50"
        >
          {uploading ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#1B3A6B] border-t-transparent" />
          ) : (
            <>
              <Upload size={20} />
              <span className="mt-1 text-[10px] font-semibold">Upload</span>
            </>
          )}
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      {uploadError && <p className="text-xs text-red-600">{uploadError}</p>}
      <p className="text-xs text-[#5d7497]">
        JPEG, PNG, WebP • Max 10 MB • Auto-compressed &amp; stored permanently
      </p>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

export function ListingsManager({
  initialLivestock,
  initialProducts,
  categories: initialCategories,
  sellers: initialSellers,
}: ListingsManagerProps) {
  const [livestock, setLivestock] = useState(initialLivestock);
  const [products, setProducts] = useState(initialProducts);
  const [categories, setCategories] = useState(initialCategories);
  const [sellers, setSellers] = useState(initialSellers);
  const [activeTab, setActiveTab] = useState<"livestock" | "products">("livestock");
  const [search, setSearch] = useState("");
  const [globalError, setGlobalError] = useState("");
  const [globalSuccess, setGlobalSuccess] = useState("");

  // Confirmation modal state
  const [pendingDelete, setPendingDelete] = useState<{
    kind: "livestock" | "product";
    id: string;
    name: string;
  } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Category seeding
  const [seeding, setSeeding] = useState(false);

  // Quick-add seller inline
  const [showQuickSeller, setShowQuickSeller] = useState(false);
  const [sellerDraft, setSellerDraft] = useState({
    farmName: "",
    ownerName: "",
    contactPhone: "",
    region: REGIONS[0],
  });
  const [sellerSaving, setSellerSaving] = useState(false);

  // Add Livestock form
  const [showAddLivestock, setShowAddLivestock] = useState(false);
  const [lsForm, setLsForm] = useState({
    title: "",
    description: "",
    priceRand: "",
    breed: "",
    weightKg: "",
    ageMonths: "",
    region: REGIONS[0],
    categoryName: STATIC_CATEGORIES[0], // always works — no DB needed
    sellerName: "",
    sellerPhone: "", // text entry — auto-creates seller
    photos: [] as string[],
  });
  const [lsSubmitting, setLsSubmitting] = useState(false);

  // Add Product form
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [prodForm, setProdForm] = useState({
    name: "",
    description: "",
    priceRand: "",
    stockOnHand: "0",
    region: "",
    categoryName: STATIC_CATEGORIES[0],
    sellerId: "",
    photos: [] as string[],
  });
  const [prodSubmitting, setProdSubmitting] = useState(false);

  // Edit Livestock inline
  const [editingLsId, setEditingLsId] = useState<string | null>(null);
  const [editLsDraft, setEditLsDraft] = useState({
    title: "",
    priceRand: "",
    breed: "",
    weightKg: "",
    ageMonths: "",
    region: "",
    status: "ACTIVE",
    photos: [] as string[],
  });

  // Edit Product inline
  const [editingProdId, setEditingProdId] = useState<string | null>(null);
  const [editProdDraft, setEditProdDraft] = useState({
    name: "",
    priceRand: "",
    stockOnHand: "",
    region: "",
    status: "ACTIVE",
    photos: [] as string[],
  });

  function showSuccess(msg: string) {
    setGlobalSuccess(msg);
    setTimeout(() => setGlobalSuccess(""), 4000);
  }

  async function seedCategories() {
    setSeeding(true);
    setGlobalError("");
    const res = await fetch("/api/admin/seed", { method: "POST" });
    const data = await res.json().catch(() => ({}));
    setSeeding(false);
    if (!res.ok) return setGlobalError(data.error || "Failed to seed categories.");
    setCategories(data.categories || []);
    showSuccess(`${data.created} categories seeded successfully!`);
  }

  async function quickAddSeller() {
    setGlobalError("");
    setSellerSaving(true);
    const res = await fetch("/api/admin/sellers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sellerDraft),
    });
    const data = await res.json().catch(() => ({}));
    setSellerSaving(false);
    if (!res.ok) return setGlobalError(data.error || "Failed to create seller.");
    const newSeller = { id: data.seller.id, farmName: data.seller.farmName };
    setSellers((p) => [...p, newSeller]);
    setLsForm((p) => ({ ...p, sellerId: newSeller.id }));
    setSellerDraft({ farmName: "", ownerName: "", contactPhone: "", region: REGIONS[0] });
    setShowQuickSeller(false);
    showSuccess(`Seller "${newSeller.farmName}" created!`);
  }

  // Filter
  const filteredLivestock = livestock.filter((item) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      item.breed.toLowerCase().includes(q) ||
      item.category.name.toLowerCase().includes(q) ||
      item.seller.farmName.toLowerCase().includes(q)
    );
  });
  const filteredProducts = products.filter((item) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      item.name.toLowerCase().includes(q) ||
      item.category.name.toLowerCase().includes(q) ||
      (item.seller?.farmName || "").toLowerCase().includes(q)
    );
  });

  // Actions
  async function runAction(
    kind: "livestock" | "product",
    id: string,
    action: string,
    data?: Record<string, unknown>,
  ) {
    setGlobalError("");
    const res = await fetch("/api/admin/listings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, id, action, data }),
    });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) {
      setGlobalError(d.error || "Action failed");
      return false;
    }
    return true;
  }

  function requestDelete(kind: "livestock" | "product", id: string, name: string) {
    setPendingDelete({ kind, id, name });
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    const { kind, id } = pendingDelete;
    setPendingDelete(null);
    setDeletingId(id);
    setGlobalError("");
    const res = await fetch("/api/admin/listings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, id, action: "delete" }),
    });
    const d = await res.json().catch(() => ({}));
    setDeletingId(null);
    if (!res.ok) {
      setGlobalError(d.error || "Delete failed. Please try again.");
      return;
    }
    if (kind === "livestock") setLivestock((p) => p.filter((x) => x.id !== id));
    else setProducts((p) => p.filter((x) => x.id !== id));
    showSuccess(`${kind === "livestock" ? "Listing" : "Product"} deleted successfully.`);
  }

  async function toggleFeatured(kind: "livestock" | "product", id: string, val: boolean) {
    const ok = await runAction(kind, id, "feature", { isFeatured: val });
    if (!ok) return;
    if (kind === "livestock")
      setLivestock((p) => p.map((x) => (x.id === id ? { ...x, isFeatured: val } : x)));
    else setProducts((p) => p.map((x) => (x.id === id ? { ...x, isFeatured: val } : x)));
  }

  async function approve(kind: "livestock" | "product", id: string) {
    const ok = await runAction(kind, id, "approve");
    if (!ok) return;
    if (kind === "livestock")
      setLivestock((p) => p.map((x) => (x.id === id ? { ...x, status: "ACTIVE" } : x)));
    else setProducts((p) => p.map((x) => (x.id === id ? { ...x, status: "ACTIVE" } : x)));
    showSuccess("Approved.");
  }

  // Create Livestock
  async function submitAddLivestock() {
    setGlobalError("");
    const priceCents = Math.round(parseFloat(lsForm.priceRand || "0") * 100);
    if (!lsForm.title.trim()) return setGlobalError("Title is required.");
    if (!lsForm.description.trim()) return setGlobalError("Description is required.");
    if (!lsForm.breed.trim()) return setGlobalError("Breed is required.");
    if (!lsForm.sellerName.trim()) return setGlobalError("Seller / Farm Name is required.");
    if (!lsForm.categoryName) return setGlobalError("Category is required.");
    if (isNaN(priceCents) || priceCents < 0) return setGlobalError("Enter a valid price.");
    setLsSubmitting(true);
    const res = await fetch("/api/admin/listings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "livestock",
        data: {
          title: lsForm.title.trim(),
          description: lsForm.description.trim(),
          priceCents,
          breed: lsForm.breed.trim(),
          weightKg: lsForm.weightKg ? Number(lsForm.weightKg) : null,
          ageMonths: lsForm.ageMonths ? Number(lsForm.ageMonths) : null,
          region: lsForm.region,
          categoryName: lsForm.categoryName,
          sellerName: lsForm.sellerName.trim(),
          sellerPhone: lsForm.sellerPhone.trim(),
          photos: lsForm.photos,
        },
      }),
    });
    setLsSubmitting(false);
    const body = await res.json().catch(() => ({}));
    if (!res.ok) return setGlobalError(body.error || "Failed to create listing.");
    setLivestock((p) => [body.listing, ...p]);
    setLsForm({
      title: "",
      description: "",
      priceRand: "",
      breed: "",
      weightKg: "",
      ageMonths: "",
      region: REGIONS[0],
      categoryName: STATIC_CATEGORIES[0],
      sellerName: "",
      sellerPhone: "",
      photos: [],
    });
    setShowAddLivestock(false);
    showSuccess("Livestock listing created!");
  }

  // Create Product
  async function submitAddProduct() {
    setGlobalError("");
    const priceCents = Math.round(parseFloat(prodForm.priceRand || "0") * 100);
    if (!prodForm.name.trim()) return setGlobalError("Product name is required.");
    if (!prodForm.description.trim()) return setGlobalError("Description is required.");
    if (!prodForm.categoryName) return setGlobalError("Please select a category.");
    if (isNaN(priceCents) || priceCents < 0) return setGlobalError("Enter a valid price.");
    setProdSubmitting(true);
    const res = await fetch("/api/admin/listings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "product",
        data: {
          name: prodForm.name.trim(),
          description: prodForm.description.trim(),
          priceCents,
          stockOnHand: Number(prodForm.stockOnHand) || 0,
          region: prodForm.region.trim() || null,
          categoryName: prodForm.categoryName,
          sellerId: prodForm.sellerId || null,
          photos: prodForm.photos,
        },
      }),
    });
    setProdSubmitting(false);
    const body = await res.json().catch(() => ({}));
    if (!res.ok) return setGlobalError(body.error || "Failed to create product.");
    setProducts((p) => [body.product, ...p]);
    setProdForm({
      name: "",
      description: "",
      priceRand: "",
      stockOnHand: "0",
      region: "",
      categoryName: STATIC_CATEGORIES[0],
      sellerId: "",
      photos: [],
    });
    setShowAddProduct(false);
    showSuccess("Product created!");
  }

  // Save Edit Livestock
  async function saveEditLivestock(item: LivestockItem) {
    setGlobalError("");
    const priceCents = Math.round(parseFloat(editLsDraft.priceRand || "0") * 100);
    if (!editLsDraft.title.trim()) return setGlobalError("Title is required.");
    if (isNaN(priceCents) || priceCents < 0) return setGlobalError("Invalid price.");
    const ok = await runAction("livestock", item.id, "update", {
      title: editLsDraft.title.trim(),
      priceCents,
      region: editLsDraft.region,
      status: editLsDraft.status,
    });
    if (!ok) return;
    setLivestock((p) =>
      p.map((x) =>
        x.id === item.id
          ? {
              ...x,
              title: editLsDraft.title.trim(),
              priceCents,
              region: editLsDraft.region,
              status: editLsDraft.status,
              breed: editLsDraft.breed,
              photos: editLsDraft.photos,
            }
          : x,
      ),
    );
    setEditingLsId(null);
    showSuccess("Listing updated.");
  }

  // Save Edit Product
  async function saveEditProduct(item: ProductItem) {
    setGlobalError("");
    const priceCents = Math.round(parseFloat(editProdDraft.priceRand || "0") * 100);
    if (!editProdDraft.name.trim()) return setGlobalError("Name is required.");
    if (isNaN(priceCents) || priceCents < 0) return setGlobalError("Invalid price.");
    const ok = await runAction("product", item.id, "update", {
      name: editProdDraft.name.trim(),
      priceCents,
      region: editProdDraft.region.trim() || null,
      stockOnHand: Number(editProdDraft.stockOnHand) || 0,
      status: editProdDraft.status,
    });
    if (!ok) return;
    setProducts((p) =>
      p.map((x) =>
        x.id === item.id
          ? {
              ...x,
              name: editProdDraft.name.trim(),
              priceCents,
              region: editProdDraft.region || null,
              stockOnHand: Number(editProdDraft.stockOnHand) || 0,
              status: editProdDraft.status,
              photos: editProdDraft.photos,
            }
          : x,
      ),
    );
    setEditingProdId(null);
    showSuccess("Product updated.");
  }

  return (
    <section className="space-y-6">
      {/* ── Delete Confirmation Modal ──────────────────────────────────── */}
      {pendingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-sm rounded-2xl border border-[#e4ebf5] bg-white p-6 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-100">
                <Trash2 size={18} className="text-red-700" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#1B3A6B]">
                  Delete {pendingDelete.kind === "livestock" ? "Livestock Listing" : "Product"}?
                </h3>
                <p className="mt-1 text-sm text-[#5d7497]">
                  Are you sure you want to delete{" "}
                  <strong>&ldquo;{pendingDelete.name}&rdquo;</strong>? This action cannot be undone.
                </p>
                {pendingDelete.kind === "product" && (
                  <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
                    Any order history referencing this product will have its line items removed.
                  </p>
                )}
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setPendingDelete(null)}
                className="rounded-lg border border-[#cdd8e7] px-5 py-2 text-sm font-semibold text-[#5d7497] transition hover:bg-[#f5f8fd]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="rounded-lg bg-red-600 px-5 py-2 text-sm font-bold text-white transition hover:bg-red-700"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      {globalError && (
        <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {globalError}
          <button onClick={() => setGlobalError("")}>
            <X size={16} />
          </button>
        </div>
      )}
      {globalSuccess && (
        <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          <CheckCircle size={16} />
          {globalSuccess}
        </div>
      )}

      {/* ── Setup Banners ──────────────────────────────────────────────── */}
      {categories.length === 0 && (
        <div className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold text-amber-800">No categories found</p>
            <p className="mt-0.5 text-xs text-amber-700">
              Your database has no product categories. Click the button to seed the default
              categories (Cattle, Sheep, Goats, Equipment, etc.)
            </p>
          </div>
          <button
            type="button"
            disabled={seeding}
            onClick={seedCategories}
            className="flex-shrink-0 rounded-lg bg-amber-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-amber-700 disabled:opacity-50"
          >
            {seeding ? "Seeding…" : "Seed Default Categories"}
          </button>
        </div>
      )}

      {sellers.length === 0 && (
        <div className="flex flex-col gap-3 rounded-xl border border-blue-200 bg-blue-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold text-blue-800">No sellers found</p>
            <p className="mt-0.5 text-xs text-blue-700">
              You need at least one seller to create livestock listings. Add a farmer/seller below
              or wait for sellers to register through the public site.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowQuickSeller((v) => !v)}
            className="flex-shrink-0 rounded-lg bg-[#1B3A6B] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#122844]"
          >
            <Plus size={14} className="mr-1 inline" />
            Add Seller
          </button>
        </div>
      )}

      {/* Quick-add seller inline panel */}
      {showQuickSeller && (
        <div className="space-y-4 rounded-2xl border border-[#d8e0ec] bg-white p-6 shadow-lg">
          <h3 className="font-bold text-[#1B3A6B]">Add Seller / Farmer</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#244367]">
                Farm / Business Name *
              </label>
              <input
                className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2 text-sm focus:border-[#1B3A6B] focus:outline-none"
                placeholder="e.g. Botha Family Farm"
                value={sellerDraft.farmName}
                onChange={(e) => setSellerDraft((p) => ({ ...p, farmName: e.target.value }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#244367]">
                Owner / Contact Name *
              </label>
              <input
                className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2 text-sm focus:border-[#1B3A6B] focus:outline-none"
                placeholder="e.g. Pieter Botha"
                value={sellerDraft.ownerName}
                onChange={(e) => setSellerDraft((p) => ({ ...p, ownerName: e.target.value }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#244367]">
                Contact Phone
              </label>
              <input
                className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2 text-sm focus:border-[#1B3A6B] focus:outline-none"
                placeholder="+27 82 000 0000"
                value={sellerDraft.contactPhone}
                onChange={(e) => setSellerDraft((p) => ({ ...p, contactPhone: e.target.value }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#244367]">Region *</label>
              <select
                className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2 text-sm focus:border-[#1B3A6B] focus:outline-none"
                value={sellerDraft.region}
                onChange={(e) => setSellerDraft((p) => ({ ...p, region: e.target.value }))}
              >
                {REGIONS.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              disabled={sellerSaving}
              onClick={quickAddSeller}
              className="rounded-lg bg-[#2E7D32] px-5 py-2 text-sm font-bold text-white transition hover:bg-[#1d5e20] disabled:opacity-50"
            >
              {sellerSaving ? "Saving…" : "Create Seller"}
            </button>
            <button
              type="button"
              onClick={() => setShowQuickSeller(false)}
              className="rounded-lg border border-[#cdd8e7] px-5 py-2 text-sm text-[#5d7497] transition hover:bg-[#f5f8fd]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Tabs + search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex rounded-lg bg-[#ebf1f9] p-1">
          <button
            className={`rounded-md px-4 py-2 text-sm font-semibold transition ${activeTab === "livestock" ? "bg-white text-[#1B3A6B] shadow-sm" : "text-[#5d7497]"}`}
            onClick={() => setActiveTab("livestock")}
            type="button"
          >
            Livestock ({livestock.length})
          </button>
          <button
            className={`rounded-md px-4 py-2 text-sm font-semibold transition ${activeTab === "products" ? "bg-white text-[#1B3A6B] shadow-sm" : "text-[#5d7497]"}`}
            onClick={() => setActiveTab("products")}
            type="button"
          >
            Products ({products.length})
          </button>
        </div>
        <input
          className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2 text-sm focus:border-[#1B3A6B] focus:outline-none sm:w-72"
          placeholder="Search…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* ── LIVESTOCK TAB ───────────────────────────────────────────────── */}
      {activeTab === "livestock" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setShowQuickSeller((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#1B3A6B] px-4 py-2 text-sm font-semibold text-[#1B3A6B] transition hover:bg-[#f0f5ff]"
            >
              <Plus size={14} /> Add Seller
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAddLivestock((v) => !v);
                setShowAddProduct(false);
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-[#2E7D32] px-5 py-2.5 text-sm font-bold text-white shadow transition hover:bg-[#1d5e20]"
            >
              <Plus size={16} /> Add New Livestock Listing
            </button>
          </div>

          {showAddLivestock && (
            <div className="space-y-5 rounded-2xl border border-[#d8e0ec] bg-white p-6 shadow-lg">
              <h3 className="text-lg font-bold text-[#1B3A6B]">New Livestock Listing</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-semibold text-[#244367]">Title *</label>
                  <input
                    className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2 text-sm focus:border-[#1B3A6B] focus:outline-none"
                    placeholder="e.g. 10 Angus Breeding Cows"
                    value={lsForm.title}
                    onChange={(e) => setLsForm((p) => ({ ...p, title: e.target.value }))}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-semibold text-[#244367]">
                    Description *
                  </label>
                  <textarea
                    rows={3}
                    className="w-full resize-none rounded-lg border border-[#cdd8e7] px-3 py-2 text-sm focus:border-[#1B3A6B] focus:outline-none"
                    placeholder="Health status, feeding, vaccinations…"
                    value={lsForm.description}
                    onChange={(e) => setLsForm((p) => ({ ...p, description: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#244367]">
                    Price (R) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2 text-sm focus:border-[#1B3A6B] focus:outline-none"
                    placeholder="e.g. 15000"
                    value={lsForm.priceRand}
                    onChange={(e) => setLsForm((p) => ({ ...p, priceRand: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#244367]">Breed *</label>
                  <input
                    className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2 text-sm focus:border-[#1B3A6B] focus:outline-none"
                    placeholder="e.g. Angus, Hereford, Brahman"
                    value={lsForm.breed}
                    onChange={(e) => setLsForm((p) => ({ ...p, breed: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#244367]">
                    Weight (kg)
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2 text-sm focus:border-[#1B3A6B] focus:outline-none"
                    placeholder="e.g. 450"
                    value={lsForm.weightKg}
                    onChange={(e) => setLsForm((p) => ({ ...p, weightKg: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#244367]">
                    Age (months)
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2 text-sm focus:border-[#1B3A6B] focus:outline-none"
                    placeholder="e.g. 36"
                    value={lsForm.ageMonths}
                    onChange={(e) => setLsForm((p) => ({ ...p, ageMonths: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#244367]">
                    Region *
                  </label>
                  <select
                    className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2 text-sm focus:border-[#1B3A6B] focus:outline-none"
                    value={lsForm.region}
                    onChange={(e) => setLsForm((p) => ({ ...p, region: e.target.value }))}
                  >
                    {REGIONS.map((r) => (
                      <option key={r}>{r}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#244367]">
                    Category *
                  </label>
                  <select
                    className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2 text-sm focus:border-[#1B3A6B] focus:outline-none"
                    value={lsForm.categoryName}
                    onChange={(e) => setLsForm((p) => ({ ...p, categoryName: e.target.value }))}
                  >
                    {(categories.length > 0
                      ? categories.map((c) => c.name)
                      : STATIC_CATEGORIES
                    ).map((n) => (
                      <option key={n}>{n}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#244367]">
                    Seller / Farm Name *
                  </label>
                  <input
                    className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2 text-sm focus:border-[#1B3A6B] focus:outline-none"
                    placeholder="e.g. Botha Family Farm"
                    value={lsForm.sellerName}
                    onChange={(e) => setLsForm((p) => ({ ...p, sellerName: e.target.value }))}
                  />
                  <p className="mt-1 text-[10px] text-[#5d7497]">
                    Seller will be created automatically if they don&apos;t exist yet.
                  </p>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#244367]">
                    Seller Phone (optional)
                  </label>
                  <input
                    className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2 text-sm focus:border-[#1B3A6B] focus:outline-none"
                    placeholder="+27 82 000 0000"
                    value={lsForm.sellerPhone}
                    onChange={(e) => setLsForm((p) => ({ ...p, sellerPhone: e.target.value }))}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-xs font-semibold text-[#244367]">Photos</label>
                  <PhotoUploader
                    photos={lsForm.photos}
                    onChange={(urls) => setLsForm((p) => ({ ...p, photos: urls }))}
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  disabled={lsSubmitting}
                  onClick={submitAddLivestock}
                  className="flex-1 rounded-lg bg-[#2E7D32] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#1d5e20] disabled:opacity-50"
                >
                  {lsSubmitting ? "Creating…" : "Create Livestock Listing"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddLivestock(false)}
                  className="rounded-lg border border-[#cdd8e7] px-5 py-3 text-sm font-semibold text-[#5d7497] transition hover:bg-[#f5f8fd]"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {filteredLivestock.length === 0 ? (
            <div className="rounded-2xl border border-[#e4ebf5] bg-white p-12 text-center">
              <ImageIcon size={48} className="mx-auto mb-3 text-[#cdd8e7]" />
              <p className="text-[#5d7497]">
                No livestock listings yet. Click &ldquo;Add New Livestock Listing&rdquo; to create
                one.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredLivestock.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-[#e4ebf5] bg-white p-5 shadow-sm"
                >
                  {editingLsId === item.id ? (
                    <div className="space-y-4">
                      <h4 className="font-bold text-[#1B3A6B]">Editing: {item.title}</h4>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                          <label className="mb-1 block text-xs font-semibold text-[#244367]">
                            Title
                          </label>
                          <input
                            className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2 text-sm focus:border-[#1B3A6B] focus:outline-none"
                            value={editLsDraft.title}
                            onChange={(e) =>
                              setEditLsDraft((p) => ({ ...p, title: e.target.value }))
                            }
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-semibold text-[#244367]">
                            Price (R)
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2 text-sm focus:border-[#1B3A6B] focus:outline-none"
                            value={editLsDraft.priceRand}
                            onChange={(e) =>
                              setEditLsDraft((p) => ({ ...p, priceRand: e.target.value }))
                            }
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-semibold text-[#244367]">
                            Breed
                          </label>
                          <input
                            className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2 text-sm focus:border-[#1B3A6B] focus:outline-none"
                            value={editLsDraft.breed}
                            onChange={(e) =>
                              setEditLsDraft((p) => ({ ...p, breed: e.target.value }))
                            }
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-semibold text-[#244367]">
                            Region
                          </label>
                          <select
                            className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2 text-sm focus:border-[#1B3A6B] focus:outline-none"
                            value={editLsDraft.region}
                            onChange={(e) =>
                              setEditLsDraft((p) => ({ ...p, region: e.target.value }))
                            }
                          >
                            {REGIONS.map((r) => (
                              <option key={r}>{r}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-semibold text-[#244367]">
                            Status
                          </label>
                          <select
                            className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2 text-sm focus:border-[#1B3A6B] focus:outline-none"
                            value={editLsDraft.status}
                            onChange={(e) =>
                              setEditLsDraft((p) => ({ ...p, status: e.target.value }))
                            }
                          >
                            {STATUSES_LIVESTOCK.map((s) => (
                              <option key={s}>{s}</option>
                            ))}
                          </select>
                        </div>
                        <div className="sm:col-span-2">
                          <label className="mb-2 block text-xs font-semibold text-[#244367]">
                            Photos
                          </label>
                          <PhotoUploader
                            photos={editLsDraft.photos}
                            onChange={(urls) => setEditLsDraft((p) => ({ ...p, photos: urls }))}
                          />
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => saveEditLivestock(item)}
                          className="rounded-lg bg-[#1B3A6B] px-5 py-2 text-sm font-bold text-white transition hover:bg-[#122844]"
                        >
                          Save Changes
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingLsId(null)}
                          className="rounded-lg border border-[#cdd8e7] px-5 py-2 text-sm text-[#5d7497] transition hover:bg-[#f5f8fd]"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                      {item.photos[0] ? (
                        <img
                          src={item.photos[0]}
                          alt={item.title}
                          className="h-16 w-20 flex-shrink-0 rounded-lg border border-[#e4ebf5] object-cover"
                        />
                      ) : (
                        <div className="flex h-16 w-20 flex-shrink-0 items-center justify-center rounded-lg border border-[#e4ebf5] bg-[#f0f5ff]">
                          <ImageIcon size={20} className="text-[#cdd8e7]" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-bold text-[#1B3A6B]">{item.title}</p>
                        <p className="text-xs text-[#5d7497]">
                          {item.category.name} • {item.region} • {item.seller.farmName}
                        </p>
                        <p className="text-xs text-[#5d7497]">
                          Breed: {item.breed}
                          {item.weightKg ? ` • ${item.weightKg}kg` : ""}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <p className="font-bold text-[#2E7D32]">{zar(item.priceCents)}</p>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${item.status === "ACTIVE" ? "bg-green-100 text-green-800" : item.status === "SOLD" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-600"}`}
                        >
                          {item.status}
                        </span>
                      </div>
                      <div className="flex flex-shrink-0 items-center gap-2">
                        {item.status !== "ACTIVE" && (
                          <button
                            type="button"
                            onClick={() => approve("livestock", item.id)}
                            title="Approve"
                            className="rounded-lg bg-green-50 p-2 text-green-700 transition hover:bg-green-100"
                          >
                            <CheckCircle size={16} />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => toggleFeatured("livestock", item.id, !item.isFeatured)}
                          className={`rounded-lg p-2 transition ${item.isFeatured ? "bg-amber-100 text-amber-700" : "bg-gray-50 text-gray-400"}`}
                        >
                          <Star size={16} fill={item.isFeatured ? "currentColor" : "none"} />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingLsId(item.id);
                            setEditLsDraft({
                              title: item.title,
                              priceRand: String(item.priceCents / 100),
                              breed: item.breed,
                              weightKg: item.weightKg ? String(item.weightKg) : "",
                              ageMonths: item.ageMonths ? String(item.ageMonths) : "",
                              region: item.region,
                              status: item.status,
                              photos: [...item.photos],
                            });
                          }}
                          className="rounded-lg bg-blue-50 p-2 text-blue-700 transition hover:bg-blue-100"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => requestDelete("livestock", item.id, item.title)}
                          disabled={deletingId === item.id}
                          className="rounded-lg bg-red-50 p-2 text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                        >
                          {deletingId === item.id ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-700 border-t-transparent" />
                          ) : (
                            <Trash2 size={16} />
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── PRODUCTS TAB ────────────────────────────────────────────────── */}
      {activeTab === "products" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => {
                setShowAddProduct((v) => !v);
                setShowAddLivestock(false);
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-[#1B3A6B] px-5 py-2.5 text-sm font-bold text-white shadow transition hover:bg-[#122844]"
            >
              <Plus size={16} /> Add New Product
            </button>
          </div>

          {showAddProduct && (
            <div className="space-y-5 rounded-2xl border border-[#d8e0ec] bg-white p-6 shadow-lg">
              <h3 className="text-lg font-bold text-[#1B3A6B]">New Shop Product</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-semibold text-[#244367]">
                    Product Name *
                  </label>
                  <input
                    className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2 text-sm focus:border-[#1B3A6B] focus:outline-none"
                    placeholder="e.g. Protein Livestock Feed 50kg"
                    value={prodForm.name}
                    onChange={(e) => setProdForm((p) => ({ ...p, name: e.target.value }))}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-semibold text-[#244367]">
                    Description *
                  </label>
                  <textarea
                    rows={3}
                    className="w-full resize-none rounded-lg border border-[#cdd8e7] px-3 py-2 text-sm focus:border-[#1B3A6B] focus:outline-none"
                    placeholder="Describe the product"
                    value={prodForm.description}
                    onChange={(e) => setProdForm((p) => ({ ...p, description: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#244367]">
                    Price (R) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2 text-sm focus:border-[#1B3A6B] focus:outline-none"
                    placeholder="e.g. 299.99"
                    value={prodForm.priceRand}
                    onChange={(e) => setProdForm((p) => ({ ...p, priceRand: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#244367]">
                    Stock on Hand
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2 text-sm focus:border-[#1B3A6B] focus:outline-none"
                    placeholder="0"
                    value={prodForm.stockOnHand}
                    onChange={(e) => setProdForm((p) => ({ ...p, stockOnHand: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#244367]">
                    Region (optional)
                  </label>
                  <select
                    className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2 text-sm focus:border-[#1B3A6B] focus:outline-none"
                    value={prodForm.region}
                    onChange={(e) => setProdForm((p) => ({ ...p, region: e.target.value }))}
                  >
                    <option value="">— All Regions —</option>
                    {REGIONS.map((r) => (
                      <option key={r}>{r}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#244367]">
                    Category *
                  </label>
                  <select
                    className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2 text-sm focus:border-[#1B3A6B] focus:outline-none"
                    value={prodForm.categoryName}
                    onChange={(e) => setProdForm((p) => ({ ...p, categoryName: e.target.value }))}
                  >
                    {(categories.length > 0
                      ? categories.map((c) => c.name)
                      : STATIC_CATEGORIES
                    ).map((n) => (
                      <option key={n}>{n}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#244367]">
                    Seller (optional)
                  </label>
                  <select
                    className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2 text-sm focus:border-[#1B3A6B] focus:outline-none"
                    value={prodForm.sellerId}
                    onChange={(e) => setProdForm((p) => ({ ...p, sellerId: e.target.value }))}
                  >
                    <option value="">— HerdFlow Direct —</option>
                    {sellers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.farmName}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-xs font-semibold text-[#244367]">Photos</label>
                  <PhotoUploader
                    photos={prodForm.photos}
                    onChange={(urls) => setProdForm((p) => ({ ...p, photos: urls }))}
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  disabled={prodSubmitting}
                  onClick={submitAddProduct}
                  className="flex-1 rounded-lg bg-[#1B3A6B] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#122844] disabled:opacity-50"
                >
                  {prodSubmitting ? "Creating…" : "Create Product"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddProduct(false)}
                  className="rounded-lg border border-[#cdd8e7] px-5 py-3 text-sm font-semibold text-[#5d7497] transition hover:bg-[#f5f8fd]"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {filteredProducts.length === 0 ? (
            <div className="rounded-2xl border border-[#e4ebf5] bg-white p-12 text-center">
              <ImageIcon size={48} className="mx-auto mb-3 text-[#cdd8e7]" />
              <p className="text-[#5d7497]">
                No products yet. Click &ldquo;Add New Product&rdquo; to create one.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredProducts.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-[#e4ebf5] bg-white p-5 shadow-sm"
                >
                  {editingProdId === item.id ? (
                    <div className="space-y-4">
                      <h4 className="font-bold text-[#1B3A6B]">Editing: {item.name}</h4>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                          <label className="mb-1 block text-xs font-semibold text-[#244367]">
                            Name
                          </label>
                          <input
                            className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2 text-sm focus:border-[#1B3A6B] focus:outline-none"
                            value={editProdDraft.name}
                            onChange={(e) =>
                              setEditProdDraft((p) => ({ ...p, name: e.target.value }))
                            }
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-semibold text-[#244367]">
                            Price (R)
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2 text-sm focus:border-[#1B3A6B] focus:outline-none"
                            value={editProdDraft.priceRand}
                            onChange={(e) =>
                              setEditProdDraft((p) => ({ ...p, priceRand: e.target.value }))
                            }
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-semibold text-[#244367]">
                            Stock
                          </label>
                          <input
                            type="number"
                            min="0"
                            className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2 text-sm focus:border-[#1B3A6B] focus:outline-none"
                            value={editProdDraft.stockOnHand}
                            onChange={(e) =>
                              setEditProdDraft((p) => ({ ...p, stockOnHand: e.target.value }))
                            }
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-semibold text-[#244367]">
                            Region
                          </label>
                          <select
                            className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2 text-sm focus:border-[#1B3A6B] focus:outline-none"
                            value={editProdDraft.region}
                            onChange={(e) =>
                              setEditProdDraft((p) => ({ ...p, region: e.target.value }))
                            }
                          >
                            <option value="">— All Regions —</option>
                            {REGIONS.map((r) => (
                              <option key={r}>{r}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-semibold text-[#244367]">
                            Status
                          </label>
                          <select
                            className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2 text-sm focus:border-[#1B3A6B] focus:outline-none"
                            value={editProdDraft.status}
                            onChange={(e) =>
                              setEditProdDraft((p) => ({ ...p, status: e.target.value }))
                            }
                          >
                            {STATUSES_PRODUCT.map((s) => (
                              <option key={s}>{s}</option>
                            ))}
                          </select>
                        </div>
                        <div className="sm:col-span-2">
                          <label className="mb-2 block text-xs font-semibold text-[#244367]">
                            Photos
                          </label>
                          <PhotoUploader
                            photos={editProdDraft.photos}
                            onChange={(urls) => setEditProdDraft((p) => ({ ...p, photos: urls }))}
                          />
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => saveEditProduct(item)}
                          className="rounded-lg bg-[#1B3A6B] px-5 py-2 text-sm font-bold text-white transition hover:bg-[#122844]"
                        >
                          Save Changes
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingProdId(null)}
                          className="rounded-lg border border-[#cdd8e7] px-5 py-2 text-sm text-[#5d7497] transition hover:bg-[#f5f8fd]"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                      {item.photos[0] ? (
                        <img
                          src={item.photos[0]}
                          alt={item.name}
                          className="h-16 w-20 flex-shrink-0 rounded-lg border border-[#e4ebf5] object-cover"
                        />
                      ) : (
                        <div className="flex h-16 w-20 flex-shrink-0 items-center justify-center rounded-lg border border-[#e4ebf5] bg-[#f0f5ff]">
                          <ImageIcon size={20} className="text-[#cdd8e7]" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-bold text-[#1B3A6B]">{item.name}</p>
                        <p className="text-xs text-[#5d7497]">
                          {item.category.name}
                          {item.seller ? ` • ${item.seller.farmName}` : ""}
                        </p>
                        <p className="text-xs text-[#5d7497]">
                          Stock: {item.stockOnHand}
                          {item.region ? ` • ${item.region}` : ""}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <p className="font-bold text-[#2E7D32]">{zar(item.priceCents)}</p>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${item.status === "ACTIVE" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}
                        >
                          {item.status}
                        </span>
                      </div>
                      <div className="flex flex-shrink-0 items-center gap-2">
                        {item.status !== "ACTIVE" && (
                          <button
                            type="button"
                            onClick={() => approve("product", item.id)}
                            title="Approve"
                            className="rounded-lg bg-green-50 p-2 text-green-700 transition hover:bg-green-100"
                          >
                            <CheckCircle size={16} />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => toggleFeatured("product", item.id, !item.isFeatured)}
                          className={`rounded-lg p-2 transition ${item.isFeatured ? "bg-amber-100 text-amber-700" : "bg-gray-50 text-gray-400"}`}
                        >
                          <Star size={16} fill={item.isFeatured ? "currentColor" : "none"} />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingProdId(item.id);
                            setEditProdDraft({
                              name: item.name,
                              priceRand: String(item.priceCents / 100),
                              stockOnHand: String(item.stockOnHand),
                              region: item.region || "",
                              status: item.status,
                              photos: [...item.photos],
                            });
                          }}
                          className="rounded-lg bg-blue-50 p-2 text-blue-700 transition hover:bg-blue-100"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => requestDelete("product", item.id, item.name)}
                          disabled={deletingId === item.id}
                          className="rounded-lg bg-red-50 p-2 text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                        >
                          {deletingId === item.id ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-700 border-t-transparent" />
                          ) : (
                            <Trash2 size={16} />
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
