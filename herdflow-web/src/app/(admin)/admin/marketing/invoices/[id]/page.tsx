"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { DocumentView } from "@/components/marketing/DocumentView";

type InvoiceDetail = {
  id: string;
  number: string;
  description: string;
  amount: string;
  status: string;
  dueDate: string;
  issueDate: string;
  notes: string | null;
  paymentReference: string | null;
  sentAt: string | null;
  sponsor: {
    companyName: string;
    contactPerson: string;
    email: string;
    phone: string;
    website: string | null;
  };
};

export default function InvoiceDetailPage() {
  const params = useParams<{ id: string }>();
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [paymentReference, setPaymentReference] = useState("");
  const [showPaidForm, setShowPaidForm] = useState(false);

  function load() {
    setLoading(true);
    fetch(`/api/admin/marketing/invoices/${params.id}`)
      .then((r) => r.json())
      .then((d) => setInvoice(d.invoice))
      .finally(() => setLoading(false));
  }

  useEffect(load, [params.id]);

  async function sendInvoice() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/marketing/invoices/${params.id}/send`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to send.");
        return;
      }
      setInvoice(data.invoice);
    } finally {
      setBusy(false);
    }
  }

  async function markPaid() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/marketing/invoices/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "PAID", paymentReference: paymentReference || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to update.");
        return;
      }
      setInvoice(data.invoice);
      setShowPaidForm(false);
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <p className="p-8 text-center text-sm text-[#5d7497]">Loading…</p>;
  if (!invoice) return <p className="p-8 text-center text-sm text-red-600">Invoice not found.</p>;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between print:hidden">
        <Link href="/admin/marketing/invoices" className="text-sm text-[#2E7D32] hover:underline">
          ← Invoices
        </Link>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>

      {showPaidForm && (
        <div className="mx-auto mb-4 flex max-w-3xl items-center gap-3 rounded-lg border border-[#e4ebf5] bg-white p-4 print:hidden">
          <input
            value={paymentReference}
            onChange={(e) => setPaymentReference(e.target.value)}
            placeholder="Payment reference (optional)"
            className="flex-1 rounded-lg border border-[#cdd8e7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30"
          />
          <button
            type="button"
            disabled={busy}
            onClick={markPaid}
            className="rounded-lg bg-[#2E7D32] px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
          >
            Confirm Paid
          </button>
        </div>
      )}

      <DocumentView
        kind="invoice"
        number={invoice.number}
        status={invoice.status}
        issueDate={invoice.issueDate}
        validUntilOrDueDate={invoice.dueDate}
        sponsor={invoice.sponsor}
        description={invoice.description}
        amount={invoice.amount}
        notes={
          invoice.paymentReference
            ? `${invoice.notes ? invoice.notes + " — " : ""}Payment ref: ${invoice.paymentReference}`
            : invoice.notes
        }
        actions={
          <>
            <button
              type="button"
              onClick={() => window.print()}
              className="rounded-lg border border-[#cdd8e7] px-4 py-2 text-sm font-bold text-[#5d7497] hover:border-[#1B3A6B]"
            >
              Print / Save as PDF
            </button>
            {!invoice.sentAt && invoice.status === "UNPAID" && (
              <button
                type="button"
                disabled={busy}
                onClick={sendInvoice}
                className="rounded-lg bg-[#1B3A6B] px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
              >
                Send to Sponsor
              </button>
            )}
            {invoice.status === "UNPAID" && (
              <button
                type="button"
                disabled={busy}
                onClick={() => setShowPaidForm(true)}
                className="rounded-lg bg-[#2E7D32] px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
              >
                Mark Paid
              </button>
            )}
          </>
        }
      />
    </div>
  );
}
