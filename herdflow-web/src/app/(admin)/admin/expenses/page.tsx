"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { formatRand } from "@/lib/marketing/format";

type ExpenseRow = {
  id: string;
  category: string;
  description: string;
  amountCents: number;
  date: string;
  notes: string | null;
};

const SUGGESTED_CATEGORIES = [
  "Hosting & Infrastructure",
  "Salaries",
  "Marketing & Ads",
  "Software & Tools",
  "Legal & Compliance",
  "Office & Admin",
  "Other",
];

function ExpenseModal({
  expense,
  onClose,
  onSaved,
  onCreated,
}: {
  expense: ExpenseRow | null;
  onClose: () => void;
  onSaved: (updated: ExpenseRow) => void;
  onCreated: (created: ExpenseRow) => void;
}) {
  const [category, setCategory] = useState(expense?.category ?? "");
  const [description, setDescription] = useState(expense?.description ?? "");
  const [amountRand, setAmountRand] = useState(expense ? String(expense.amountCents / 100) : "");
  const [date, setDate] = useState(
    expense ? expense.date.slice(0, 10) : new Date().toISOString().slice(0, 10),
  );
  const [notes, setNotes] = useState(expense?.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    setError("");
    if (!category.trim() || !description.trim()) {
      setError("Category and description are required.");
      return;
    }
    setSaving(true);
    const payload = {
      category: category.trim(),
      description: description.trim(),
      amountCents: Math.round(Number(amountRand || 0) * 100),
      date,
      notes: notes.trim() || undefined,
    };
    try {
      const res = await fetch(
        expense ? `/api/admin/expenses/${expense.id}` : "/api/admin/expenses",
        {
          method: expense ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to save.");
        return;
      }
      if (expense) onSaved(data.expense);
      else onCreated(data.expense);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-[#e4ebf5] bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#1B3A6B]">
            {expense ? "Edit Expense" : "New Expense"}
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

        <div className="space-y-4">
          <label className="block text-sm">
            <span className="mb-1 block font-semibold text-[#244367]">Category</span>
            <input
              list="expense-categories"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30"
            />
            <datalist id="expense-categories">
              {SUGGESTED_CATEGORIES.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </label>

          <label className="block text-sm">
            <span className="mb-1 block font-semibold text-[#244367]">Description</span>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30"
            />
          </label>

          <div className="grid grid-cols-2 gap-4">
            <label className="block text-sm">
              <span className="mb-1 block font-semibold text-[#244367]">Amount (R)</span>
              <input
                type="number"
                step="0.01"
                value={amountRand}
                onChange={(e) => setAmountRand(e.target.value)}
                className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-semibold text-[#244367]">Date</span>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30"
              />
            </label>
          </div>

          <label className="block text-sm">
            <span className="mb-1 block font-semibold text-[#244367]">Notes (optional)</span>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
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
            onClick={save}
            disabled={saving}
            className="rounded-lg bg-[#2E7D32] px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminExpensesPage() {
  const [expenses, setExpenses] = useState<ExpenseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editTarget, setEditTarget] = useState<ExpenseRow | null | "new">(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  function load() {
    setLoading(true);
    fetch("/api/admin/expenses")
      .then((r) => r.json())
      .then((d) => setExpenses(d.expenses || []))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function deleteExpense(id: string) {
    if (!confirm("Delete this expense? This cannot be undone.")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/expenses/${id}`, { method: "DELETE" });
      if (res.ok) setExpenses((prev) => prev.filter((e) => e.id !== id));
    } finally {
      setDeleting(null);
    }
  }

  const total = expenses.reduce((sum, e) => sum + e.amountCents, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#1B3A6B]">Expenses</h1>
          <p className="mt-1 text-sm text-[#5d7497]">
            Total: {formatRand(total / 100)} ·{" "}
            <Link href="/admin/reports" className="text-[#2E7D32] hover:underline">
              View Profit &amp; Loss →
            </Link>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setEditTarget("new")}
            className="rounded-lg bg-[#2E7D32] px-4 py-2 text-sm font-bold text-white hover:bg-[#1d5e20]"
          >
            + New Expense
          </button>
          <Link href="/admin" className="text-sm text-[#2E7D32] hover:underline">
            ← Dashboard
          </Link>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-[#e4ebf5] bg-white shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-sm text-[#5d7497]">Loading…</div>
        ) : expenses.length === 0 ? (
          <div className="p-8 text-center text-sm text-[#5d7497]">No expenses recorded yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-[#f5f8fd] text-xs font-semibold uppercase tracking-wide text-[#5d7497]">
              <tr>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Category</th>
                <th className="px-4 py-3 text-left">Description</th>
                <th className="px-4 py-3 text-left">Amount</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f4f9]">
              {expenses.map((e) => (
                <tr key={e.id}>
                  <td className="px-4 py-3 text-[#5d7497]">
                    {new Date(e.date).toLocaleDateString("en-ZA")}
                  </td>
                  <td className="px-4 py-3 font-semibold text-[#1B3A6B]">{e.category}</td>
                  <td className="px-4 py-3 text-[#244367]">{e.description}</td>
                  <td className="px-4 py-3 font-bold text-[#244367]">
                    {formatRand(e.amountCents / 100)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setEditTarget(e)}
                        className="rounded-lg border border-[#cdd8e7] px-3 py-1 text-xs font-bold text-[#5d7497] hover:border-[#1B3A6B]"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        disabled={deleting === e.id}
                        onClick={() => deleteExpense(e.id)}
                        className="rounded-lg border border-[#cdd8e7] px-3 py-1 text-xs font-bold text-[#5d7497] hover:border-red-400 hover:text-red-600 disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {editTarget && (
        <ExpenseModal
          expense={editTarget === "new" ? null : editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={(updated) =>
            setExpenses((prev) => prev.map((e) => (e.id === updated.id ? updated : e)))
          }
          onCreated={(created) =>
            setExpenses((prev) => [...prev, created].sort((a, b) => (a.date < b.date ? 1 : -1)))
          }
        />
      )}
    </div>
  );
}
