"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Card, CardHeader } from "@/components/admin/Card";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/admin/Table";
import { TableEmptyRow } from "@/components/admin/EmptyState";
import { Badge } from "@/components/admin/Badge";
import { Button } from "@/components/admin/Button";

type PurchaseRow = {
  id: string;
  buyerEmail: string;
  buyerName: string | null;
  status: string;
  downloadCount: number;
  maxDownloads: number;
  expiresAt: string;
  createdAt: string;
};

export default function DigitalProductPurchasesPage() {
  const params = useParams<{ id: string }>();
  const [purchases, setPurchases] = useState<PurchaseRow[]>([]);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    fetch(`/api/admin/digital-products/${params.id}/purchases`)
      .then((r) => r.json())
      .then((d) => setPurchases(d.purchases || []))
      .finally(() => setLoading(false));
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(load, [params.id]);

  async function resend(id: string) {
    const res = await fetch(`/api/admin/digital-purchases/${id}/resend`, { method: "POST" });
    if (res.ok) toast.success("Email resent.");
    else toast.error("Failed to resend email.");
  }

  async function regenerate(id: string) {
    const res = await fetch(`/api/admin/digital-purchases/${id}/regenerate`, { method: "POST" });
    if (res.ok) {
      toast.success("Token regenerated and emailed.");
      load();
    } else {
      toast.error("Failed to regenerate token.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-navy-600">Purchases</h1>
        <Link href="/admin/digital-products" className="text-sm text-green hover:underline">
          ← Digital Products
        </Link>
      </div>

      <Card>
        <CardHeader title="Buyers" />
        <Table>
          <Thead>
            <Tr>
              <Th>Buyer</Th>
              <Th>Status</Th>
              <Th align="right">Downloads</Th>
              <Th>Expires</Th>
              <Th>Purchased</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {loading ? (
              <TableEmptyRow colSpan={6} message="Loading…" />
            ) : purchases.length === 0 ? (
              <TableEmptyRow colSpan={6} message="No purchases yet." />
            ) : (
              purchases.map((p) => (
                <Tr key={p.id}>
                  <Td>
                    <div className="font-semibold text-navy-600">{p.buyerName || "—"}</div>
                    <div className="text-xs text-navy-300">{p.buyerEmail}</div>
                  </Td>
                  <Td>
                    <Badge variant={p.status === "COMPLETE" ? "success" : "warning"}>{p.status}</Badge>
                  </Td>
                  <Td align="right">
                    {p.downloadCount} / {p.maxDownloads}
                  </Td>
                  <Td>{new Date(p.expiresAt).toLocaleDateString("en-ZA")}</Td>
                  <Td>{new Date(p.createdAt).toLocaleDateString("en-ZA")}</Td>
                  <Td>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => resend(p.id)}>
                        Resend
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => regenerate(p.id)}>
                        Regenerate
                      </Button>
                    </div>
                  </Td>
                </Tr>
              ))
            )}
          </Tbody>
        </Table>
      </Card>
    </div>
  );
}
