"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { DocumentView } from "@/components/marketing/DocumentView";
import { Button } from "@/components/admin/Button";
import { Input } from "@/components/admin/Field";

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

  if (loading) return <p className="p-8 text-center text-sm text-navy-300">Loading…</p>;
  if (!invoice) return <p className="p-8 text-center text-sm text-red-600">Invoice not found.</p>;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between print:hidden">
        <Link href="/admin/marketing/invoices" className="text-green text-sm hover:underline">
          ← Invoices
        </Link>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>

      {showPaidForm && (
        <div className="mx-auto mb-4 flex max-w-3xl items-center gap-3 rounded-lg border border-navy-50 bg-white p-4 print:hidden">
          <Input
            value={paymentReference}
            onChange={(e) => setPaymentReference(e.target.value)}
            placeholder="Payment reference (optional)"
            className="flex-1"
          />
          <Button loading={busy} onClick={markPaid}>
            Confirm Paid
          </Button>
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
            <Button variant="outline" onClick={() => window.print()}>
              Print / Save as PDF
            </Button>
            {!invoice.sentAt && invoice.status === "UNPAID" && (
              <Button loading={busy} onClick={sendInvoice}>
                Send to Sponsor
              </Button>
            )}
            {invoice.status === "UNPAID" && (
              <Button variant="secondary" loading={busy} onClick={() => setShowPaidForm(true)}>
                Mark Paid
              </Button>
            )}
          </>
        }
      />
    </div>
  );
}
