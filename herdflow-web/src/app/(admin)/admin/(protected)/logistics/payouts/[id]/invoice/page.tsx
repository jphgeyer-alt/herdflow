"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/admin/Button";
import { formatRand } from "@/lib/marketing/format";

type PayoutInvoice = {
  id: string;
  number: string;
  amountCents: number;
  status: string;
  paymentReference: string | null;
  createdAt: string;
  paidAt: string | null;
  logisticsPartner: { companyName: string };
  deliveries: {
    id: string;
    number: string;
    cargoDescription: string;
    priceCents: number | null;
    commissionCents: number;
    deliveredAt: string | null;
  }[];
};

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-ZA", { dateStyle: "medium" }).format(new Date(value));
}

export default function LogisticsPayoutInvoicePage() {
  const params = useParams<{ id: string }>();
  const [payout, setPayout] = useState<PayoutInvoice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/logistics/payouts/${params.id}`)
      .then((r) => r.json())
      .then((d) => setPayout(d.payout))
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) return <p className="p-8 text-center text-sm text-navy-300">Loading…</p>;
  if (!payout) return <p className="p-8 text-center text-sm text-red-600">Payout not found.</p>;

  const grossCents = payout.deliveries.reduce((sum, d) => sum + (d.priceCents ?? 0), 0);
  const commissionCents = payout.deliveries.reduce((sum, d) => sum + d.commissionCents, 0);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between print:hidden">
        <Link href="/admin/logistics/payouts" className="text-green text-sm hover:underline">
          ← Logistics Payouts
        </Link>
        <Button variant="outline" onClick={() => window.print()}>
          Print / Save as PDF
        </Button>
      </div>

      <div className="mx-auto max-w-3xl rounded-xl border border-navy-50 bg-white p-8 shadow-sm print:border-0 print:shadow-none">
        <div className="mb-8 flex items-start justify-between border-b border-navy-50 pb-6">
          <div>
            <h1 className="text-2xl font-black text-[#1B3A6B]">HerdFlow</h1>
            <p className="text-sm text-navy-400">Transport Partner Remittance Advice</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-navy-600">{payout.number}</p>
            <p className="text-xs text-navy-300">Issued {formatDate(payout.createdAt)}</p>
            <p className="text-xs text-navy-300">
              Status: <span className="font-semibold">{payout.status}</span>
            </p>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-navy-300">Paid To</p>
          <p className="font-semibold text-navy-600">{payout.logisticsPartner.companyName}</p>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-navy-50 text-left text-xs font-semibold uppercase tracking-wide text-navy-300">
              <th className="py-2">Delivery</th>
              <th className="py-2">Cargo</th>
              <th className="py-2">Delivered</th>
              <th className="py-2 text-right">Job Price</th>
              <th className="py-2 text-right">Commission (4%)</th>
              <th className="py-2 text-right">Net</th>
            </tr>
          </thead>
          <tbody>
            {payout.deliveries.map((d) => (
              <tr key={d.id} className="border-b border-navy-25">
                <td className="py-2 font-semibold text-navy-600">{d.number}</td>
                <td className="py-2 text-navy-500">{d.cargoDescription}</td>
                <td className="py-2 text-navy-400">{formatDate(d.deliveredAt)}</td>
                <td className="py-2 text-right">{formatRand((d.priceCents ?? 0) / 100)}</td>
                <td className="py-2 text-right">{formatRand(d.commissionCents / 100)}</td>
                <td className="py-2 text-right font-semibold text-navy-600">
                  {formatRand(((d.priceCents ?? 0) - d.commissionCents) / 100)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-6 flex justify-end">
          <div className="w-64 space-y-1 text-sm">
            <div className="flex justify-between text-navy-400">
              <span>Gross Job Value</span>
              <span>{formatRand(grossCents / 100)}</span>
            </div>
            <div className="flex justify-between text-navy-400">
              <span>HerdFlow Commission</span>
              <span>-{formatRand(commissionCents / 100)}</span>
            </div>
            <div className="flex justify-between border-t border-navy-100 pt-2 text-base font-black text-[#1B3A6B]">
              <span>Amount Paid</span>
              <span>{formatRand(payout.amountCents / 100)}</span>
            </div>
          </div>
        </div>

        {payout.paymentReference && (
          <p className="mt-6 text-xs text-navy-300">Payment reference: {payout.paymentReference}</p>
        )}
      </div>
    </div>
  );
}
