"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { DocumentView } from "@/components/marketing/DocumentView";
import { Button } from "@/components/admin/Button";

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

  if (loading) return <p className="p-8 text-center text-sm text-navy-300">Loading…</p>;
  if (!quote) return <p className="p-8 text-center text-sm text-red-600">Quote not found.</p>;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between print:hidden">
        <Link href="/admin/marketing/quotes" className="text-green text-sm hover:underline">
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
            <Button variant="outline" onClick={() => window.print()}>
              Print / Save as PDF
            </Button>
            {quote.status === "DRAFT" && (
              <Button loading={busy} onClick={sendQuote}>
                Mark Sent (emails sponsor)
              </Button>
            )}
            {quote.status === "SENT" && (
              <>
                <Button variant="secondary" loading={busy} onClick={() => setStatus("ACCEPTED")}>
                  Mark Accepted
                </Button>
                <Button variant="danger" loading={busy} onClick={() => setStatus("DECLINED")}>
                  Mark Declined
                </Button>
              </>
            )}
            {quote.status === "ACCEPTED" && (
              <Button variant="secondary" loading={busy} onClick={convertToInvoice}>
                Convert to Invoice
              </Button>
            )}
          </>
        }
      />
    </div>
  );
}
