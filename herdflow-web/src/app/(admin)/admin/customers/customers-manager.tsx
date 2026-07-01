"use client";

import { useMemo, useState } from "react";

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
  createdAt: Date | string;
  _count: { orders: number };
  sellerProfile: SellerProfile | null;
};

type CustomersManagerProps = {
  initialCustomers: Customer[];
  initialTotal: number;
};

const ROLE_COLORS: Record<string, string> = {
  ADMIN: "bg-purple-100 text-purple-800",
  CUSTOMER: "bg-blue-100 text-blue-800",
};

const SELLER_STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  APPROVED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
};

function formatDate(value: Date | string) {
  return new Date(value).toLocaleDateString("en-ZA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function CustomersManager({ initialCustomers, initialTotal }: CustomersManagerProps) {
  const [customers] = useState<Customer[]>(initialCustomers);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const total = initialTotal;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return customers.filter((customer) => {
      const matchesRole = roleFilter === "ALL" || customer.role === roleFilter;
      if (!matchesRole) {
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
  }, [customers, search, roleFilter]);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="search"
          placeholder="Search name, email, or farm…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-navy/40 w-full sm:w-64"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="rounded border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-navy/40"
        >
          <option value="ALL">All roles</option>
          <option value="CUSTOMER">Customer</option>
          <option value="ADMIN">Admin</option>
        </select>
        <span className="ml-auto self-center text-xs text-gray-500">
          {filtered.length} of {total} users
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
            <tr>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Phone</th>
              <th className="px-4 py-3 text-left">Role</th>
              <th className="px-4 py-3 text-right">Orders</th>
              <th className="px-4 py-3 text-left">Seller</th>
              <th className="px-4 py-3 text-left">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                  No customers found.
                </td>
              </tr>
            )}
            {filtered.map((customer) => (
              <tr key={customer.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">{customer.fullName}</td>
                <td className="px-4 py-3 text-gray-600">{customer.email}</td>
                <td className="px-4 py-3 text-gray-500">{customer.phone ?? "—"}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${ROLE_COLORS[customer.role] ?? "bg-gray-100 text-gray-700"}`}
                  >
                    {customer.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-gray-700">{customer._count.orders}</td>
                <td className="px-4 py-3">
                  {customer.sellerProfile ? (
                    <div>
                      <div className="text-xs font-medium text-gray-700">{customer.sellerProfile.farmName}</div>
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${SELLER_STATUS_COLORS[customer.sellerProfile.status] ?? "bg-gray-100 text-gray-700"}`}
                      >
                        {customer.sellerProfile.status}
                      </span>
                    </div>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-500">{formatDate(customer.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
