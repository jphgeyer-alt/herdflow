"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, X, AlertTriangle, Download, ArrowLeft } from "lucide-react";

type Reg = {
  id: string; biddingNumber: string; fullName: string; email: string; phone: string;
  idNumber: string; province: string; status: string; depositPaid: boolean;
  termsAccepted: boolean; createdAt: string; adminNotes: string | null;
  approvedAt: string | null; bankName: string | null; accountNumber: string | null;
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  APPROVED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-700",
  SUSPENDED: "bg-orange-100 text-orange-800",
};

export default function AdminRegistrationsPage() {
  const params = useParams();
  const sessionId = params.id as string;

  const [registrations, setRegistrations] = useState<Reg[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("ALL");
  const [selected, setSelected] = useState<Reg | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [toast, setToast] = useState("");

  useEffect(() => {
    fetch(`/api/admin/auctions/${sessionId}/registrations`)
      .then((r) => r.json())
      .then((d) => setRegistrations(d.registrations || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [sessionId]);

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(""), 3000); }

  async function updateStatus(id: string, status: string, notes?: string) {
    setSaving(id);
    const res = await fetch(`/api/admin/auctions/${sessionId}/registrations`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status, adminNotes: notes }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(null);
    if (!res.ok) { showToast("Failed to update"); return; }
    setRegistrations((prev) => prev.map((r) => r.id === id ? { ...r, ...data.registration } : r));
    if (selected?.id === id) setSelected({ ...selected, ...data.registration });
    showToast(`${status === "APPROVED" ? "Approved" : "Updated"} — ${data.registration?.fullName}`);
  }

  function exportCSV() {
    const rows = filtered.map((r) => [r.biddingNumber, r.fullName, r.email, r.phone, r.idNumber, r.province, r.status, new Date(r.createdAt).toLocaleDateString("en-ZA")]);
    const header = ["Bidding #", "Name", "Email", "Phone", "ID Number", "Province", "Status", "Registered"];
    const csv = [header, ...rows].map((row) => row.map((v) => `"${v}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `registrations-${sessionId}.csv`;
    a.click();
  }

  const filtered = filter === "ALL" ? registrations : registrations.filter((r) => r.status === filter);
  const stats = {
    total: registrations.length,
    pending: registrations.filter((r) => r.status === "PENDING").length,
    approved: registrations.filter((r) => r.status === "APPROVED").length,
    rejected: registrations.filter((r) => r.status === "REJECTED").length,
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-[#1B3A6B] text-white px-4 py-3 rounded-xl shadow-xl text-sm font-semibold">{toast}</div>
      )}

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-[#1B3A6B] text-lg">{selected.fullName}</h3>
              <button onClick={() => setSelected(null)} className="p-1.5 hover:bg-[#f0f4fb] rounded-lg"><X size={18} /></button>
            </div>
            <div className="space-y-2 text-sm">
              {[
                ["Bidding Number", selected.biddingNumber],
                ["Email", selected.email],
                ["Phone", selected.phone],
                ["ID Number", selected.idNumber],
                ["Province", selected.province],
                ["Bank", selected.bankName || "—"],
                ["Account", selected.accountNumber || "—"],
                ["Registered", new Date(selected.createdAt).toLocaleDateString("en-ZA")],
                ["Terms Accepted", selected.termsAccepted ? "Yes" : "No"],
                ["Status", selected.status],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between py-1 border-b border-[#f0f4fb]">
                  <span className="text-[#5d7497]">{label}</span>
                  <span className="font-semibold text-[#244367]">{value}</span>
                </div>
              ))}
              {selected.adminNotes && (
                <div className="mt-2 p-3 bg-amber-50 rounded-lg text-xs text-amber-800">
                  <strong>Admin notes:</strong> {selected.adminNotes}
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-5">
              {selected.status !== "APPROVED" && (
                <button onClick={() => { updateStatus(selected.id, "APPROVED"); setSelected(null); }} disabled={saving === selected.id} className="flex-1 py-2 bg-[#2E7D32] hover:bg-[#1d5e20] text-white text-sm font-bold rounded-lg transition disabled:opacity-50">
                  Approve
                </button>
              )}
              {selected.status !== "REJECTED" && (
                <button onClick={() => { updateStatus(selected.id, "REJECTED"); setSelected(null); }} disabled={saving === selected.id} className="flex-1 py-2 border-2 border-red-600 text-red-600 hover:bg-red-600 hover:text-white text-sm font-bold rounded-lg transition disabled:opacity-50">
                  Reject
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <Link href={`/admin/auctions`} className="flex items-center gap-1 text-sm text-[#2E7D32] hover:underline mb-1"><ArrowLeft size={14} />Back to Auctions</Link>
          <h1 className="text-2xl font-black text-[#1B3A6B]">Buyer Registrations</h1>
        </div>
        <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 border border-[#cdd8e7] rounded-lg text-sm font-semibold text-[#244367] hover:border-[#1B3A6B] transition">
          <Download size={16} /> Export CSV
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Registered", value: stats.total, color: "text-[#1B3A6B]" },
          { label: "Pending Approval", value: stats.pending, color: "text-amber-700" },
          { label: "Approved Bidders", value: stats.approved, color: "text-[#2E7D32]" },
          { label: "Rejected", value: stats.rejected, color: "text-red-700" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-[#e4ebf5] shadow-sm p-4">
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-xs text-[#5d7497] mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {(["ALL", "PENDING", "APPROVED", "REJECTED"] as const).map((tab) => (
          <button key={tab} onClick={() => setFilter(tab)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition ${filter === tab ? "bg-[#1B3A6B] text-white" : "bg-white border border-[#cdd8e7] text-[#5d7497] hover:border-[#1B3A6B]"}`}>
            {tab} {tab === "ALL" ? `(${stats.total})` : tab === "PENDING" ? `(${stats.pending})` : tab === "APPROVED" ? `(${stats.approved})` : `(${stats.rejected})`}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-[#e4ebf5] shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-[#5d7497] text-sm">Loading registrations…</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-[#5d7497] text-sm">No registrations found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#f5f8fd] text-xs font-semibold text-[#5d7497] uppercase tracking-wide border-b border-[#e4ebf5]">
                <tr>
                  <th className="px-4 py-3 text-left">Bidding #</th>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left hidden md:table-cell">Email</th>
                  <th className="px-4 py-3 text-left hidden lg:table-cell">Province</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left hidden sm:table-cell">Registered</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f4fb]">
                {filtered.map((reg) => (
                  <tr key={reg.id} className="hover:bg-[#f8fafd] transition">
                    <td className="px-4 py-3 font-mono font-bold text-[#1B3A6B]">{reg.biddingNumber}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => setSelected(reg)} className="font-semibold text-[#1B3A6B] hover:underline text-left">{reg.fullName}</button>
                    </td>
                    <td className="px-4 py-3 text-[#5d7497] hidden md:table-cell">{reg.email}</td>
                    <td className="px-4 py-3 text-[#5d7497] hidden lg:table-cell">{reg.province}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${STATUS_COLORS[reg.status] ?? "bg-gray-100"}`}>{reg.status}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-[#9aabb9] hidden sm:table-cell">{new Date(reg.createdAt).toLocaleDateString("en-ZA")}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5">
                        {reg.status !== "APPROVED" && (
                          <button onClick={() => updateStatus(reg.id, "APPROVED")} disabled={saving === reg.id}
                            className="p-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg transition disabled:opacity-50" title="Approve">
                            <CheckCircle size={14} />
                          </button>
                        )}
                        {reg.status !== "REJECTED" && (
                          <button onClick={() => updateStatus(reg.id, "REJECTED")} disabled={saving === reg.id}
                            className="p-1.5 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg transition disabled:opacity-50" title="Reject">
                            <X size={14} />
                          </button>
                        )}
                        <button onClick={() => setSelected(reg)} className="p-1.5 bg-[#f0f4fb] text-[#5d7497] hover:bg-[#e4ebf5] rounded-lg transition" title="Details">
                          ···
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
