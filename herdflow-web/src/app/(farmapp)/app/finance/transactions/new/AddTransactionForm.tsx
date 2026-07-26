"use client";

import { useActionState, useMemo, useState } from "react";
import { AlertCircle } from "lucide-react";
import { INCOME_CATS, EXPENSE_CATS, categoryLabel } from "@/lib/farm-finance/categories";
import { formatCurrency, formatDate } from "@/lib/farm-finance/format";
import { Card } from "@/components/farm/Card";
import { addTransaction, type AddTransactionState } from "./actions";

const initialState: AddTransactionState = {};

const PAYMENT_METHODS = [
  { id: "CASH", label: "Cash" },
  { id: "BANK_TRANSFER", label: "Bank Transfer" },
  { id: "CARD", label: "Card" },
  { id: "OTHER", label: "Other" },
] as const;

const RECURRENCES = [
  { id: "WEEKLY", label: "Weekly" },
  { id: "MONTHLY", label: "Monthly" },
  { id: "ANNUALLY", label: "Annually" },
] as const;

export function AddTransactionForm({ suggestedInvoiceNumber }: { suggestedInvoiceNumber: string }) {
  const [state, formAction, isPending] = useActionState(addTransaction, initialState);
  const [step, setStep] = useState<"form" | "review">("form");
  const [type, setType] = useState<"income" | "expense">("expense");
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [vatOn, setVatOn] = useState(false);
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [supplier, setSupplier] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrence, setRecurrence] = useState("");
  const [unitCost, setUnitCost] = useState("");
  const [quantity, setQuantity] = useState("");
  const [isDepreciableAsset, setIsDepreciableAsset] = useState(false);
  const [reviewError, setReviewError] = useState("");

  const cats = type === "income" ? INCOME_CATS : EXPENSE_CATS;
  const numAmt = parseFloat(amount) || 0;
  const vatAmt = vatOn ? Math.round(numAmt * 0.15 * 100) / 100 : 0;
  const totalAmt = numAmt + vatAmt;
  const isEquipment = type === "expense" && category === "equipment";

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const effectiveDate = date || today;

  function goToReview() {
    if (!category) return setReviewError("Select a category.");
    if (!numAmt || numAmt <= 0) return setReviewError("Enter a valid amount.");
    if (!description.trim()) return setReviewError("Enter a description.");
    if (!paymentMethod) return setReviewError("Select a payment method.");
    if (isRecurring && !recurrence) return setReviewError("Select how often this recurs.");
    setReviewError("");
    setStep("review");
  }

  if (step === "review") {
    return (
      <form action={formAction} className="space-y-6">
        <input type="hidden" name="type" value={type} />
        <input type="hidden" name="category" value={category} />
        <input type="hidden" name="amount" value={amount} />
        {vatOn && <input type="hidden" name="vatOn" value="on" />}
        <input type="hidden" name="date" value={effectiveDate} />
        <input type="hidden" name="description" value={description} />
        <input type="hidden" name="supplier" value={supplier} />
        <input type="hidden" name="invoiceNumber" value={invoiceNumber} />
        <input type="hidden" name="paymentMethod" value={paymentMethod} />
        {isRecurring && <input type="hidden" name="isRecurring" value="on" />}
        <input type="hidden" name="recurrence" value={recurrence} />
        {isEquipment && <input type="hidden" name="unitCost" value={unitCost} />}
        {isEquipment && <input type="hidden" name="quantity" value={quantity} />}
        {isEquipment && isDepreciableAsset && <input type="hidden" name="isDepreciableAsset" value="on" />}

        {state.error && (
          <div className="flex items-center gap-2 rounded-lg border border-[var(--status-danger-text)]/20 bg-[var(--status-danger-bg)] px-4 py-3 text-sm text-[var(--status-danger-text)]">
            <AlertCircle size={16} />
            {state.error}
          </div>
        )}

        <Card className="p-5">
          <p className="mb-4 text-xs font-bold tracking-wider text-navy-300 uppercase">
            Confirm before saving
          </p>
          <div className="divide-y divide-navy-50 text-sm">
            <ReviewRow label={type === "income" ? "Income" : "Expense"} value={formatCurrency(totalAmt)} big />
            {vatOn && (
              <ReviewRow label="  incl. VAT (15%)" value={`${formatCurrency(numAmt)} + ${formatCurrency(vatAmt)} VAT`} />
            )}
            <ReviewRow label="Category" value={categoryLabel(category)} />
            <ReviewRow label="Date" value={formatDate(effectiveDate)} />
            <ReviewRow label="Description" value={description} />
            <ReviewRow label={type === "income" ? "Buyer" : "Supplier"} value={supplier || "—"} />
            <ReviewRow label="Invoice / Reference" value={invoiceNumber || "—"} />
            <ReviewRow
              label="Payment Method"
              value={PAYMENT_METHODS.find((p) => p.id === paymentMethod)?.label ?? "—"}
            />
            <ReviewRow
              label="Recurring"
              value={isRecurring ? (RECURRENCES.find((r) => r.id === recurrence)?.label ?? "Yes") : "No"}
            />
            {isEquipment && (unitCost || quantity) && (
              <>
                <ReviewRow label="Unit Cost" value={unitCost ? formatCurrency(Number(unitCost)) : "—"} />
                <ReviewRow label="Quantity" value={quantity || "—"} />
                <ReviewRow label="Depreciable Asset" value={isDepreciableAsset ? "Yes" : "No"} />
              </>
            )}
          </div>
        </Card>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setStep("form")}
            className="flex-1 rounded-xl border border-navy-100 py-3.5 text-sm font-bold text-navy-500 transition hover:bg-navy-25"
          >
            Back to Edit
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="flex-1 rounded-xl bg-navy-600 py-3.5 text-sm font-bold text-white shadow-lg transition hover:bg-navy-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? "Saving…" : "Confirm & Save"}
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="space-y-6">
      {reviewError && (
        <div className="flex items-center gap-2 rounded-lg border border-[var(--status-danger-text)]/20 bg-[var(--status-danger-bg)] px-4 py-3 text-sm text-[var(--status-danger-text)]">
          <AlertCircle size={16} />
          {reviewError}
        </div>
      )}

      {/* Type */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => {
            setType("income");
            setCategory("");
          }}
          className={`rounded-xl border-2 py-4 text-sm font-bold tracking-wide uppercase transition-colors ${
            type === "income"
              ? "border-[var(--status-success-text)] bg-[var(--status-success-text)] text-white"
              : "border-navy-100 text-navy-500 hover:bg-navy-25"
          }`}
        >
          Income
        </button>
        <button
          type="button"
          onClick={() => {
            setType("expense");
            setCategory("");
          }}
          className={`rounded-xl border-2 py-4 text-sm font-bold tracking-wide uppercase transition-colors ${
            type === "expense"
              ? "border-[var(--status-danger-text)] bg-[var(--status-danger-text)] text-white"
              : "border-navy-100 text-navy-500 hover:bg-navy-25"
          }`}
        >
          Expense
        </button>
      </div>

      {/* Amount + VAT */}
      <Card className="p-5">
        <label className="mb-2 block text-xs font-bold tracking-wider text-navy-300 uppercase">
          Amount (excl. VAT)
        </label>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-navy-600">R</span>
          <input
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full border-none text-4xl font-bold text-navy-600 outline-none"
          />
        </div>
        <label className="mt-4 flex items-center gap-2 border-t border-navy-50 pt-4 text-sm text-navy-500">
          <input
            type="checkbox"
            checked={vatOn}
            onChange={(e) => setVatOn(e.target.checked)}
            className="h-4 w-4 rounded border-navy-100"
          />
          Include VAT (15%)
        </label>
        {vatOn && numAmt > 0 && (
          <div className="mt-3 space-y-1.5 rounded-lg bg-navy-25 p-3 text-sm">
            <div className="flex justify-between text-navy-500">
              <span>Amount excl. VAT</span>
              <span className="font-medium text-navy-600">{formatCurrency(numAmt)}</span>
            </div>
            <div className="flex justify-between text-navy-500">
              <span>VAT (15%)</span>
              <span className="font-medium text-navy-600">{formatCurrency(vatAmt)}</span>
            </div>
            <div className="flex justify-between border-t border-navy-100 pt-1.5 font-semibold text-navy-600">
              <span>Total incl. VAT</span>
              <span>{formatCurrency(totalAmt)}</span>
            </div>
          </div>
        )}
      </Card>

      {/* Category */}
      <Card className="p-5">
        <p className="mb-3 text-xs font-bold tracking-wider text-navy-300 uppercase">Category</p>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {cats.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategory(c.id)}
              className={`rounded-lg border px-2 py-3 text-xs font-semibold transition-colors ${
                category === c.id
                  ? "border-navy-600 bg-navy-600 text-white"
                  : "border-navy-100 text-navy-500 hover:bg-navy-25"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </Card>

      {/* Details */}
      <Card className="space-y-4 p-5">
        <div>
          <label className="mb-1.5 block text-xs font-bold tracking-wider text-navy-300 uppercase">
            Date
          </label>
          <input
            type="date"
            value={effectiveDate}
            onChange={(e) => setDate(e.target.value)}
            max={today}
            className="w-full rounded-lg border border-navy-100 px-3 py-2 text-sm text-navy-600"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-bold tracking-wider text-navy-300 uppercase">
            Description
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What was this for?"
            className="w-full rounded-lg border border-navy-100 px-3 py-2 text-sm text-navy-600"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-bold tracking-wider text-navy-300 uppercase">
            {type === "income" ? "Buyer Name" : "Supplier Name"}
          </label>
          <input
            type="text"
            value={supplier}
            onChange={(e) => setSupplier(e.target.value)}
            className="w-full rounded-lg border border-navy-100 px-3 py-2 text-sm text-navy-600"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-bold tracking-wider text-navy-300 uppercase">
            Invoice / Reference Number
          </label>
          <input
            type="text"
            value={invoiceNumber}
            onChange={(e) => setInvoiceNumber(e.target.value)}
            placeholder={type === "income" ? suggestedInvoiceNumber : undefined}
            className="w-full rounded-lg border border-navy-100 px-3 py-2 text-sm text-navy-600"
          />
          {type === "income" && !invoiceNumber && (
            <button
              type="button"
              onClick={() => setInvoiceNumber(suggestedInvoiceNumber)}
              className="mt-1.5 text-xs font-semibold text-navy-400 hover:text-navy-600"
            >
              Use suggested: {suggestedInvoiceNumber}
            </button>
          )}
        </div>
      </Card>

      {/* Payment method */}
      <Card className="p-5">
        <p className="mb-3 text-xs font-bold tracking-wider text-navy-300 uppercase">
          Payment Method
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {PAYMENT_METHODS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPaymentMethod(p.id)}
              className={`rounded-lg border px-2 py-2.5 text-xs font-semibold transition-colors ${
                paymentMethod === p.id
                  ? "border-navy-600 bg-navy-600 text-white"
                  : "border-navy-100 text-navy-500 hover:bg-navy-25"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </Card>

      {/* Equipment details (F6) -- only for the Equipment category */}
      {isEquipment && (
        <Card className="space-y-4 p-5">
          <p className="text-xs font-bold tracking-wider text-navy-300 uppercase">
            Equipment Details
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-bold tracking-wider text-navy-300 uppercase">
                Unit Cost
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={unitCost}
                onChange={(e) => setUnitCost(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-lg border border-navy-100 px-3 py-2 text-sm text-navy-600"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold tracking-wider text-navy-300 uppercase">
                Quantity
              </label>
              <input
                type="number"
                step="1"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="1"
                className="w-full rounded-lg border border-navy-100 px-3 py-2 text-sm text-navy-600"
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-navy-500">
            <input
              type="checkbox"
              checked={isDepreciableAsset}
              onChange={(e) => setIsDepreciableAsset(e.target.checked)}
              className="h-4 w-4 rounded border-navy-100"
            />
            This is a depreciable asset
          </label>
        </Card>
      )}

      {/* Recurring */}
      <Card className="p-5">
        <label className="flex items-center gap-2 text-sm text-navy-500">
          <input
            type="checkbox"
            checked={isRecurring}
            onChange={(e) => {
              setIsRecurring(e.target.checked);
              if (!e.target.checked) setRecurrence("");
            }}
            className="h-4 w-4 rounded border-navy-100"
          />
          This transaction recurs
        </label>
        {isRecurring && (
          <div className="mt-3 grid grid-cols-3 gap-2">
            {RECURRENCES.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setRecurrence(r.id)}
                className={`rounded-lg border px-2 py-2.5 text-xs font-semibold transition-colors ${
                  recurrence === r.id
                    ? "border-navy-600 bg-navy-600 text-white"
                    : "border-navy-100 text-navy-500 hover:bg-navy-25"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        )}
      </Card>

      <button
        type="button"
        onClick={goToReview}
        className="w-full rounded-xl bg-navy-600 py-3.5 text-sm font-bold text-white shadow-lg transition hover:bg-navy-700"
      >
        Review Transaction
      </button>
    </div>
  );
}

function ReviewRow({ label, value, big }: { label: string; value: string; big?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <span className="text-navy-500">{label}</span>
      <span className={`font-semibold text-navy-600 ${big ? "text-lg" : ""}`}>{value}</span>
    </div>
  );
}
