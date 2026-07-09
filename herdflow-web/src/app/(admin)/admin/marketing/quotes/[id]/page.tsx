"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { DocumentView } from "@/components/marketing/DocumentView";

type QuoteDetail = {
  id: string;
  number: string;
  description: string;
  amount: string;
  status: string;
  validUntil: string;
  createdAt: string;
  notes: string | null;
  sponsor: {
    companyName: string;
    contactPerson: string;
    email: string;
    phone: string;
    website: string | null;
  };
};

export default function QuoteDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [quote, setQuote] = useState<QuoteDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function load() {
    setLoading(true);
    fetch(`/api/admin/marketing/quotes/${params.id}`)
      .then((r) => r.json())
      .then((d) => setQuote(d.quote))
      .finally(() => setLoading(false));
  }

  useEffect(load, [params.id]);

  async function setStatus(status: string) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/marketing/quotes/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to update.");
        return;
      }
      setQuote(data.quote);
    } finally {
      setBusy(false);
    }
  }

  async function sendQuote() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/marketing/quotes/${params.id}/send`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to send.");
        return;
      }
      setQuote(data.quote);
    } finally {
      setBusy(false);
    }
  }

  async function convertToInvoice() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/marketing/quotes/${params.id}/convert`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to convert.");
        return;
      }
      router.push(`/admin/marketing/invoices/${data.invoice.id}`);
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <p className="p-8 text-center text-sm text-[#5d7497]">Loading…</p>;
  if (!quote) return <p className="p-8 text-center text-sm text-red-600">Quote not found.</p>;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between print:hidden">
        <Link href="/admin/marketing/quotes" className="text-sm text-[#2E7D32] hover:underline">
          ← Quotes
        </Link>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>

      <DocumentView
        kind="quote"
        number={quote.number}
        status={quote.status}
        issueDate={quote.createdAt}
        validUntilOrDueDate={quote.validUntil}
        sponsor={quote.sponsor}
        description={quote.description}
        amount={quote.amount}
        notes={quote.notes}
        actions={
          <>
            <button
              type="button"
              onClick={() => window.print()}
              className="rounded-lg border border-[#cdd8e7] px-4 py-2 text-sm font-bold text-[#5d7497] hover:border-[#1B3A6B]"
            >
              Print / Save as PDF
            </button>
            {quote.status === "DRAFT" && (
              <button
                type="button"
                disabled={busy}
                onClick={sendQuote}
                className="rounded-lg bg-[#1B3A6B] px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
              >
                Mark Sent (emails sponsor)
              </button>
            )}
            {quote.status === "SENT" && (
              <>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setStatus("ACCEPTED")}
                  className="rounded-lg bg-[#2E7D32] px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
                >
                  Mark Accepted
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setStatus("DECLINED")}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
                >
                  Mark Declined
                </button>
              </>
            )}
            {quote.status === "ACCEPTED" && (
              <button
                type="button"
                disabled={busy}
                onClick={convertToInvoice}
                className="rounded-lg bg-[#2E7D32] px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
              >
                Convert to Invoice
              </button>
            )}
          </>
        }
      />
    </div>
  );
}
