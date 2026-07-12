"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Wallet, Plus, Repeat, Paperclip } from "lucide-react";
import { formatCents, centsToRand, randToCents } from "@/lib/money";
import { Card, CardHeader, StatCard } from "@/components/admin/Card";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/admin/Table";
import { TableEmptyRow } from "@/components/admin/EmptyState";
import { TableSkeletonRows } from "@/components/admin/Skeleton";
import { Pagination } from "@/components/admin/Pagination";
import { Button } from "@/components/admin/Button";
import { Input, Select, Textarea } from "@/components/admin/Field";
import { Modal } from "@/components/admin/Modal";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { ExpenseByCategoryChart } from "@/components/admin/charts/ExpenseByCategoryChart";

type RecurrenceInterval = "MONTHLY" | "QUARTERLY" | "ANNUAL";

type ExpenseRow = {
  id: string;
  category: string;
  description: string;
  amountCents: number;
  date: string;
  notes: string | null;
  receiptUrl: string | null;
  isRecurring: boolean;
  recurrenceInterval: RecurrenceInterval | null;
  parentExpenseId: string | null;
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

const PAGE_SIZE = 20;

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
  const [amountRand, setAmountRand] = useState(
    expense ? String(centsToRand(expense.amountCents)) : "",
  );
  const [date, setDate] = useState(
    expense ? expense.date.slice(0, 10) : new Date().toISOString().slice(0, 10),
  );
  const [notes, setNotes] = useState(expense?.notes ?? "");
  const [isRecurring, setIsRecurring] = useState(expense?.isRecurring ?? false);
  const [recurrenceInterval, setRecurrenceInterval] = useState<RecurrenceInterval>(
    expense?.recurrenceInterval ?? "MONTHLY",
  );
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function uploadReceipt(expenseId: string) {
    if (!receiptFile) return;
    const form = new FormData();
    form.set("file", receiptFile);
    const res = await fetch(`/api/admin/expenses/${expenseId}/receipt`, {
      method: "POST",
      body: form,
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error || "Expense saved, but the receipt upload failed.");
    }
  }

  async function save() {
    setError("");
    if (!category.trim() || !description.trim()) {
      setError("Category and description are required.");
      return;
    }
    if (isRecurring && !recurrenceInterval) {
      setError("Choose how often this expense recurs.");
      return;
    }
    setSaving(true);
    const payload = {
      category: category.trim(),
      description: description.trim(),
      amountCents: randToCents(Number(amountRand || 0)),
      date,
      notes: notes.trim() || undefined,
      isRecurring,
      recurrenceInterval: isRecurring ? recurrenceInterval : undefined,
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
      await uploadReceipt(data.expense.id);
      if (expense) onSaved(data.expense);
      else onCreated(data.expense);
      toast.success(expense ? "Expense updated." : "Expense created.");
      onClose();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={expense ? "Edit Expense" : "New Expense"}
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
          label="Category"
          list="expense-categories"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />
        <datalist id="expense-categories">
          {SUGGESTED_CATEGORIES.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>

        <Input
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Amount (R)"
            type="number"
            step="0.01"
            value={amountRand}
            onChange={(e) => setAmountRand(e.target.value)}
          />
          <Input
            label="Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        <Textarea
          label="Notes (optional)"
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <div className="space-y-3 rounded-lg border border-navy-100 p-3">
          <label className="flex items-center gap-2 text-sm font-semibold text-navy-500">
            <input
              type="checkbox"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
              className="h-4 w-4 rounded border-navy-100 text-navy-600 focus:ring-2 focus:ring-navy-600/15"
            />
            <Repeat size={14} /> Recurring expense
          </label>
          {isRecurring && (
            <Select
              label="Repeats"
              value={recurrenceInterval}
              onChange={(e) => setRecurrenceInterval(e.target.value as RecurrenceInterval)}
            >
              <option value="MONTHLY">Monthly</option>
              <option value="QUARTERLY">Quarterly</option>
              <option value="ANNUAL">Annually</option>
            </Select>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-navy-500">Receipt (optional)</label>
          {expense?.receiptUrl && (
            <a
              href={`/api/admin/expenses/${expense.id}/receipt`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-sm text-green hover:underline"
            >
              <Paperclip size={14} /> View current receipt
            </a>
          )}
          <input
            type="file"
            accept="application/pdf,image/jpeg,image/png,image/webp"
            onChange={(e) => setReceiptFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-navy-500 file:mr-3 file:rounded-lg file:border-0 file:bg-navy-25 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-navy-600 hover:file:bg-navy-50"
          />
        </div>
      </div>
    </Modal>
  );
}

export default function AdminExpensesPage() {
  const [expenses, setExpenses] = useState<ExpenseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editTarget, setEditTarget] = useState<ExpenseRow | null | "new">(null);
  const [deleteTarget, setDeleteTarget] = useState<ExpenseRow | null>(null);
  const [page, setPage] = useState(1);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  function load() {
    const params = new URLSearchParams();
    if (fromDate) params.set("from", fromDate);
    if (toDate) params.set("to", toDate);
    const query = params.toString();
    fetch(`/api/admin/expenses${query ? `?${query}` : ""}`)
      .then((r) => r.json())
      .then((d) => setExpenses(d.expenses || []))
      .catch(() => toast.error("Failed to load expenses."))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromDate, toDate]);

  function updateFromDate(value: string) {
    setFromDate(value);
    setLoading(true);
    setPage(1);
  }

  function updateToDate(value: string) {
    setToDate(value);
    setLoading(true);
    setPage(1);
  }

  function clearDateFilter() {
    setFromDate("");
    setToDate("");
    setLoading(true);
    setPage(1);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/admin/expenses/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Failed to delete expense.");
        return;
      }
      setExpenses((prev) => prev.filter((e) => e.id !== deleteTarget.id));
      toast.success("Expense deleted.");
      setDeleteTarget(null);
    } catch {
      toast.error("Network error. Please try again.");
    }
  }

  const total = expenses.reduce((sum, e) => sum + e.amountCents, 0);
  const pagedExpenses = expenses.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const categoryMap = new Map<string, number>();
  for (const e of expenses) {
    categoryMap.set(e.category, (categoryMap.get(e.category) ?? 0) + e.amountCents);
  }
  const categoryTotals = [...categoryMap.entries()]
    .map(([category, totalCents]) => ({ category, totalCents }))
    .sort((a, b) => b.totalCents - a.totalCents);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-navy-600">Expenses</h1>
          <p className="mt-1 text-sm text-navy-400">
            <Link href="/admin/reports" className="text-green hover:underline">
              View Profit &amp; Loss →
            </Link>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => setEditTarget("new")}>
            <Plus size={14} /> New Expense
          </Button>
          <Link href="/admin" className="text-sm text-green hover:underline">
            ← Dashboard
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Total Expenses"
          value={formatCents(total)}
          icon={<Wallet size={18} />}
          accent="navy"
          hint={`${expenses.length} record${expenses.length === 1 ? "" : "s"}${fromDate || toDate ? " in range" : ""}`}
        />
      </div>

      {!loading && categoryTotals.length > 0 && (
        <Card>
          <CardHeader title="Expenses by Category" />
          <div className="p-4 pt-0">
            <ExpenseByCategoryChart categories={categoryTotals} />
          </div>
        </Card>
      )}

      <Card>
        <CardHeader
          title="Filter by Date"
          description="Narrow expenses down to a specific date range."
          action={
            (fromDate || toDate) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearDateFilter}
              >
                Clear
              </Button>
            )
          }
        />
        <div className="grid grid-cols-2 gap-4 p-4 sm:max-w-md">
          <Input
            label="From"
            type="date"
            value={fromDate}
            onChange={(e) => updateFromDate(e.target.value)}
          />
          <Input
            label="To"
            type="date"
            value={toDate}
            onChange={(e) => updateToDate(e.target.value)}
          />
        </div>
      </Card>

      <Card>
        <Table>
          <Thead>
            <Tr>
              <Th>Date</Th>
              <Th>Category</Th>
              <Th>Description</Th>
              <Th>Amount</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {loading ? (
              <TableSkeletonRows rows={5} cols={5} />
            ) : expenses.length === 0 ? (
              <TableEmptyRow colSpan={5} message="No expenses recorded yet." />
            ) : (
              pagedExpenses.map((e) => (
                <Tr key={e.id}>
                  <Td>{new Date(e.date).toLocaleDateString("en-ZA")}</Td>
                  <Td className="font-semibold text-navy-600">{e.category}</Td>
                  <Td>
                    <div className="flex items-center gap-1.5">
                      {e.description}
                      {e.isRecurring && (
                        <Repeat size={12} className="shrink-0 text-navy-300" aria-label="Recurring" />
                      )}
                      {e.receiptUrl && (
                        <Paperclip size={12} className="shrink-0 text-navy-300" aria-label="Has receipt" />
                      )}
                    </div>
                  </Td>
                  <Td className="font-bold">{formatCents(e.amountCents)}</Td>
                  <Td>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setEditTarget(e)}>
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setDeleteTarget(e)}>
                        Delete
                      </Button>
                    </div>
                  </Td>
                </Tr>
              ))
            )}
          </Tbody>
        </Table>
        {!loading && expenses.length > 0 && (
          <Pagination page={page} pageSize={PAGE_SIZE} total={expenses.length} onPageChange={setPage} />
        )}
      </Card>

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

      <ConfirmDialog
        open={deleteTarget !== null}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete this expense?"
        description="This cannot be undone."
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}
