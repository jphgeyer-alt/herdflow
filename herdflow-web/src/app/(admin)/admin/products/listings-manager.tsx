"use client";

import { useMemo, useState } from "react";

type LivestockItem = {
  id: string;
  title: string;
  priceCents: number;
  region: string;
  status: string;
  isFeatured: boolean;
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
  category: { name: string };
  seller: { farmName: string } | null;
};

type ListingsManagerProps = {
  initialLivestock: LivestockItem[];
  initialProducts: ProductItem[];
};

function toCurrency(cents: number) {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

export function ListingsManager({ initialLivestock, initialProducts }: ListingsManagerProps) {
  const [livestock, setLivestock] = useState(initialLivestock);
  const [products, setProducts] = useState(initialProducts);
  const [activeTab, setActiveTab] = useState<"livestock" | "products">("livestock");
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  const filteredLivestock = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) {
      return livestock;
    }

    return livestock.filter((item) => {
      return (
        item.title.toLowerCase().includes(q) ||
        item.category.name.toLowerCase().includes(q) ||
        item.seller.farmName.toLowerCase().includes(q)
      );
    });
  }, [livestock, search]);

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) {
      return products;
    }

    return products.filter((item) => {
      return (
        item.name.toLowerCase().includes(q) ||
        item.category.name.toLowerCase().includes(q) ||
        (item.seller?.farmName || "").toLowerCase().includes(q)
      );
    });
  }, [products, search]);

  async function runAction(
    kind: "livestock" | "product",
    id: string,
    action: "approve" | "update" | "feature" | "delete",
    data?: Record<string, unknown>,
  ) {
    setError(null);

    const response = await fetch("/api/admin/listings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, id, action, data }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      setError(typeof payload.error === "string" ? payload.error : "Action failed.");
      return false;
    }

    return true;
  }

  async function approve(kind: "livestock" | "product", id: string) {
    const ok = await runAction(kind, id, "approve");
    if (!ok) {
      return;
    }

    if (kind === "livestock") {
      setLivestock((prev) => prev.map((item) => (item.id === id ? { ...item, status: "ACTIVE" } : item)));
    } else {
      setProducts((prev) => prev.map((item) => (item.id === id ? { ...item, status: "ACTIVE" } : item)));
    }
  }

  async function toggleFeatured(kind: "livestock" | "product", id: string, nextValue: boolean) {
    const ok = await runAction(kind, id, "feature", { isFeatured: nextValue });
    if (!ok) {
      return;
    }

    if (kind === "livestock") {
      setLivestock((prev) => prev.map((item) => (item.id === id ? { ...item, isFeatured: nextValue } : item)));
    } else {
      setProducts((prev) => prev.map((item) => (item.id === id ? { ...item, isFeatured: nextValue } : item)));
    }
  }

  async function remove(kind: "livestock" | "product", id: string) {
    const ok = await runAction(kind, id, "delete");
    if (!ok) {
      return;
    }

    if (kind === "livestock") {
      setLivestock((prev) => prev.filter((item) => item.id !== id));
    } else {
      setProducts((prev) => prev.filter((item) => item.id !== id));
    }
  }

  async function editLivestock(item: LivestockItem) {
    const nextTitle = window.prompt("Listing title", item.title);
    if (!nextTitle) {
      return;
    }

    const nextPrice = window.prompt("Price in cents", String(item.priceCents));
    if (!nextPrice) {
      return;
    }

    const parsedPrice = Number.parseInt(nextPrice, 10);
    if (!Number.isInteger(parsedPrice) || parsedPrice < 0) {
      setError("Price must be a positive integer in cents.");
      return;
    }

    const ok = await runAction("livestock", item.id, "update", {
      title: nextTitle,
      priceCents: parsedPrice,
      region: item.region,
      status: item.status,
    });

    if (!ok) {
      return;
    }

    setLivestock((prev) => prev.map((entry) => (entry.id === item.id ? { ...entry, title: nextTitle, priceCents: parsedPrice } : entry)));
  }

  async function editProduct(item: ProductItem) {
    const nextName = window.prompt("Product name", item.name);
    if (!nextName) {
      return;
    }

    const nextPrice = window.prompt("Price in cents", String(item.priceCents));
    if (!nextPrice) {
      return;
    }

    const parsedPrice = Number.parseInt(nextPrice, 10);
    if (!Number.isInteger(parsedPrice) || parsedPrice < 0) {
      setError("Price must be a positive integer in cents.");
      return;
    }

    const ok = await runAction("product", item.id, "update", {
      name: nextName,
      priceCents: parsedPrice,
      region: item.region,
      stockOnHand: item.stockOnHand,
      status: item.status,
    });

    if (!ok) {
      return;
    }

    setProducts((prev) => prev.map((entry) => (entry.id === item.id ? { ...entry, name: nextName, priceCents: parsedPrice } : entry)));
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex rounded-lg bg-[#ebf1f9] p-1">
          <button
            className={`rounded-md px-3 py-1 text-sm font-semibold ${activeTab === "livestock" ? "bg-white text-brand-navy" : "text-[#5d7497]"}`}
            onClick={() => setActiveTab("livestock")}
            type="button"
          >
            Livestock Listings
          </button>
          <button
            className={`rounded-md px-3 py-1 text-sm font-semibold ${activeTab === "products" ? "bg-white text-brand-navy" : "text-[#5d7497]"}`}
            onClick={() => setActiveTab("products")}
            type="button"
          >
            Products
          </button>
        </div>

        <input
          className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2 text-sm sm:w-72"
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search title, category, seller"
          value={search}
        />
      </div>

      {error && (
        <p aria-live="polite" className="text-sm font-semibold text-[#8b1f1f]" role="status">
          {error}
        </p>
      )}

      {activeTab === "livestock" ? (
        <div className="space-y-3">
          {filteredLivestock.map((item) => (
            <article key={item.id} className="rounded-xl border border-[#d8e0ec] bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#5d7497]">{item.category.name}</p>
                  <h3 className="text-lg font-semibold text-brand-navy">{item.title}</h3>
                  <p className="text-sm text-[#38537a]">Seller: {item.seller.farmName}</p>
                  <p className="text-sm text-[#38537a]">{toCurrency(item.priceCents)} • {item.region}</p>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#5d7497]">Status: {item.status}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button className="rounded-md border border-[#cdd8e7] px-3 py-1 text-sm" onClick={() => editLivestock(item)} type="button">
                    Edit
                  </button>
                  <button className="rounded-md border border-[#cdd8e7] px-3 py-1 text-sm" onClick={() => approve("livestock", item.id)} type="button">
                    Approve
                  </button>
                  <button
                    className="rounded-md border border-[#cdd8e7] px-3 py-1 text-sm"
                    onClick={() => toggleFeatured("livestock", item.id, !item.isFeatured)}
                    type="button"
                  >
                    {item.isFeatured ? "Unfeature" : "Feature"}
                  </button>
                  <button className="rounded-md border border-[#e4cbc8] px-3 py-1 text-sm text-[#8b1f1f]" onClick={() => remove("livestock", item.id)} type="button">
                    Delete
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredProducts.map((item) => (
            <article key={item.id} className="rounded-xl border border-[#d8e0ec] bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#5d7497]">{item.category.name}</p>
                  <h3 className="text-lg font-semibold text-brand-navy">{item.name}</h3>
                  <p className="text-sm text-[#38537a]">Seller: {item.seller?.farmName || "HerdFlow Supply"}</p>
                  <p className="text-sm text-[#38537a]">{toCurrency(item.priceCents)} • Stock: {item.stockOnHand}</p>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#5d7497]">Status: {item.status}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button className="rounded-md border border-[#cdd8e7] px-3 py-1 text-sm" onClick={() => editProduct(item)} type="button">
                    Edit
                  </button>
                  <button className="rounded-md border border-[#cdd8e7] px-3 py-1 text-sm" onClick={() => approve("product", item.id)} type="button">
                    Approve
                  </button>
                  <button
                    className="rounded-md border border-[#cdd8e7] px-3 py-1 text-sm"
                    onClick={() => toggleFeatured("product", item.id, !item.isFeatured)}
                    type="button"
                  >
                    {item.isFeatured ? "Unfeature" : "Feature"}
                  </button>
                  <button className="rounded-md border border-[#e4cbc8] px-3 py-1 text-sm text-[#8b1f1f]" onClick={() => remove("product", item.id)} type="button">
                    Delete
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
