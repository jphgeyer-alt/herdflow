"use client";

import { useActionState, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { AlertCircle } from "lucide-react";
import { INCOME_CATS, EXPENSE_CATS, categoryLabelKey } from "@/lib/farm-finance/categories";
import { formatCurrency, formatDate } from "@/lib/farm-finance/format";
import { getComplianceConfig } from "@/lib/farm-finance/complianceConfig";
import { Card } from "@/components/farm/Card";
import { useActionToast } from "@/components/farm/useActionToast";
import { addTransaction, type AddTransactionState } from "./actions";

const initialState: AddTransactionState = {};

const PAYMENT_METHODS = ["CASH", "BANK_TRANSFER", "CARD", "OTHER"] as const;
const RECURRENCES = ["WEEKLY", "MONTHLY", "ANNUALLY"] as const;

function paymentMethodLabelKey(id: string): string {
  return `payment_method_${id.toLowerCase()}`;
}
function recurrenceLabelKey(id: string): string {
  return `recurrence_${id.toLowerCase()}`;
}

export function AddTransactionForm({
  suggestedInvoiceNumber,
  country,
}: {
  suggestedInvoiceNumber: string;
  country: string;
}) {
  const t = useTranslations("finance");
  const [state, formAction, isPending] = useActionState(addTransaction, initialState);
  useActionToast(state);
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
  const vatRate = getComplianceConfig(country).vatRate;
  const vatRatePct = vatRate * 100;
  const vatAmt = vatOn ? Math.round(numAmt * vatRate * 100) / 100 : 0;
  const totalAmt = numAmt + vatAmt;
  const isEquipment = type === "expense" && category === "equipment";

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const effectiveDate = date || today;

  function goToReview() {
    if (!category) return setReviewError(t("select_category"));
    if (!numAmt || numAmt <= 0) return setReviewError(t("enter_valid_amount"));
    if (!description.trim()) return setReviewError(t("enter_description"));
    if (!paymentMethod) return setReviewError(t("select_payment_method"));
    if (isRecurring && !recurrence) return setReviewError(t("select_recurrence"));
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
            {t("confirm_before_saving")}
          </p>
          <div className="divide-y divide-navy-50 text-sm">
            <ReviewRow label={type === "income" ? t("income_type") : t("expense_type")} value={formatCurrency(totalAmt)} big />
            {vatOn && (
              <ReviewRow label={t("vat_amount", { rate: vatRatePct })} value={`${formatCurrency(numAmt)} + ${formatCurrency(vatAmt)} VAT`} />
            )}
            <ReviewRow label={t("category")} value={t(categoryLabelKey(category))} />
            <ReviewRow label={t("date")} value={formatDate(effectiveDate)} />
            <ReviewRow label={t("description")} value={description} />
            <ReviewRow label={type === "income" ? t("buyer") : t("supplier")} value={supplier || "—"} />
            <ReviewRow label={t("invoice_reference")} value={invoiceNumber || "—"} />
            <ReviewRow
              label={t("payment_method")}
              value={paymentMethod ? t(paymentMethodLabelKey(paymentMethod)) : "—"}
            />
            <ReviewRow
              label={t("recurring")}
              value={isRecurring ? (recurrence ? t(recurrenceLabelKey(recurrence)) : t("yes")) : t("no")}
            />
            {isEquipment && (unitCost || quantity) && (
              <>
                <ReviewRow label={t("unit_cost")} value={unitCost ? formatCurrency(Number(unitCost)) : "—"} />
                <ReviewRow label={t("quantity")} value={quantity || "—"} />
                <ReviewRow label={t("depreciable_asset")} value={isDepreciableAsset ? t("yes") : t("no")} />
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
            {t("back_to_edit")}
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="flex-1 rounded-xl bg-navy-600 py-3.5 text-sm font-bold text-white shadow-lg transition hover:bg-navy-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? t("saving") : t("confirm_and_save")}
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
          className={`rounded-lg border-2 py-4 text-sm font-bold tracking-wide uppercase transition-colors ${
            type === "income"
              ? "border-[var(--status-success-text)] bg-[var(--status-success-text)] text-white"
              : "border-navy-100 text-navy-500 hover:bg-navy-25"
          }`}
        >
          {t("income")}
        </button>
        <button
          type="button"
          onClick={() => {
            setType("expense");
            setCategory("");
          }}
          className={`rounded-lg border-2 py-4 text-sm font-bold tracking-wide uppercase transition-colors ${
            type === "expense"
              ? "border-[var(--status-danger-text)] bg-[var(--status-danger-text)] text-white"
              : "border-navy-100 text-navy-500 hover:bg-navy-25"
          }`}
        >
          {t("expenses")}
        </button>
      </div>

      {/* Amount + VAT */}
      <Card className="p-5">
        <label className="mb-2 block text-xs font-bold tracking-wider text-navy-300 uppercase">
          {t("amount_excl_vat")}
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
          {t("include_vat", { rate: vatRatePct })}
        </label>
        {vatOn && numAmt > 0 && (
          <div className="mt-3 space-y-1.5 rounded-lg bg-navy-25 p-3 text-sm">
            <div className="flex justify-between text-navy-500">
              <span>{t("amount_excl_vat")}</span>
              <span className="font-medium text-navy-600">{formatCurrency(numAmt)}</span>
            </div>
            <div className="flex justify-between text-navy-500">
              <span>{t("vat_amount", { rate: vatRatePct })}</span>
              <span className="font-medium text-navy-600">{formatCurrency(vatAmt)}</span>
            </div>
            <div className="flex justify-between border-t border-navy-100 pt-1.5 font-semibold text-navy-600">
              <span>{t("total_incl_vat")}</span>
              <span>{formatCurrency(totalAmt)}</span>
            </div>
          </div>
        )}
      </Card>

      {/* Category */}
      <Card className="p-5">
        <p className="mb-3 text-xs font-bold tracking-wider text-navy-300 uppercase">{t("category")}</p>
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
              {t(categoryLabelKey(c.id))}
            </button>
          ))}
        </div>
      </Card>

      {/* Details */}
      <Card className="space-y-4 p-5">
        <div>
          <label className="mb-1.5 block text-xs font-bold tracking-wider text-navy-300 uppercase">
            {t("date")}
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
            {t("description")}
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t("what_was_this_for")}
            className="w-full rounded-lg border border-navy-100 px-3 py-2 text-sm text-navy-600"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-bold tracking-wider text-navy-300 uppercase">
            {type === "income" ? t("buyer_name") : t("supplier_name")}
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
            {t("invoice_reference_number")}
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
              {t("use_suggested_invoice", { number: suggestedInvoiceNumber })}
            </button>
          )}
        </div>
      </Card>

      {/* Payment method */}
      <Card className="p-5">
        <p className="mb-3 text-xs font-bold tracking-wider text-navy-300 uppercase">
          {t("payment_method")}
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {PAYMENT_METHODS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPaymentMethod(p)}
              className={`rounded-lg border px-2 py-2.5 text-xs font-semibold transition-colors ${
                paymentMethod === p
                  ? "border-navy-600 bg-navy-600 text-white"
                  : "border-navy-100 text-navy-500 hover:bg-navy-25"
              }`}
            >
              {t(paymentMethodLabelKey(p))}
            </button>
          ))}
        </div>
      </Card>

      {/* Equipment details (F6) -- only for the Equipment category */}
      {isEquipment && (
        <Card className="space-y-4 p-5">
          <p className="text-xs font-bold tracking-wider text-navy-300 uppercase">
            {t("equipment_details")}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-bold tracking-wider text-navy-300 uppercase">
                {t("unit_cost")}
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
                {t("quantity")}
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
            {t("is_depreciable_asset")}
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
          {t("is_recurring")}
        </label>
        {isRecurring && (
          <div className="mt-3 grid grid-cols-3 gap-2">
            {RECURRENCES.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRecurrence(r)}
                className={`rounded-lg border px-2 py-2.5 text-xs font-semibold transition-colors ${
                  recurrence === r
                    ? "border-navy-600 bg-navy-600 text-white"
                    : "border-navy-100 text-navy-500 hover:bg-navy-25"
                }`}
              >
                {t(recurrenceLabelKey(r))}
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
        {t("review_transaction")}
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
