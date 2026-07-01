"use client";

import { useMemo, useState } from "react";

type OrderItem = {
  id: string;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
  product: { name: string; slug: string };
};

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  totalCents: number;
  currency: string;
  paymentMethod: string;
  paymentReference: string | null;
  guestEmail: string | null;
  createdAt: Date | string;
  user: { fullName: string; email: string } | null;
  items: OrderItem[];
};

type OrdersManagerProps = {
  initialOrders: Order[];
  initialTotal: number;
};

const STATUS_OPTIONS = ["PENDING", "PAID", "PROCESSING", "SHIPPED", "COMPLETED", "CANCELLED", "FAILED"];

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  PAID: "bg-blue-100 text-blue-800",
  PROCESSING: "bg-indigo-100 text-indigo-800",
  SHIPPED: "bg-purple-100 text-purple-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
  FAILED: "bg-gray-100 text-gray-700",
};

function toCurrency(cents: number, currency = "ZAR") {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

function formatDate(value: Date | string) {
  return new Date(value).toLocaleDateString("en-ZA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function OrdersManager({ initialOrders, initialTotal }: OrdersManagerProps) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const total = initialTotal;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesStatus = statusFilter === "ALL" || order.status === statusFilter;

      if (!matchesStatus) {
        return false;
      }

      if (!q) {
        return true;
      }

      const email = order.user?.email ?? order.guestEmail ?? "";
      const name = order.user?.fullName ?? "";

      return (
        order.orderNumber.toLowerCase().includes(q) ||
        email.toLowerCase().includes(q) ||
        name.toLowerCase().includes(q)
      );
    });
  }, [orders, search, statusFilter]);

  async function updateStatus(id: string, status: string) {
    setError(null);
    setSavingId(id);

    const response = await fetch("/api/admin/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action: "update_status", data: { status } }),
    });

    setSavingId(null);

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      setError(typeof payload.error === "string" ? payload.error : "Failed to update status.");
      return;
    }

    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="search"
          placeholder="Search order #, email, or name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-navy/40 w-full sm:w-64"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-navy/40"
        >
          <option value="ALL">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <span className="ml-auto self-center text-xs text-gray-500">
          {filtered.length} of {total} orders
        </span>
      </div>

      {error && (
        <p className="rounded bg-red-50 px-4 py-2 text-sm text-red-700 border border-red-200">{error}</p>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
            <tr>
              <th className="px-4 py-3 text-left">Order #</th>
              <th className="px-4 py-3 text-left">Customer</th>
              <th className="px-4 py-3 text-left">Date</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3 text-left">Payment</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                  No orders found.
                </td>
              </tr>
            )}
            {filtered.map((order) => {
              const customerName = order.user?.fullName ?? "Guest";
              const customerEmail = order.user?.email ?? order.guestEmail ?? "—";
              const isSaving = savingId === order.id;

              return (
                <>
                  <tr
                    key={order.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => setExpandedId((prev) => (prev === order.id ? null : order.id))}
                  >
                    <td className="px-4 py-3 font-mono font-medium text-brand-navy">{order.orderNumber}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-800">{customerName}</div>
                      <div className="text-xs text-gray-500">{customerEmail}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(order.createdAt)}</td>
                    <td className="px-4 py-3 text-right font-medium text-gray-800">
                      {toCurrency(order.totalCents, order.currency)}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{order.paymentMethod}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_COLORS[order.status] ?? "bg-gray-100 text-gray-700"}`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <select
                        disabled={isSaving}
                        value={order.status}
                        onChange={(e) => updateStatus(order.id, e.target.value)}
                        className="rounded border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-brand-navy/40 disabled:opacity-50"
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                  {expandedId === order.id && (
                    <tr key={`${order.id}-detail`} className="bg-gray-50">
                      <td colSpan={7} className="px-4 py-4">
                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                            Order items
                          </p>
                          <ul className="divide-y divide-gray-200 rounded border border-gray-200 bg-white">
                            {order.items.map((item) => (
                              <li key={item.id} className="flex items-center justify-between px-4 py-2 text-sm">
                                <span className="text-gray-700">{item.product.name}</span>
                                <span className="text-gray-500">
                                  {item.quantity} × {toCurrency(item.unitPriceCents, order.currency)} ={" "}
                                  <strong>{toCurrency(item.lineTotalCents, order.currency)}</strong>
                                </span>
                              </li>
                            ))}
                          </ul>
                          {order.paymentReference && (
                            <p className="text-xs text-gray-500">
                              Payment ref: <span className="font-mono">{order.paymentReference}</span>
                            </p>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
