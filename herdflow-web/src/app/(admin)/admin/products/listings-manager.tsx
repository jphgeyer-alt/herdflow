"use client";

import { useRef, useState } from "react";
import { Upload, X, Plus, Pencil, Trash2, Star, CheckCircle, Image as ImageIcon } from "lucide-react";

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
  return new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", maximumFractionDigits: 0 }).format(cents / 100);
}

const REGIONS = ["North West", "Free State", "Limpopo", "Gauteng", "Mpumalanga", "Northern Cape", "KwaZulu-Natal", "Western Cape", "Eastern Cape"];
const STATUSES_LIVESTOCK = ["ACTIVE", "DRAFT", "SOLD", "ARCHIVED"];

// Hardcoded categories — used as fallback when DB has none
const STATIC_CATEGORIES = [
  "Cattle", "Sheep", "Goats", "Pigs", "Horses", "Poultry",
  "Livestock Feed", "Equipment", "Supplements", "Veterinary Supplies", "Other",
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
    img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error("Failed to load image")); };
    img.src = objectUrl;
  });
}

function PhotoUploader({ photos, onChange }: { photos: string[]; onChange: (urls: string[]) => void }) {
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

  function removePhoto(index: number) { onChange(photos.filter((_, i) => i !== index)); }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        {photos.map((url, i) => (
          <div key={i} className="relative w-24 h-24 rounded-lg overflow-hidden border border-[#cdd8e7] group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
            <button type="button" onClick={() => removePhoto(i)}
              className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
              <X size={12} />
            </button>
          </div>
        ))}
        <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading}
          className="w-24 h-24 rounded-lg border-2 border-dashed border-[#cdd8e7] flex flex-col items-center justify-center text-[#5d7497] hover:border-[#1B3A6B] hover:text-[#1B3A6B] transition disabled:opacity-50">
          {uploading
            ? <div className="w-5 h-5 border-2 border-[#1B3A6B] border-t-transparent rounded-full animate-spin" />
            : <><Upload size={20} /><span className="text-[10px] mt-1 font-semibold">Upload</span></>}
        </button>
      </div>
      <input ref={inputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp" multiple className="hidden"
        onChange={(e) => handleFiles(e.target.files)} />
      {uploadError && <p className="text-xs text-red-600">{uploadError}</p>}
      <p className="text-xs text-[#5d7497]">JPEG, PNG, WebP • Max 10 MB • Auto-compressed &amp; stored permanently</p>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

export function ListingsManager({ initialLivestock, initialProducts, categories: initialCategories, sellers: initialSellers }: ListingsManagerProps) {
  const [livestock, setLivestock] = useState(initialLivestock);
  const [products, setProducts] = useState(initialProducts);
  const [categories, setCategories] = useState(initialCategories);
  const [sellers, setSellers] = useState(initialSellers);
  const [activeTab, setActiveTab] = useState<"livestock" | "products">("livestock");
  const [search, setSearch] = useState("");
  const [globalError, setGlobalError] = useState("");
  const [globalSuccess, setGlobalSuccess] = useState("");

  // Confirmation modal state
  const [pendingDelete, setPendingDelete] = useState<{ kind: "livestock" | "product"; id: string; name: string } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Category seeding
  const [seeding, setSeeding] = useState(false);

  // Quick-add seller inline
  const [showQuickSeller, setShowQuickSeller] = useState(false);
  const [sellerDraft, setSellerDraft] = useState({ farmName: "", ownerName: "", contactPhone: "", region: REGIONS[0] });
  const [sellerSaving, setSellerSaving] = useState(false);

  // Add Livestock form
  const [showAddLivestock, setShowAddLivestock] = useState(false);
  const [lsForm, setLsForm] = useState({
    title: "", description: "", priceRand: "", breed: "",
    weightKg: "", ageMonths: "", region: REGIONS[0],
    categoryName: STATIC_CATEGORIES[0],   // always works — no DB needed
    sellerName: "", sellerPhone: "",       // text entry — auto-creates seller
    photos: [] as string[],
  });
  const [lsSubmitting, setLsSubmitting] = useState(false);

  // Add Product form
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [prodForm, setProdForm] = useState({
    name: "", description: "", priceRand: "", stockOnHand: "0",
    region: "", categoryName: STATIC_CATEGORIES[0], sellerId: "",
    photos: [] as string[],
  });
  const [prodSubmitting, setProdSubmitting] = useState(false);

  // Edit Livestock inline
  const [editingLsId, setEditingLsId] = useState<string | null>(null);
  const [editLsDraft, setEditLsDraft] = useState({ title: "", priceRand: "", breed: "", weightKg: "", ageMonths: "", region: "", status: "ACTIVE", photos: [] as string[] });

  // Edit Product inline
  const [editingProdId, setEditingProdId] = useState<string | null>(null);
  const [editProdDraft, setEditProdDraft] = useState({ name: "", priceRand: "", stockOnHand: "", region: "", status: "ACTIVE", photos: [] as string[] });

  function showSuccess(msg: string) { setGlobalSuccess(msg); setTimeout(() => setGlobalSuccess(""), 4000); }

  async function seedCategories() {
    setSeeding(true); setGlobalError("");
    const res = await fetch("/api/admin/seed", { method: "POST" });
    const data = await res.json().catch(() => ({}));
    setSeeding(false);
    if (!res.ok) return setGlobalError(data.error || "Failed to seed categories.");
    setCategories(data.categories || []);
    showSuccess(`${data.created} categories seeded successfully!`);
  }

  async function quickAddSeller() {
    setGlobalError(""); setSellerSaving(true);
    const res = await fetch("/api/admin/sellers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(sellerDraft) });
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
    return item.title.toLowerCase().includes(q) || item.breed.toLowerCase().includes(q) || item.category.name.toLowerCase().includes(q) || item.seller.farmName.toLowerCase().includes(q);
  });
  const filteredProducts = products.filter((item) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return item.name.toLowerCase().includes(q) || item.category.name.toLowerCase().includes(q) || (item.seller?.farmName || "").toLowerCase().includes(q);
  });

  // Actions
  async function runAction(kind: "livestock" | "product", id: string, action: string, data?: Record<string, unknown>) {
    setGlobalError("");
    const res = await fetch("/api/admin/listings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind, id, action, data }) });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) { setGlobalError(d.error || "Action failed"); return false; }
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
    if (kind === "livestock") setLivestock((p) => p.map((x) => x.id === id ? { ...x, isFeatured: val } : x));
    else setProducts((p) => p.map((x) => x.id === id ? { ...x, isFeatured: val } : x));
  }

  async function approve(kind: "livestock" | "product", id: string) {
    const ok = await runAction(kind, id, "approve");
    if (!ok) return;
    if (kind === "livestock") setLivestock((p) => p.map((x) => x.id === id ? { ...x, status: "ACTIVE" } : x));
    else setProducts((p) => p.map((x) => x.id === id ? { ...x, status: "ACTIVE" } : x));
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
          title: lsForm.title.trim(), description: lsForm.description.trim(), priceCents,
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
    setLsForm({ title: "", description: "", priceRand: "", breed: "", weightKg: "", ageMonths: "", region: REGIONS[0], categoryName: STATIC_CATEGORIES[0], sellerName: "", sellerPhone: "", photos: [] });
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
          name: prodForm.name.trim(), description: prodForm.description.trim(), priceCents,
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
    setProdForm({ name: "", description: "", priceRand: "", stockOnHand: "0", region: "", categoryName: STATIC_CATEGORIES[0], sellerId: "", photos: [] });
    setShowAddProduct(false);
    showSuccess("Product created!");
  }

  // Save Edit Livestock
  async function saveEditLivestock(item: LivestockItem) {
    setGlobalError("");
    const priceCents = Math.round(parseFloat(editLsDraft.priceRand || "0") * 100);
    if (!editLsDraft.title.trim()) return setGlobalError("Title is required.");
    if (isNaN(priceCents) || priceCents < 0) return setGlobalError("Invalid price.");
    const ok = await runAction("livestock", item.id, "update", { title: editLsDraft.title.trim(), priceCents, region: editLsDraft.region, status: editLsDraft.status });
    if (!ok) return;
    setLivestock((p) => p.map((x) => x.id === item.id ? { ...x, title: editLsDraft.title.trim(), priceCents, region: editLsDraft.region, status: editLsDraft.status, breed: editLsDraft.breed, photos: editLsDraft.photos } : x));
    setEditingLsId(null);
    showSuccess("Listing updated.");
  }

  // Save Edit Product
  async function saveEditProduct(item: ProductItem) {
    setGlobalError("");
    const priceCents = Math.round(parseFloat(editProdDraft.priceRand || "0") * 100);
    if (!editProdDraft.name.trim()) return setGlobalError("Name is required.");
    if (isNaN(priceCents) || priceCents < 0) return setGlobalError("Invalid price.");
    const ok = await runAction("product", item.id, "update", { name: editProdDraft.name.trim(), priceCents, region: editProdDraft.region.trim() || null, stockOnHand: Number(editProdDraft.stockOnHand) || 0, status: editProdDraft.status });
    if (!ok) return;
    setProducts((p) => p.map((x) => x.id === item.id ? { ...x, name: editProdDraft.name.trim(), priceCents, region: editProdDraft.region || null, stockOnHand: Number(editProdDraft.stockOnHand) || 0, status: editProdDraft.status, photos: editProdDraft.photos } : x));
    setEditingProdId(null);
    showSuccess("Product updated.");
  }

  return (
    <section className="space-y-6">

      {/* ── Delete Confirmation Modal ──────────────────────────────────── */}
      {pendingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#e4ebf5] p-6 max-w-sm w-full mx-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <Trash2 size={18} className="text-red-700" />
              </div>
              <div>
                <h3 className="font-bold text-[#1B3A6B] text-base">Delete {pendingDelete.kind === "livestock" ? "Livestock Listing" : "Product"}?</h3>
                <p className="text-sm text-[#5d7497] mt-1">
                  Are you sure you want to delete <strong>&ldquo;{pendingDelete.name}&rdquo;</strong>?
                  This action cannot be undone.
                </p>
                {pendingDelete.kind === "product" && (
                  <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2 mt-2">
                    Any order history referencing this product will have its line items removed.
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-3 mt-5 justify-end">
              <button
                type="button"
                onClick={() => setPendingDelete(null)}
                className="px-5 py-2 rounded-lg border border-[#cdd8e7] text-sm font-semibold text-[#5d7497] hover:bg-[#f5f8fd] transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-5 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-bold transition"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      {globalError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 flex items-center justify-between">
          {globalError}<button onClick={() => setGlobalError("")}><X size={16} /></button>
        </div>
      )}
      {globalSuccess && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 flex items-center gap-2">
          <CheckCircle size={16} />{globalSuccess}
        </div>
      )}

      {/* ── Setup Banners ──────────────────────────────────────────────── */}
      {categories.length === 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="font-bold text-amber-800 text-sm">No categories found</p>
            <p className="text-amber-700 text-xs mt-0.5">Your database has no product categories. Click the button to seed the default categories (Cattle, Sheep, Goats, Equipment, etc.)</p>
          </div>
          <button type="button" disabled={seeding} onClick={seedCategories}
            className="flex-shrink-0 rounded-lg bg-amber-600 hover:bg-amber-700 px-4 py-2 text-sm font-bold text-white transition disabled:opacity-50">
            {seeding ? "Seeding…" : "Seed Default Categories"}
          </button>
        </div>
      )}

      {sellers.length === 0 && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="font-bold text-blue-800 text-sm">No sellers found</p>
            <p className="text-blue-700 text-xs mt-0.5">You need at least one seller to create livestock listings. Add a farmer/seller below or wait for sellers to register through the public site.</p>
          </div>
          <button type="button" onClick={() => setShowQuickSeller((v) => !v)}
            className="flex-shrink-0 rounded-lg bg-[#1B3A6B] hover:bg-[#122844] px-4 py-2 text-sm font-bold text-white transition">
            <Plus size={14} className="inline mr-1" />Add Seller
          </button>
        </div>
      )}

      {/* Quick-add seller inline panel */}
      {showQuickSeller && (
        <div className="rounded-2xl border border-[#d8e0ec] bg-white p-6 shadow-lg space-y-4">
          <h3 className="font-bold text-[#1B3A6B]">Add Seller / Farmer</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div><label className="block text-xs font-semibold text-[#244367] mb-1">Farm / Business Name *</label><input className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2 text-sm focus:outline-none focus:border-[#1B3A6B]" placeholder="e.g. Botha Family Farm" value={sellerDraft.farmName} onChange={(e) => setSellerDraft((p) => ({ ...p, farmName: e.target.value }))} /></div>
            <div><label className="block text-xs font-semibold text-[#244367] mb-1">Owner / Contact Name *</label><input className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2 text-sm focus:outline-none focus:border-[#1B3A6B]" placeholder="e.g. Pieter Botha" value={sellerDraft.ownerName} onChange={(e) => setSellerDraft((p) => ({ ...p, ownerName: e.target.value }))} /></div>
            <div><label className="block text-xs font-semibold text-[#244367] mb-1">Contact Phone</label><input className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2 text-sm focus:outline-none focus:border-[#1B3A6B]" placeholder="+27 82 000 0000" value={sellerDraft.contactPhone} onChange={(e) => setSellerDraft((p) => ({ ...p, contactPhone: e.target.value }))} /></div>
            <div><label className="block text-xs font-semibold text-[#244367] mb-1">Region *</label><select className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2 text-sm focus:outline-none focus:border-[#1B3A6B]" value={sellerDraft.region} onChange={(e) => setSellerDraft((p) => ({ ...p, region: e.target.value }))}>{REGIONS.map((r) => <option key={r}>{r}</option>)}</select></div>
          </div>
          <div className="flex gap-3">
            <button type="button" disabled={sellerSaving} onClick={quickAddSeller} className="rounded-lg bg-[#2E7D32] hover:bg-[#1d5e20] px-5 py-2 text-sm font-bold text-white transition disabled:opacity-50">{sellerSaving ? "Saving…" : "Create Seller"}</button>
            <button type="button" onClick={() => setShowQuickSeller(false)} className="rounded-lg border border-[#cdd8e7] px-5 py-2 text-sm text-[#5d7497] hover:bg-[#f5f8fd] transition">Cancel</button>
          </div>
        </div>
      )}

      {/* Tabs + search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex rounded-lg bg-[#ebf1f9] p-1">
          <button className={`rounded-md px-4 py-2 text-sm font-semibold transition ${activeTab === "livestock" ? "bg-white text-[#1B3A6B] shadow-sm" : "text-[#5d7497]"}`} onClick={() => setActiveTab("livestock")} type="button">Livestock ({livestock.length})</button>
          <button className={`rounded-md px-4 py-2 text-sm font-semibold transition ${activeTab === "products" ? "bg-white text-[#1B3A6B] shadow-sm" : "text-[#5d7497]"}`} onClick={() => setActiveTab("products")} type="button">Products ({products.length})</button>
        </div>
        <input className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2 text-sm sm:w-72 focus:outline-none focus:border-[#1B3A6B]" placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {/* ── LIVESTOCK TAB ───────────────────────────────────────────────── */}
      {activeTab === "livestock" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <button type="button" onClick={() => setShowQuickSeller((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#1B3A6B] text-[#1B3A6B] hover:bg-[#f0f5ff] px-4 py-2 text-sm font-semibold transition">
              <Plus size={14} /> Add Seller
            </button>
            <button type="button" onClick={() => { setShowAddLivestock((v) => !v); setShowAddProduct(false); }}
              className="inline-flex items-center gap-2 rounded-lg bg-[#2E7D32] hover:bg-[#1d5e20] px-5 py-2.5 text-sm font-bold text-white shadow transition">
              <Plus size={16} /> Add New Livestock Listing
            </button>
          </div>

          {showAddLivestock && (
            <div className="rounded-2xl border border-[#d8e0ec] bg-white p-6 shadow-lg space-y-5">
              <h3 className="text-lg font-bold text-[#1B3A6B]">New Livestock Listing</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#244367] mb-1">Title *</label>
                  <input className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2 text-sm focus:outline-none focus:border-[#1B3A6B]" placeholder="e.g. 10 Angus Breeding Cows" value={lsForm.title} onChange={(e) => setLsForm((p) => ({ ...p, title: e.target.value }))} />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#244367] mb-1">Description *</label>
                  <textarea rows={3} className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2 text-sm focus:outline-none focus:border-[#1B3A6B] resize-none" placeholder="Health status, feeding, vaccinations…" value={lsForm.description} onChange={(e) => setLsForm((p) => ({ ...p, description: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#244367] mb-1">Price (R) *</label>
                  <input type="number" min="0" step="0.01" className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2 text-sm focus:outline-none focus:border-[#1B3A6B]" placeholder="e.g. 15000" value={lsForm.priceRand} onChange={(e) => setLsForm((p) => ({ ...p, priceRand: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#244367] mb-1">Breed *</label>
                  <input className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2 text-sm focus:outline-none focus:border-[#1B3A6B]" placeholder="e.g. Angus, Hereford, Brahman" value={lsForm.breed} onChange={(e) => setLsForm((p) => ({ ...p, breed: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#244367] mb-1">Weight (kg)</label>
                  <input type="number" min="0" className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2 text-sm focus:outline-none focus:border-[#1B3A6B]" placeholder="e.g. 450" value={lsForm.weightKg} onChange={(e) => setLsForm((p) => ({ ...p, weightKg: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#244367] mb-1">Age (months)</label>
                  <input type="number" min="0" className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2 text-sm focus:outline-none focus:border-[#1B3A6B]" placeholder="e.g. 36" value={lsForm.ageMonths} onChange={(e) => setLsForm((p) => ({ ...p, ageMonths: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#244367] mb-1">Region *</label>
                  <select className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2 text-sm focus:outline-none focus:border-[#1B3A6B]" value={lsForm.region} onChange={(e) => setLsForm((p) => ({ ...p, region: e.target.value }))}>
                    {REGIONS.map((r) => <option key={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#244367] mb-1">Category *</label>
                  <select className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2 text-sm focus:outline-none focus:border-[#1B3A6B]"
                    value={lsForm.categoryName} onChange={(e) => setLsForm((p) => ({ ...p, categoryName: e.target.value }))}>
                    {(categories.length > 0 ? categories.map((c) => c.name) : STATIC_CATEGORIES).map((n) => <option key={n}>{n}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#244367] mb-1">Seller / Farm Name *</label>
                  <input className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2 text-sm focus:outline-none focus:border-[#1B3A6B]"
                    placeholder="e.g. Botha Family Farm"
                    value={lsForm.sellerName} onChange={(e) => setLsForm((p) => ({ ...p, sellerName: e.target.value }))} />
                  <p className="text-[10px] text-[#5d7497] mt-1">Seller will be created automatically if they don&apos;t exist yet.</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#244367] mb-1">Seller Phone (optional)</label>
                  <input className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2 text-sm focus:outline-none focus:border-[#1B3A6B]"
                    placeholder="+27 82 000 0000"
                    value={lsForm.sellerPhone} onChange={(e) => setLsForm((p) => ({ ...p, sellerPhone: e.target.value }))} />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#244367] mb-2">Photos</label>
                  <PhotoUploader photos={lsForm.photos} onChange={(urls) => setLsForm((p) => ({ ...p, photos: urls }))} />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" disabled={lsSubmitting} onClick={submitAddLivestock} className="flex-1 rounded-lg bg-[#2E7D32] hover:bg-[#1d5e20] px-5 py-3 text-sm font-bold text-white transition disabled:opacity-50">{lsSubmitting ? "Creating…" : "Create Livestock Listing"}</button>
                <button type="button" onClick={() => setShowAddLivestock(false)} className="rounded-lg border border-[#cdd8e7] px-5 py-3 text-sm font-semibold text-[#5d7497] hover:bg-[#f5f8fd] transition">Cancel</button>
              </div>
            </div>
          )}

          {filteredLivestock.length === 0 ? (
            <div className="rounded-2xl border border-[#e4ebf5] bg-white p-12 text-center">
              <ImageIcon size={48} className="mx-auto text-[#cdd8e7] mb-3" />
              <p className="text-[#5d7497]">No livestock listings yet. Click &ldquo;Add New Livestock Listing&rdquo; to create one.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredLivestock.map((item) => (
                <div key={item.id} className="rounded-2xl border border-[#e4ebf5] bg-white p-5 shadow-sm">
                  {editingLsId === item.id ? (
                    <div className="space-y-4">
                      <h4 className="font-bold text-[#1B3A6B]">Editing: {item.title}</h4>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="sm:col-span-2"><label className="block text-xs font-semibold text-[#244367] mb-1">Title</label><input className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2 text-sm focus:outline-none focus:border-[#1B3A6B]" value={editLsDraft.title} onChange={(e) => setEditLsDraft((p) => ({ ...p, title: e.target.value }))} /></div>
                        <div><label className="block text-xs font-semibold text-[#244367] mb-1">Price (R)</label><input type="number" min="0" step="0.01" className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2 text-sm focus:outline-none focus:border-[#1B3A6B]" value={editLsDraft.priceRand} onChange={(e) => setEditLsDraft((p) => ({ ...p, priceRand: e.target.value }))} /></div>
                        <div><label className="block text-xs font-semibold text-[#244367] mb-1">Breed</label><input className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2 text-sm focus:outline-none focus:border-[#1B3A6B]" value={editLsDraft.breed} onChange={(e) => setEditLsDraft((p) => ({ ...p, breed: e.target.value }))} /></div>
                        <div><label className="block text-xs font-semibold text-[#244367] mb-1">Region</label><select className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2 text-sm focus:outline-none focus:border-[#1B3A6B]" value={editLsDraft.region} onChange={(e) => setEditLsDraft((p) => ({ ...p, region: e.target.value }))}>{REGIONS.map((r) => <option key={r}>{r}</option>)}</select></div>
                        <div><label className="block text-xs font-semibold text-[#244367] mb-1">Status</label><select className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2 text-sm focus:outline-none focus:border-[#1B3A6B]" value={editLsDraft.status} onChange={(e) => setEditLsDraft((p) => ({ ...p, status: e.target.value }))}>{STATUSES_LIVESTOCK.map((s) => <option key={s}>{s}</option>)}</select></div>
                        <div className="sm:col-span-2"><label className="block text-xs font-semibold text-[#244367] mb-2">Photos</label><PhotoUploader photos={editLsDraft.photos} onChange={(urls) => setEditLsDraft((p) => ({ ...p, photos: urls }))} /></div>
                      </div>
                      <div className="flex gap-3"><button type="button" onClick={() => saveEditLivestock(item)} className="rounded-lg bg-[#1B3A6B] hover:bg-[#122844] px-5 py-2 text-sm font-bold text-white transition">Save Changes</button><button type="button" onClick={() => setEditingLsId(null)} className="rounded-lg border border-[#cdd8e7] px-5 py-2 text-sm text-[#5d7497] hover:bg-[#f5f8fd] transition">Cancel</button></div>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      {item.photos[0]
                        ? <img src={item.photos[0]} alt={item.title} className="w-20 h-16 rounded-lg object-cover border border-[#e4ebf5] flex-shrink-0" />
                        : <div className="w-20 h-16 rounded-lg bg-[#f0f5ff] border border-[#e4ebf5] flex items-center justify-center flex-shrink-0"><ImageIcon size={20} className="text-[#cdd8e7]" /></div>}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-[#1B3A6B] truncate">{item.title}</p>
                        <p className="text-xs text-[#5d7497]">{item.category.name} • {item.region} • {item.seller.farmName}</p>
                        <p className="text-xs text-[#5d7497]">Breed: {item.breed}{item.weightKg ? ` • ${item.weightKg}kg` : ""}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <p className="font-bold text-[#2E7D32]">{zar(item.priceCents)}</p>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${item.status === "ACTIVE" ? "bg-green-100 text-green-800" : item.status === "SOLD" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-600"}`}>{item.status}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {item.status !== "ACTIVE" && <button type="button" onClick={() => approve("livestock", item.id)} title="Approve" className="p-2 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition"><CheckCircle size={16} /></button>}
                        <button type="button" onClick={() => toggleFeatured("livestock", item.id, !item.isFeatured)} className={`p-2 rounded-lg transition ${item.isFeatured ? "bg-amber-100 text-amber-700" : "bg-gray-50 text-gray-400"}`}><Star size={16} fill={item.isFeatured ? "currentColor" : "none"} /></button>
                        <button type="button" onClick={() => { setEditingLsId(item.id); setEditLsDraft({ title: item.title, priceRand: String(item.priceCents / 100), breed: item.breed, weightKg: item.weightKg ? String(item.weightKg) : "", ageMonths: item.ageMonths ? String(item.ageMonths) : "", region: item.region, status: item.status, photos: [...item.photos] }); }} className="p-2 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition"><Pencil size={16} /></button>
                        <button type="button" onClick={() => requestDelete("livestock", item.id, item.title)} disabled={deletingId === item.id} className="p-2 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 transition disabled:opacity-50">
                          {deletingId === item.id ? <div className="w-4 h-4 border-2 border-red-700 border-t-transparent rounded-full animate-spin" /> : <Trash2 size={16} />}
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
            <button type="button" onClick={() => { setShowAddProduct((v) => !v); setShowAddLivestock(false); }}
              className="inline-flex items-center gap-2 rounded-lg bg-[#1B3A6B] hover:bg-[#122844] px-5 py-2.5 text-sm font-bold text-white shadow transition">
              <Plus size={16} /> Add New Product
            </button>
          </div>

          {showAddProduct && (
            <div className="rounded-2xl border border-[#d8e0ec] bg-white p-6 shadow-lg space-y-5">
              <h3 className="text-lg font-bold text-[#1B3A6B]">New Shop Product</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2"><label className="block text-xs font-semibold text-[#244367] mb-1">Product Name *</label><input className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2 text-sm focus:outline-none focus:border-[#1B3A6B]" placeholder="e.g. Protein Livestock Feed 50kg" value={prodForm.name} onChange={(e) => setProdForm((p) => ({ ...p, name: e.target.value }))} /></div>
                <div className="sm:col-span-2"><label className="block text-xs font-semibold text-[#244367] mb-1">Description *</label><textarea rows={3} className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2 text-sm focus:outline-none focus:border-[#1B3A6B] resize-none" placeholder="Describe the product" value={prodForm.description} onChange={(e) => setProdForm((p) => ({ ...p, description: e.target.value }))} /></div>
                <div><label className="block text-xs font-semibold text-[#244367] mb-1">Price (R) *</label><input type="number" min="0" step="0.01" className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2 text-sm focus:outline-none focus:border-[#1B3A6B]" placeholder="e.g. 299.99" value={prodForm.priceRand} onChange={(e) => setProdForm((p) => ({ ...p, priceRand: e.target.value }))} /></div>
                <div><label className="block text-xs font-semibold text-[#244367] mb-1">Stock on Hand</label><input type="number" min="0" className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2 text-sm focus:outline-none focus:border-[#1B3A6B]" placeholder="0" value={prodForm.stockOnHand} onChange={(e) => setProdForm((p) => ({ ...p, stockOnHand: e.target.value }))} /></div>
                <div><label className="block text-xs font-semibold text-[#244367] mb-1">Region (optional)</label><select className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2 text-sm focus:outline-none focus:border-[#1B3A6B]" value={prodForm.region} onChange={(e) => setProdForm((p) => ({ ...p, region: e.target.value }))}><option value="">— All Regions —</option>{REGIONS.map((r) => <option key={r}>{r}</option>)}</select></div>
                <div>
                  <label className="block text-xs font-semibold text-[#244367] mb-1">Category *</label>
                  <select className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2 text-sm focus:outline-none focus:border-[#1B3A6B]"
                    value={prodForm.categoryName} onChange={(e) => setProdForm((p) => ({ ...p, categoryName: e.target.value }))}>
                    {(categories.length > 0 ? categories.map((c) => c.name) : STATIC_CATEGORIES).map((n) => <option key={n}>{n}</option>)}
                  </select>
                </div>
                <div><label className="block text-xs font-semibold text-[#244367] mb-1">Seller (optional)</label><select className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2 text-sm focus:outline-none focus:border-[#1B3A6B]" value={prodForm.sellerId} onChange={(e) => setProdForm((p) => ({ ...p, sellerId: e.target.value }))}><option value="">— HerdFlow Direct —</option>{sellers.map((s) => <option key={s.id} value={s.id}>{s.farmName}</option>)}</select></div>
                <div className="sm:col-span-2"><label className="block text-xs font-semibold text-[#244367] mb-2">Photos</label><PhotoUploader photos={prodForm.photos} onChange={(urls) => setProdForm((p) => ({ ...p, photos: urls }))} /></div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" disabled={prodSubmitting} onClick={submitAddProduct} className="flex-1 rounded-lg bg-[#1B3A6B] hover:bg-[#122844] px-5 py-3 text-sm font-bold text-white transition disabled:opacity-50">{prodSubmitting ? "Creating…" : "Create Product"}</button>
                <button type="button" onClick={() => setShowAddProduct(false)} className="rounded-lg border border-[#cdd8e7] px-5 py-3 text-sm font-semibold text-[#5d7497] hover:bg-[#f5f8fd] transition">Cancel</button>
              </div>
            </div>
          )}

          {filteredProducts.length === 0 ? (
            <div className="rounded-2xl border border-[#e4ebf5] bg-white p-12 text-center">
              <ImageIcon size={48} className="mx-auto text-[#cdd8e7] mb-3" />
              <p className="text-[#5d7497]">No products yet. Click &ldquo;Add New Product&rdquo; to create one.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredProducts.map((item) => (
                <div key={item.id} className="rounded-2xl border border-[#e4ebf5] bg-white p-5 shadow-sm">
                  {editingProdId === item.id ? (
                    <div className="space-y-4">
                      <h4 className="font-bold text-[#1B3A6B]">Editing: {item.name}</h4>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="sm:col-span-2"><label className="block text-xs font-semibold text-[#244367] mb-1">Name</label><input className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2 text-sm focus:outline-none focus:border-[#1B3A6B]" value={editProdDraft.name} onChange={(e) => setEditProdDraft((p) => ({ ...p, name: e.target.value }))} /></div>
                        <div><label className="block text-xs font-semibold text-[#244367] mb-1">Price (R)</label><input type="number" min="0" step="0.01" className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2 text-sm focus:outline-none focus:border-[#1B3A6B]" value={editProdDraft.priceRand} onChange={(e) => setEditProdDraft((p) => ({ ...p, priceRand: e.target.value }))} /></div>
                        <div><label className="block text-xs font-semibold text-[#244367] mb-1">Stock</label><input type="number" min="0" className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2 text-sm focus:outline-none focus:border-[#1B3A6B]" value={editProdDraft.stockOnHand} onChange={(e) => setEditProdDraft((p) => ({ ...p, stockOnHand: e.target.value }))} /></div>
                        <div><label className="block text-xs font-semibold text-[#244367] mb-1">Region</label><select className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2 text-sm focus:outline-none focus:border-[#1B3A6B]" value={editProdDraft.region} onChange={(e) => setEditProdDraft((p) => ({ ...p, region: e.target.value }))}><option value="">— All Regions —</option>{REGIONS.map((r) => <option key={r}>{r}</option>)}</select></div>
                        <div><label className="block text-xs font-semibold text-[#244367] mb-1">Status</label><select className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2 text-sm focus:outline-none focus:border-[#1B3A6B]" value={editProdDraft.status} onChange={(e) => setEditProdDraft((p) => ({ ...p, status: e.target.value }))}>{STATUSES_PRODUCT.map((s) => <option key={s}>{s}</option>)}</select></div>
                        <div className="sm:col-span-2"><label className="block text-xs font-semibold text-[#244367] mb-2">Photos</label><PhotoUploader photos={editProdDraft.photos} onChange={(urls) => setEditProdDraft((p) => ({ ...p, photos: urls }))} /></div>
                      </div>
                      <div className="flex gap-3"><button type="button" onClick={() => saveEditProduct(item)} className="rounded-lg bg-[#1B3A6B] hover:bg-[#122844] px-5 py-2 text-sm font-bold text-white transition">Save Changes</button><button type="button" onClick={() => setEditingProdId(null)} className="rounded-lg border border-[#cdd8e7] px-5 py-2 text-sm text-[#5d7497] hover:bg-[#f5f8fd] transition">Cancel</button></div>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      {item.photos[0]
                        ? <img src={item.photos[0]} alt={item.name} className="w-20 h-16 rounded-lg object-cover border border-[#e4ebf5] flex-shrink-0" />
                        : <div className="w-20 h-16 rounded-lg bg-[#f0f5ff] border border-[#e4ebf5] flex items-center justify-center flex-shrink-0"><ImageIcon size={20} className="text-[#cdd8e7]" /></div>}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-[#1B3A6B] truncate">{item.name}</p>
                        <p className="text-xs text-[#5d7497]">{item.category.name}{item.seller ? ` • ${item.seller.farmName}` : ""}</p>
                        <p className="text-xs text-[#5d7497]">Stock: {item.stockOnHand}{item.region ? ` • ${item.region}` : ""}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <p className="font-bold text-[#2E7D32]">{zar(item.priceCents)}</p>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${item.status === "ACTIVE" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}>{item.status}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {item.status !== "ACTIVE" && <button type="button" onClick={() => approve("product", item.id)} title="Approve" className="p-2 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition"><CheckCircle size={16} /></button>}
                        <button type="button" onClick={() => toggleFeatured("product", item.id, !item.isFeatured)} className={`p-2 rounded-lg transition ${item.isFeatured ? "bg-amber-100 text-amber-700" : "bg-gray-50 text-gray-400"}`}><Star size={16} fill={item.isFeatured ? "currentColor" : "none"} /></button>
                        <button type="button" onClick={() => { setEditingProdId(item.id); setEditProdDraft({ name: item.name, priceRand: String(item.priceCents / 100), stockOnHand: String(item.stockOnHand), region: item.region || "", status: item.status, photos: [...item.photos] }); }} className="p-2 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition"><Pencil size={16} /></button>
                        <button type="button" onClick={() => requestDelete("product", item.id, item.name)} disabled={deletingId === item.id} className="p-2 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 transition disabled:opacity-50">
                          {deletingId === item.id ? <div className="w-4 h-4 border-2 border-red-700 border-t-transparent rounded-full animate-spin" /> : <Trash2 size={16} />}
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
