import Link from "next/link";
import { PayoutsTable } from "./PayoutsTable";

export default function AdminPayoutsPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-navy-600">Seller Payouts</h1>
          <p className="mt-1 text-sm text-navy-400">
            Track what HerdFlow owes each seller and settle it via EFT.
          </p>
        </div>
        <Link href="/admin" className="text-sm text-green hover:underline">
          ← Dashboard
        </Link>
      </div>

      <PayoutsTable kind="seller" />
    </div>
  );
}
