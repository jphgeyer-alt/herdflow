"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Card, CardHeader } from "@/components/admin/Card";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/admin/Table";
import { TableEmptyRow } from "@/components/admin/EmptyState";
import { TableSkeletonRows } from "@/components/admin/Skeleton";
import { Badge } from "@/components/admin/Badge";
import { Button } from "@/components/admin/Button";
import { Input, Textarea } from "@/components/admin/Field";
import { Modal } from "@/components/admin/Modal";
import { SingleImageUpload } from "@/components/ui/SingleImageUpload";

type ProductRow = {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: string;
  coverImage: string | null;
  fileKey: string;
  fileName: string;
  category: string;
  salesCount: number;
  isActive: boolean;
  _count: { purchases: number };
};

function ProductModal({
  product,
  onClose,
  onSaved,
  onCreated,
}: {
  product: ProductRow | null;
  onClose: () => void;
  onSaved: (updated: ProductRow) => void;
  onCreated: (created: ProductRow) => void;
}) {
  const [title, setTitle] = useState(product?.title ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [price, setPrice] = useState(product?.price ?? "0");
  const [category, setCategory] = useState(product?.category ?? "Templates");
  const [coverImage, setCoverImage] = useState<string | null>(product?.coverImage ?? null);
  const [fileKey, setFileKey] = useState(product?.fileKey ?? "");
  const [fileName, setFileName] = useState(product?.fileName ?? "");
  const [fileType, setFileType] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function uploadFile(file: File) {
    setUploading(true);
    setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/admin/digital-products/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to upload file.");
        return;
      }
      setFileKey(data.key);
      setFileName(data.fileName);
      setFileType(data.fileType);
    } catch {
      setError("Network error uploading file.");
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    setError("");
    if (!title.trim() || !description.trim() || !category.trim()) {
      setError("Title, description, and category are required.");
      return;
    }
    if (!product && !fileKey) {
      setError("Please upload a file.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title,
        description,
        price: Number(price),
        category,
        coverImage,
        ...(fileKey && { fileKey, fileName, fileType }),
      };
      const res = await fetch(product ? `/api/admin/digital-products/${product.id}` : "/api/admin/digital-products", {
        method: product ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to save.");
        return;
      }
      if (product) onSaved(data.product);
      else onCreated(data.product);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={product ? "Edit Product" : "New Digital Product"}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button variant="secondary" onClick={save} loading={saving}>
            Save
          </Button>
        </>
      }
    >
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}
      <div className="space-y-4">
        <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <Textarea label="Description" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Price (R)" type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
          <Input label="Category" value={category} onChange={(e) => setCategory(e.target.value)} />
        </div>
        <SingleImageUpload label="Cover Image" value={coverImage} onChange={setCoverImage} aspectRatio="16/9" />
        <div>
          <span className="mb-1 block text-sm font-semibold text-navy-500">
            Downloadable File {product ? "(leave blank to keep existing)" : "*"}
          </span>
          <input
            ref={fileInputRef}
            type="file"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) uploadFile(f);
            }}
            className="block w-full text-sm text-navy-500"
          />
          {uploading && <p className="mt-1 text-xs text-navy-300">Uploading…</p>}
          {fileName && !uploading && <p className="mt-1 text-xs text-navy-400">Uploaded: {fileName}</p>}
        </div>
      </div>
    </Modal>
  );
}

export default function AdminDigitalProductsPage() {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editTarget, setEditTarget] = useState<ProductRow | null | "new">(null);

  function load() {
    fetch("/api/admin/digital-products")
      .then((r) => r.json())
      .then((d) => setProducts(d.products || []))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function toggleActive(p: ProductRow) {
    const res = await fetch(`/api/admin/digital-products/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !p.isActive }),
    });
    const data = await res.json();
    if (res.ok) {
      setProducts((prev) => prev.map((x) => (x.id === p.id ? data.product : x)));
    } else {
      toast.error(data.error || "Failed to update product.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-navy-600">Digital Products</h1>
          <p className="mt-1 text-sm text-navy-400">Templates, record books, contracts, and guides.</p>
        </div>
        <Button onClick={() => setEditTarget("new")}>+ New Product</Button>
      </div>

      <Card>
        <CardHeader title="All Products" />
        <Table>
          <Thead>
            <Tr>
              <Th>Title</Th>
              <Th>Category</Th>
              <Th align="right">Price</Th>
              <Th align="right">Sales</Th>
              <Th>Status</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {loading ? (
              <TableSkeletonRows rows={4} cols={6} />
            ) : products.length === 0 ? (
              <TableEmptyRow colSpan={6} message="No digital products yet." />
            ) : (
              products.map((p) => (
                <Tr key={p.id}>
                  <Td className="font-semibold text-navy-600">{p.title}</Td>
                  <Td>{p.category}</Td>
                  <Td align="right">R{Number(p.price).toFixed(2)}</Td>
                  <Td align="right">{p.salesCount}</Td>
                  <Td>
                    <Badge variant={p.isActive ? "success" : "neutral"}>{p.isActive ? "Active" : "Inactive"}</Badge>
                  </Td>
                  <Td>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => setEditTarget(p)}>
                        Edit
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => toggleActive(p)}>
                        {p.isActive ? "Deactivate" : "Activate"}
                      </Button>
                      <Link
                        href={`/admin/digital-products/${p.id}/purchases`}
                        className="inline-flex items-center rounded-lg border border-navy-100 px-3 py-1.5 text-xs font-semibold text-navy-600 hover:bg-navy-25"
                      >
                        Sales ({p._count.purchases})
                      </Link>
                    </div>
                  </Td>
                </Tr>
              ))
            )}
          </Tbody>
        </Table>
      </Card>

      {editTarget && (
        <ProductModal
          product={editTarget === "new" ? null : editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={(updated) => setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))}
          onCreated={(created) => setProducts((prev) => [created, ...prev])}
        />
      )}
    </div>
  );
}
