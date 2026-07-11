"use client";

import { useEffect, useState } from "react";
import { formatRand } from "@/lib/marketing/format";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/admin/Table";
import { TableEmptyRow } from "@/components/admin/EmptyState";
import { TableSkeletonRows } from "@/components/admin/Skeleton";
import { Badge } from "@/components/admin/Badge";
import { Button } from "@/components/admin/Button";
import { Input } from "@/components/admin/Field";
import { Modal } from "@/components/admin/Modal";
import { Card, CardHeader } from "@/components/admin/Card";

type PlanRow = {
  id: string;
  key: string;
  displayName: string;
  monthlyPrice: string;
  annualPrice: string;
  maxAnimals: number | null;
  maxUsers: number | null;
  maxFarms: number;
  isPopular: boolean;
  isActive: boolean;
  sortOrder: number;
};

type FeeRow = {
  id: string;
  feeKey: string;
  name: string;
  amount: string;
  feeType: "FLAT" | "PERCENT";
  isActive: boolean;
};

function PlanModal({
  plan,
  onClose,
  onSaved,
}: {
  plan: PlanRow;
  onClose: () => void;
  onSaved: (updated: PlanRow) => void;
}) {
  const [form, setForm] = useState({
    displayName: plan.displayName,
    monthlyPrice: plan.monthlyPrice,
    annualPrice: plan.annualPrice,
    maxAnimals: plan.maxAnimals === null ? "" : String(plan.maxAnimals),
    maxUsers: plan.maxUsers === null ? "" : String(plan.maxUsers),
    maxFarms: String(plan.maxFarms),
    isPopular: plan.isPopular,
    isActive: plan.isActive,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/pricing/plans/${plan.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: form.displayName,
          monthlyPrice: Number(form.monthlyPrice),
          annualPrice: Number(form.annualPrice),
          maxAnimals: form.maxAnimals === "" ? null : Number(form.maxAnimals),
          maxUsers: form.maxUsers === "" ? null : Number(form.maxUsers),
          maxFarms: Number(form.maxFarms),
          isPopular: form.isPopular,
          isActive: form.isActive,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to save.");
        return;
      }
      onSaved(data.plan);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={`Edit ${plan.displayName}`}
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
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      <div className="space-y-4">
        <Input
          label="Display Name"
          value={form.displayName}
          onChange={(e) => setForm((p) => ({ ...p, displayName: e.target.value }))}
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Monthly Price (R)"
            type="number"
            value={form.monthlyPrice}
            onChange={(e) => setForm((p) => ({ ...p, monthlyPrice: e.target.value }))}
          />
          <Input
            label="Annual Price (R)"
            type="number"
            value={form.annualPrice}
            onChange={(e) => setForm((p) => ({ ...p, annualPrice: e.target.value }))}
          />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <Input
            label="Max Animals"
            type="number"
            placeholder="Unlimited"
            value={form.maxAnimals}
            onChange={(e) => setForm((p) => ({ ...p, maxAnimals: e.target.value }))}
          />
          <Input
            label="Max Users"
            type="number"
            placeholder="Unlimited"
            value={form.maxUsers}
            onChange={(e) => setForm((p) => ({ ...p, maxUsers: e.target.value }))}
          />
          <Input
            label="Max Farms"
            type="number"
            value={form.maxFarms}
            onChange={(e) => setForm((p) => ({ ...p, maxFarms: e.target.value }))}
          />
        </div>
        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 text-sm text-navy-500">
            <input
              type="checkbox"
              checked={form.isPopular}
              onChange={(e) => setForm((p) => ({ ...p, isPopular: e.target.checked }))}
              className="h-4 w-4 rounded border-navy-100 text-navy-600 focus:ring-2 focus:ring-navy-600/15"
            />
            Most Popular badge
          </label>
          <label className="flex items-center gap-2 text-sm text-navy-500">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
              className="h-4 w-4 rounded border-navy-100 text-navy-600 focus:ring-2 focus:ring-navy-600/15"
            />
            Active
          </label>
        </div>
      </div>
    </Modal>
  );
}

function FeeModal({
  fee,
  onClose,
  onSaved,
}: {
  fee: FeeRow;
  onClose: () => void;
  onSaved: (updated: FeeRow) => void;
}) {
  const [amount, setAmount] = useState(fee.amount);
  const [isActive, setIsActive] = useState(fee.isActive);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/pricing/fees/${fee.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: Number(amount), isActive }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to save.");
        return;
      }
      onSaved(data.fee);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={`Edit ${fee.name}`}
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
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      <div className="space-y-4">
        <Input
          label={fee.feeType === "PERCENT" ? "Amount (%)" : "Amount (R)"}
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <label className="flex items-center gap-2 text-sm text-navy-500">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="h-4 w-4 rounded border-navy-100 text-navy-600 focus:ring-2 focus:ring-navy-600/15"
          />
          Active
        </label>
      </div>
    </Modal>
  );
}

export default function AdminPricingPage() {
  const [plans, setPlans] = useState<PlanRow[]>([]);
  const [fees, setFees] = useState<FeeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editPlan, setEditPlan] = useState<PlanRow | null>(null);
  const [editFee, setEditFee] = useState<FeeRow | null>(null);

  function load() {
    setLoading(true);
    Promise.all([
      fetch("/api/admin/pricing/plans").then((r) => r.json()),
      fetch("/api/admin/pricing/fees").then((r) => r.json()),
    ])
      .then(([plansData, feesData]) => {
        setPlans(plansData.plans || []);
        setFees(feesData.fees || []);
      })
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-navy-600">Pricing</h1>
        <p className="mt-1 text-sm text-navy-400">
          Edit subscription plans and marketplace fees shown on /pricing. Changes are logged.
        </p>
      </div>

      <Card>
        <CardHeader title="Subscription Plans" />
        <Table>
          <Thead>
            <Tr>
              <Th>Plan</Th>
              <Th>Monthly</Th>
              <Th>Annual</Th>
              <Th>Limits</Th>
              <Th>Status</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {loading ? (
              <TableSkeletonRows rows={5} cols={6} />
            ) : plans.length === 0 ? (
              <TableEmptyRow colSpan={6} message="No plans found." />
            ) : (
              plans.map((p) => (
                <Tr key={p.id}>
                  <Td className="font-semibold text-navy-600">
                    {p.displayName}
                    {p.isPopular && (
                      <Badge variant="warning" className="ml-2">
                        Popular
                      </Badge>
                    )}
                  </Td>
                  <Td>{formatRand(Number(p.monthlyPrice))}</Td>
                  <Td>{formatRand(Number(p.annualPrice))}</Td>
                  <Td className="text-xs text-navy-400">
                    {p.maxAnimals ?? "∞"} animals · {p.maxUsers ?? "∞"} users · {p.maxFarms} farm
                    {p.maxFarms === 1 ? "" : "s"}
                  </Td>
                  <Td>
                    <Badge variant={p.isActive ? "success" : "neutral"}>
                      {p.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </Td>
                  <Td>
                    <Button size="sm" variant="outline" onClick={() => setEditPlan(p)}>
                      Edit
                    </Button>
                  </Td>
                </Tr>
              ))
            )}
          </Tbody>
        </Table>
      </Card>

      <Card>
        <CardHeader title="Platform Fees" description="Marketplace and service fees charged per transaction." />
        <Table>
          <Thead>
            <Tr>
              <Th>Fee</Th>
              <Th>Amount</Th>
              <Th>Status</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {loading ? (
              <TableSkeletonRows rows={5} cols={4} />
            ) : fees.length === 0 ? (
              <TableEmptyRow colSpan={4} message="No fees found." />
            ) : (
              fees.map((f) => (
                <Tr key={f.id}>
                  <Td className="font-semibold text-navy-600">{f.name}</Td>
                  <Td>{f.feeType === "PERCENT" ? `${Number(f.amount)}%` : formatRand(Number(f.amount))}</Td>
                  <Td>
                    <Badge variant={f.isActive ? "success" : "neutral"}>
                      {f.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </Td>
                  <Td>
                    <Button size="sm" variant="outline" onClick={() => setEditFee(f)}>
                      Edit
                    </Button>
                  </Td>
                </Tr>
              ))
            )}
          </Tbody>
        </Table>
      </Card>

      {editPlan && (
        <PlanModal
          plan={editPlan}
          onClose={() => setEditPlan(null)}
          onSaved={(updated) => setPlans((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))}
        />
      )}
      {editFee && (
        <FeeModal
          fee={editFee}
          onClose={() => setEditFee(null)}
          onSaved={(updated) => setFees((prev) => prev.map((f) => (f.id === updated.id ? updated : f)))}
        />
      )}
    </div>
  );
}
