"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardHeader } from "@/components/admin/Card";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/admin/Table";
import { TableEmptyRow } from "@/components/admin/EmptyState";
import { TableSkeletonRows } from "@/components/admin/Skeleton";
import { Badge } from "@/components/admin/Badge";
import { Button } from "@/components/admin/Button";
import { Select } from "@/components/admin/Field";

type ListingRow = {
  id: string;
  businessName: string;
  category: string;
  contactName: string;
  phone: string;
  email: string | null;
  plan: string;
  status: string;
  verified: boolean;
  subscriptionActive: boolean;
  renewsAt: string | null;
  views: number;
  createdAt: string;
};

export default function AdminDirectoryPage() {
  const [listings, setListings] = useState<ListingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");

  function load() {
    const qs = statusFilter === "ALL" ? "" : `?status=${statusFilter}`;
    fetch(`/api/admin/directory${qs}`)
      .then((r) => r.json())
      .then((d) => setListings(d.listings || []))
      .finally(() => setLoading(false));
  }

  useEffect(load, [statusFilter]);

  function selectStatusFilter(value: string) {
    setStatusFilter(value);
    setLoading(true);
  }

  async function patch(listing: ListingRow, body: Record<string, unknown>) {
    const res = await fetch(`/api/admin/directory/${listing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      toast.success("Listing updated.");
      setLoading(true);
      load();
    } else {
      toast.error("Failed to update listing.");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-navy-600">Services Directory</h1>
        <p className="mt-1 text-sm text-navy-400">
          Approve applications, verify businesses, and track subscription renewals.
        </p>
      </div>

      <Card>
        <CardHeader
          title="All Listings"
          action={
            <Select value={statusFilter} onChange={(e) => selectStatusFilter(e.target.value)} className="w-auto!">
              <option value="ALL">All statuses</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </Select>
          }
        />
        <Table>
          <Thead>
            <Tr>
              <Th>Business</Th>
              <Th>Category</Th>
              <Th>Contact</Th>
              <Th>Plan</Th>
              <Th>Status</Th>
              <Th>Renews</Th>
              <Th align="right">Views</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {loading ? (
              <TableSkeletonRows rows={6} cols={8} />
            ) : listings.length === 0 ? (
              <TableEmptyRow colSpan={8} message="No directory listings yet." />
            ) : (
              listings.map((l) => (
                <Tr key={l.id}>
                  <Td className="font-semibold text-navy-600">
                    {l.businessName}
                    {l.verified && <Badge variant="success" className="ml-2">Verified</Badge>}
                  </Td>
                  <Td>{l.category.replace(/_/g, " ")}</Td>
                  <Td>
                    <div>{l.contactName}</div>
                    <div className="text-xs text-navy-300">{l.phone}</div>
                  </Td>
                  <Td>
                    <Badge variant={l.plan === "PREMIUM" ? "warning" : "neutral"}>{l.plan}</Badge>
                  </Td>
                  <Td>
                    <Badge
                      variant={
                        l.status === "APPROVED" ? "success" : l.status === "REJECTED" ? "danger" : "warning"
                      }
                    >
                      {l.status}
                      {l.status === "APPROVED" && !l.subscriptionActive ? " (unpaid)" : ""}
                    </Badge>
                  </Td>
                  <Td>{l.renewsAt ? new Date(l.renewsAt).toLocaleDateString("en-ZA") : "—"}</Td>
                  <Td align="right">{l.views}</Td>
                  <Td>
                    <div className="flex flex-wrap gap-2">
                      {l.status === "PENDING" && (
                        <>
                          <Button size="sm" onClick={() => patch(l, { sendPaymentLink: true })}>
                            Send Payment Link
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => patch(l, { status: "REJECTED" })}>
                            Reject
                          </Button>
                        </>
                      )}
                      {!l.verified && l.status === "APPROVED" && (
                        <Button size="sm" variant="secondary" onClick={() => patch(l, { verified: true })}>
                          Verify
                        </Button>
                      )}
                      {l.status === "APPROVED" && (
                        <Button size="sm" variant="outline" onClick={() => patch(l, { status: "PENDING" })}>
                          Suspend
                        </Button>
                      )}
                      <Select
                        value={l.plan}
                        onChange={(e) => patch(l, { plan: e.target.value })}
                        className="w-auto! text-xs"
                      >
                        <option value="STANDARD">Standard</option>
                        <option value="PREMIUM">Premium</option>
                      </Select>
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
