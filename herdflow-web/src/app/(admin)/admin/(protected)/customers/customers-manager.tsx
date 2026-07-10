"use client";

import { useMemo, useState } from "react";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/admin/Table";
import { TableEmptyRow } from "@/components/admin/EmptyState";
import { Badge, RoleBadge, StatusBadge } from "@/components/admin/Badge";
import { Input, Select } from "@/components/admin/Field";

type SellerProfile = {
  farmName: string;
  status: string;
};

type Customer = {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  role: string;
  marketingConsent: boolean;
  createdAt: Date | string;
  _count: { orders: number };
  sellerProfile: SellerProfile | null;
};

type CustomersManagerProps = {
  initialCustomers: Customer[];
  pageSize: number;
  total: number;
};

function formatDate(value: Date | string) {
  return new Date(value).toLocaleDateString("en-ZA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function CustomersManager({ initialCustomers, total }: CustomersManagerProps) {
  const [customers] = useState<Customer[]>(initialCustomers);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [marketingOnly, setMarketingOnly] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return customers.filter((customer) => {
      const matchesRole = roleFilter === "ALL" || customer.role === roleFilter;
      if (!matchesRole) {
        return false;
      }

      if (marketingOnly && !customer.marketingConsent) {
        return false;
      }

      if (!q) {
        return true;
      }

      return (
        customer.fullName.toLowerCase().includes(q) ||
        customer.email.toLowerCase().includes(q) ||
        (customer.phone ?? "").toLowerCase().includes(q) ||
        (customer.sellerProfile?.farmName ?? "").toLowerCase().includes(q)
      );
    });
  }, [customers, search, roleFilter, marketingOnly]);

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 border-b border-navy-50 p-4">
        <Input
          type="search"
          placeholder="Search name, email, or farm (this page)…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-64"
        />
        <Select
          aria-label="Filter customers by role"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="w-auto!"
        >
          <option value="ALL">All roles</option>
          <option value="CUSTOMER">Customer</option>
          <option value="ADMIN">Admin</option>
        </Select>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-navy-400">
          <input
            type="checkbox"
            checked={marketingOnly}
            onChange={(e) => setMarketingOnly(e.target.checked)}
            className="h-4 w-4 rounded border-navy-100 text-navy-600 focus:ring-2 focus:ring-navy-600/15"
          />
          Marketing opt-in only
        </label>
        <div className="flex gap-2">
          <a
            href="/api/admin/customers/export"
            className="rounded-lg border border-navy-100 bg-white px-3 py-1.5 text-sm font-semibold text-navy-500 hover:bg-navy-25"
          >
            Export CSV
          </a>
          <a
            href="/api/admin/customers/export?consentOnly=true"
            className="rounded-lg border border-navy-100 bg-white px-3 py-1.5 text-sm font-semibold text-navy-500 hover:bg-navy-25"
          >
            Export Marketing List
          </a>
        </div>
        <span className="ml-auto self-center text-xs text-navy-300">
          Showing {filtered.length} of {customers.length} on this page &middot; {total} total
        </span>
      </div>

      {/* Table */}
      <Table>
        <Thead>
          <Tr>
            <Th>Name</Th>
            <Th>Email</Th>
            <Th>Phone</Th>
            <Th>Role</Th>
            <Th>Marketing</Th>
            <Th align="right">Orders</Th>
            <Th>Seller</Th>
            <Th>Joined</Th>
          </Tr>
        </Thead>
        <Tbody>
          {filtered.length === 0 ? (
            <TableEmptyRow colSpan={8} message="No customers found." />
          ) : (
            filtered.map((customer) => (
              <Tr key={customer.id}>
                <Td className="font-semibold text-navy-600">{customer.fullName}</Td>
                <Td>{customer.email}</Td>
                <Td>{customer.phone ?? "—"}</Td>
                <Td>
                  <RoleBadge role={customer.role} />
                </Td>
                <Td>
                  <Badge variant={customer.marketingConsent ? "success" : "neutral"}>
                    {customer.marketingConsent ? "Yes" : "No"}
                  </Badge>
                </Td>
                <Td align="right">{customer._count.orders}</Td>
                <Td>
                  {customer.sellerProfile ? (
                    <div className="space-y-1">
                      <div className="text-xs font-semibold text-navy-500">
                        {customer.sellerProfile.farmName}
                      </div>
                      <StatusBadge status={customer.sellerProfile.status} />
                    </div>
                  ) : (
                    <span className="text-navy-200">—</span>
                  )}
                </Td>
                <Td>{formatDate(customer.createdAt)}</Td>
              </Tr>
            ))
          )}
        </Tbody>
      </Table>
    </div>
  );
}
