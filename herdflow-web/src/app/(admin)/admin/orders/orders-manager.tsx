"use client";

import { Fragment, useMemo, useState } from "react";
import { X } from "lucide-react";

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
  deliveryMethod: string;
  shippingAddress: string | null;
  shippingCity: string | null;
  shippingProvince: string | null;
  shippingPostalCode: string | null;
  user: { fullName: string; email: string } | null;
  items: OrderItem[];
  deliveryRequest: { id: string; status: string } | null;
};

type OrdersManagerProps = {
  initialOrders: Order[];
  initialTotal: number;
};

const STATUS_OPTIONS = [
  "PENDING",
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "COMPLETED",
  "CANCELLED",
  "FAILED",
];

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

function RequestDeliveryModal({
  order,
  onClose,
  onCreated,
}: {
  order: Order;
  onClose: () => void;
  onCreated: (id: string, status: string) => void;
}) {
  const [pickupAddress, setPickupAddress] = useState("");
  const [pickupRegion, setPickupRegion] = useState("");
  const [dropoffAddress, setDropoffAddress] = useState(order.shippingAddress || "");
  const [dropoffRegion, setDropoffRegion] = useState(order.shippingProvince || "");
  const [cargoDescription, setCargoDescription] = useState(
    order.items.map((i) => `${i.quantity}x ${i.product.name}`).join(", "),
  );
  const [price, setPrice] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function create() {
    if (
      !pickupAddress.trim() ||
      !pickupRegion.trim() ||
      !dropoffAddress.trim() ||
      !dropoffRegion.trim() ||
      !cargoDescription.trim() ||
      !price
    ) {
      setError("Please complete all required fields.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/logistics/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          pickupAddress,
          pickupRegion,
          dropoffAddress,
          dropoffRegion,
          cargoDescription,
          priceCents: Math.round(Number(price) * 100),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create delivery request.");
        return;
      }
      onCreated(data.request.id, data.request.status);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-[#e4ebf5] bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-brand-navy text-lg font-bold">
            Request Delivery Partner — {order.orderNumber}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-[#9aabb9] hover:text-[#1B3A6B]"
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1 block font-semibold text-[#244367]">Pickup Address</span>
            <input
              value={pickupAddress}
              onChange={(e) => setPickupAddress(e.target.value)}
              placeholder="Seller / warehouse address"
              className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-semibold text-[#244367]">Pickup Region</span>
            <input
              value={pickupRegion}
              onChange={(e) => setPickupRegion(e.target.value)}
              placeholder="e.g. Gauteng"
              className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30"
            />
          </label>

          <label className="block text-sm sm:col-span-2">
            <span className="mb-1 block font-semibold text-[#244367]">Dropoff Address</span>
            <input
              value={dropoffAddress}
              onChange={(e) => setDropoffAddress(e.target.value)}
              className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-semibold text-[#244367]">Dropoff Region</span>
            <input
              value={dropoffRegion}
              onChange={(e) => setDropoffRegion(e.target.value)}
              className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30"
            />
          </label>

          <label className="block text-sm sm:col-span-2">
            <span className="mb-1 block font-semibold text-[#244367]">Cargo Description</span>
            <input
              value={cargoDescription}
              onChange={(e) => setCargoDescription(e.target.value)}
              className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30"
            />
          </label>

          <label className="block text-sm sm:col-span-2">
            <span className="mb-1 block font-semibold text-[#244367]">Transport Price (R)</span>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30"
            />
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[#cdd8e7] px-4 py-2 text-sm font-semibold text-[#5d7497]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={create}
            disabled={saving}
            className="rounded-lg bg-[#2E7D32] px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
          >
            {saving ? "Creating…" : "Create Request"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function OrdersManager({ initialOrders, initialTotal }: OrdersManagerProps) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deliveryModalOrder, setDeliveryModalOrder] = useState<Order | null>(null);
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
          className="focus:ring-brand-navy/40 w-full rounded border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 sm:w-64"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="focus:ring-brand-navy/40 rounded border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2"
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
        <p className="rounded border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
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
                <Fragment key={order.id}>
                  <tr
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => setExpandedId((prev) => (prev === order.id ? null : order.id))}
                  >
                    <td className="text-brand-navy px-4 py-3 font-mono font-medium">
                      {order.orderNumber}
                    </td>
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
                        className="focus:ring-brand-navy/40 rounded border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-2 disabled:opacity-50"
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
                    <tr className="bg-gray-50">
                      <td colSpan={7} className="px-4 py-4">
                        <div className="space-y-2">
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Order items
                          </p>
                          <ul className="divide-y divide-gray-200 rounded border border-gray-200 bg-white">
                            {order.items.map((item) => (
                              <li
                                key={item.id}
                                className="flex items-center justify-between px-4 py-2 text-sm"
                              >
                                <span className="text-gray-700">{item.product.name}</span>
                                <span className="text-gray-500">
                                  {item.quantity} ×{" "}
                                  {toCurrency(item.unitPriceCents, order.currency)} ={" "}
                                  <strong>{toCurrency(item.lineTotalCents, order.currency)}</strong>
                                </span>
                              </li>
                            ))}
                          </ul>
                          {order.paymentReference && (
                            <p className="text-xs text-gray-500">
                              Payment ref:{" "}
                              <span className="font-mono">{order.paymentReference}</span>
                            </p>
                          )}
                          {order.deliveryMethod === "DELIVERY" && (
                            <div className="pt-1">
                              {order.deliveryRequest ? (
                                <p className="text-xs text-gray-500">
                                  Delivery request status:{" "}
                                  <span className="font-semibold text-gray-700">
                                    {order.deliveryRequest.status}
                                  </span>
                                </p>
                              ) : (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeliveryModalOrder(order);
                                  }}
                                  className="rounded-lg bg-[#1B3A6B] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#122844]"
                                >
                                  Request Delivery Partner
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {deliveryModalOrder && (
        <RequestDeliveryModal
          order={deliveryModalOrder}
          onClose={() => setDeliveryModalOrder(null)}
          onCreated={(id, status) => {
            setOrders((prev) =>
              prev.map((o) =>
                o.id === deliveryModalOrder.id ? { ...o, deliveryRequest: { id, status } } : o,
              ),
            );
            setDeliveryModalOrder(null);
          }}
        />
      )}
    </div>
  );
}
