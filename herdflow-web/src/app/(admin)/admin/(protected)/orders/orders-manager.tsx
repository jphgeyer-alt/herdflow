"use client";

import { Fragment, useMemo, useState } from "react";
import { toast } from "sonner";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/admin/Table";
import { TableEmptyRow } from "@/components/admin/EmptyState";
import { StatusBadge } from "@/components/admin/Badge";
import { Button } from "@/components/admin/Button";
import { Input, Select } from "@/components/admin/Field";
import { Modal } from "@/components/admin/Modal";

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
  total: number;
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

  async function create() {
    if (
      !pickupAddress.trim() ||
      !pickupRegion.trim() ||
      !dropoffAddress.trim() ||
      !dropoffRegion.trim() ||
      !cargoDescription.trim() ||
      !price
    ) {
      toast.error("Please complete all required fields.");
      return;
    }
    setSaving(true);
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
        toast.error(data.error || "Failed to create delivery request.");
        return;
      }
      toast.success("Delivery request created");
      onCreated(data.request.id, data.request.status);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={`Request Delivery Partner — ${order.orderNumber}`}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button variant="secondary" onClick={create} loading={saving}>
            Create Request
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          className="sm:col-span-2"
          label="Pickup Address"
          value={pickupAddress}
          onChange={(e) => setPickupAddress(e.target.value)}
          placeholder="Seller / warehouse address"
          required
        />
        <Input
          label="Pickup Region"
          value={pickupRegion}
          onChange={(e) => setPickupRegion(e.target.value)}
          placeholder="e.g. Gauteng"
          required
        />
        <Input
          className="sm:col-span-2"
          label="Dropoff Address"
          value={dropoffAddress}
          onChange={(e) => setDropoffAddress(e.target.value)}
          required
        />
        <Input
          label="Dropoff Region"
          value={dropoffRegion}
          onChange={(e) => setDropoffRegion(e.target.value)}
          required
        />
        <Input
          className="sm:col-span-2"
          label="Cargo Description"
          value={cargoDescription}
          onChange={(e) => setCargoDescription(e.target.value)}
          required
        />
        <Input
          className="sm:col-span-2"
          label="Transport Price (R)"
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
        />
      </div>
    </Modal>
  );
}

export function OrdersManager({ initialOrders, total }: OrdersManagerProps) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deliveryModalOrder, setDeliveryModalOrder] = useState<Order | null>(null);

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
    setSavingId(id);

    try {
      const response = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "update_status", data: { status } }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        toast.error(typeof payload.error === "string" ? payload.error : "Failed to update status.");
        return;
      }

      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
      toast.success("Order status updated");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 border-b border-navy-50 p-4">
        <Input
          type="search"
          placeholder="Search order #, email, or name (this page)…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-64"
        />
        <Select
          aria-label="Filter orders by status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-auto!"
        >
          <option value="ALL">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
        <span className="ml-auto self-center text-xs text-navy-300">
          Showing {filtered.length} of {orders.length} on this page &middot; {total} total
        </span>
      </div>

      {/* Table */}
      <Table>
        <Thead>
          <Tr>
            <Th>Order #</Th>
            <Th>Customer</Th>
            <Th>Date</Th>
            <Th align="right">Total</Th>
            <Th>Payment</Th>
            <Th>Status</Th>
            <Th>Actions</Th>
          </Tr>
        </Thead>
        <Tbody>
          {filtered.length === 0 ? (
            <TableEmptyRow colSpan={7} message="No orders found." />
          ) : (
            filtered.map((order) => {
              const customerName = order.user?.fullName ?? "Guest";
              const customerEmail = order.user?.email ?? order.guestEmail ?? "—";
              const isSaving = savingId === order.id;

              const isExpanded = expandedId === order.id;

              return (
                <Fragment key={order.id}>
                  <Tr>
                    <Td className="font-mono font-semibold text-navy-600">
                      <button
                        type="button"
                        className="flex items-center gap-1.5 hover:text-navy-500"
                        onClick={() => setExpandedId((prev) => (prev === order.id ? null : order.id))}
                        aria-expanded={isExpanded}
                        aria-label={isExpanded ? "Collapse order details" : "Expand order details"}
                      >
                        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        {order.orderNumber}
                      </button>
                    </Td>
                    <Td>
                      <div className="font-semibold text-navy-500">{customerName}</div>
                      <div className="text-xs text-navy-300">{customerEmail}</div>
                    </Td>
                    <Td>{formatDate(order.createdAt)}</Td>
                    <Td align="right" className="font-semibold text-navy-600">
                      {toCurrency(order.totalCents, order.currency)}
                    </Td>
                    <Td>{order.paymentMethod}</Td>
                    <Td>
                      <StatusBadge status={order.status} />
                    </Td>
                    <Td>
                      <Select
                        aria-label={`Update status for ${order.orderNumber}`}
                        disabled={isSaving}
                        value={order.status}
                        onChange={(e) => updateStatus(order.id, e.target.value)}
                        className="w-auto! py-1 text-xs"
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </Select>
                    </Td>
                  </Tr>
                  {isExpanded && (
                    <tr className="bg-navy-25/60">
                      <td colSpan={7} className="px-4 py-4">
                        <div className="space-y-2">
                          <p className="text-xs font-semibold tracking-wide text-navy-300 uppercase">
                            Order items
                          </p>
                          <ul className="divide-y divide-navy-50 rounded-lg border border-navy-50 bg-white">
                            {order.items.map((item) => (
                              <li
                                key={item.id}
                                className="flex items-center justify-between px-4 py-2 text-sm"
                              >
                                <span className="text-navy-500">{item.product.name}</span>
                                <span className="text-navy-300">
                                  {item.quantity} ×{" "}
                                  {toCurrency(item.unitPriceCents, order.currency)} ={" "}
                                  <strong className="text-navy-600">
                                    {toCurrency(item.lineTotalCents, order.currency)}
                                  </strong>
                                </span>
                              </li>
                            ))}
                          </ul>
                          {order.paymentReference && (
                            <p className="text-xs text-navy-300">
                              Payment ref: <span className="font-mono">{order.paymentReference}</span>
                            </p>
                          )}
                          {order.deliveryMethod === "DELIVERY" && (
                            <div className="pt-1">
                              {order.deliveryRequest ? (
                                <p className="text-xs text-navy-300">
                                  Delivery request status:{" "}
                                  <span className="font-semibold text-navy-500">
                                    {order.deliveryRequest.status}
                                  </span>
                                </p>
                              ) : (
                                <Button size="sm" onClick={() => setDeliveryModalOrder(order)}>
                                  Request Delivery Partner
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })
          )}
        </Tbody>
      </Table>

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
