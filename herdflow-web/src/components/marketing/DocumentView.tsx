import type { ReactNode } from "react";
import { formatRand } from "@/lib/marketing/format";

type SponsorInfo = {
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  website?: string | null;
};

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-600",
  SENT: "bg-blue-100 text-blue-700",
  ACCEPTED: "bg-green-100 text-green-700",
  PAID: "bg-green-100 text-green-700",
  DECLINED: "bg-red-100 text-red-700",
  CANCELLED: "bg-red-100 text-red-700",
  EXPIRED: "bg-slate-100 text-slate-500",
  UNPAID: "bg-amber-100 text-amber-700",
  OVERDUE: "bg-red-100 text-red-700",
};

function formatDate(value: string | Date) {
  return new Date(value).toLocaleDateString("en-ZA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function DocumentView({
  kind,
  number,
  status,
  issueDate,
  validUntilOrDueDate,
  sponsor,
  description,
  amount,
  notes,
  actions,
}: {
  kind: "quote" | "invoice";
  number: string;
  status: string;
  issueDate: string | Date;
  validUntilOrDueDate: string | Date;
  sponsor: SponsorInfo;
  description: string;
  amount: string | number;
  notes?: string | null;
  actions?: ReactNode;
}) {
  const title = kind === "quote" ? "Sponsorship Quote" : "Invoice";
  const dateLabel = kind === "quote" ? "Valid Until" : "Due Date";

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 print:px-0 print:py-0">
      {actions && <div className="mb-6 flex justify-end gap-3 print:hidden">{actions}</div>}

      <div className="rounded-2xl border border-[#e4ebf5] bg-white p-8 shadow-sm print:rounded-none print:border-0 print:shadow-none">
        {/* Letterhead */}
        <div className="flex items-start justify-between border-b border-[#e4ebf5] pb-6">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#2E7D32] font-bold text-white">
                HF
              </div>
              <div>
                <p className="text-lg font-black text-[#1B3A6B]">HerdFlow</p>
                <p className="text-xs text-[#5d7497]">A division of Geyer Holdings</p>
              </div>
            </div>
          </div>
          <div className="text-right">
            <h1 className="text-2xl font-black text-[#1B3A6B]">{title}</h1>
            <p className="mt-1 text-sm text-[#5d7497]">{number}</p>
            <span
              className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${STATUS_COLORS[status] || "bg-slate-100 text-slate-600"}`}
            >
              {status}
            </span>
          </div>
        </div>

        {/* Billing details */}
        <div className="grid grid-cols-2 gap-6 py-6">
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-wide text-[#9aabb9]">Bill To</p>
            <p className="font-bold text-[#244367]">{sponsor.companyName}</p>
            <p className="text-sm text-[#5d7497]">{sponsor.contactPerson}</p>
            <p className="text-sm text-[#5d7497]">{sponsor.email}</p>
            <p className="text-sm text-[#5d7497]">{sponsor.phone}</p>
          </div>
          <div className="text-right">
            <p className="mb-1 text-xs font-bold uppercase tracking-wide text-[#9aabb9]">
              {kind === "quote" ? "Quote Date" : "Issue Date"}
            </p>
            <p className="text-sm text-[#244367]">{formatDate(issueDate)}</p>
            <p className="mb-1 mt-3 text-xs font-bold uppercase tracking-wide text-[#9aabb9]">
              {dateLabel}
            </p>
            <p className="text-sm text-[#244367]">{formatDate(validUntilOrDueDate)}</p>
          </div>
        </div>

        {/* Line item */}
        <table className="w-full border-t border-[#e4ebf5] text-left text-sm">
          <thead>
            <tr className="text-xs font-bold uppercase tracking-wide text-[#9aabb9]">
              <th className="py-3">Description</th>
              <th className="py-3 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-[#e4ebf5]">
              <td className="py-4 text-[#244367]">{description}</td>
              <td className="py-4 text-right font-bold text-[#244367]">{formatRand(amount)}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-[#1B3A6B]">
              <td className="py-4 text-right font-bold text-[#1B3A6B]">Total</td>
              <td className="py-4 text-right text-lg font-black text-[#1B3A6B]">
                {formatRand(amount)}
              </td>
            </tr>
          </tfoot>
        </table>

        {notes && (
          <div className="mt-6 rounded-lg bg-[#f5f8fd] p-4">
            <p className="mb-1 text-xs font-bold uppercase tracking-wide text-[#9aabb9]">Notes</p>
            <p className="text-sm text-[#5d7497]">{notes}</p>
          </div>
        )}

        {/* Footer / payment terms */}
        <div className="mt-8 border-t border-[#e4ebf5] pt-6 text-sm text-[#5d7497]">
          <p>
            Payment is made via EFT. Contact us at{" "}
            <a href="mailto:info@herdflow.co.za" className="text-[#1B3A6B] underline">
              info@herdflow.co.za
            </a>{" "}
            or +27 60 522 6267 for banking details to complete payment.
          </p>
          <p className="mt-2 text-xs text-[#9aabb9]">
            © {new Date().getFullYear()} HerdFlow — A division of Geyer Holdings, North West
            Province, South Africa
          </p>
        </div>
      </div>
    </div>
  );
}
