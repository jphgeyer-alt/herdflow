"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle, AlertTriangle, User, MapPin, CreditCard, FileText, ChevronRight } from "lucide-react";

const PROVINCES = ["Eastern Cape", "Free State", "Gauteng", "KwaZulu-Natal", "Limpopo", "Mpumalanga", "Northern Cape", "North West", "Western Cape"];
const BANKS = ["ABSA", "Standard Bank", "FNB", "Nedbank", "Capitec", "African Bank", "Other"];

type Session = {
  id: string; title: string; scheduledAt: string; status: string;
  description: string; maxBidders: number | null; regCount: number; lotCount: number;
};

type Registration = { id: string; biddingNumber: string; status: string; fullName: string };

const TERMS = `HERDFLOW AUCTION TERMS AND CONDITIONS

1. BINDING PURCHASE AGREEMENT
By placing a winning bid, you enter into a legally binding purchase agreement. The winning bid constitutes a contract of sale between the buyer and the seller, facilitated by HerdFlow.

2. COMMISSION
A 5% (plus VAT) buyer's commission is added to the hammer price. This commission is payable by the purchaser in addition to the hammer price.

3. PAYMENT TERMS
Full payment (hammer price + commission + VAT) is due within 48 hours of the auction closing. Failure to pay within this timeframe may result in the lot being re-offered and legal action being taken.

4. COLLECTION AND TRANSPORT
Transport and collection of purchased lots is the sole responsibility of the buyer. HerdFlow can assist with connecting buyers to registered logistics partners. Risk passes to the buyer upon payment.

5. VERIFICATION
HerdFlow Trusted verification is required. All registered bidders have undergone identity verification. Providing false information during registration is grounds for immediate suspension.

6. HERDFLOW AS AGENT
HerdFlow acts as agent for the seller. HerdFlow is not the principal in any transaction and accepts no liability for the condition, description, or title of any lot offered at auction.

7. RESERVE PRICES
All lots are offered subject to a reserve price set by the seller. HerdFlow reserves the right to bid on behalf of the seller up to the reserve price.

8. DISPUTES
Any disputes regarding lots must be raised within 24 hours of the auction closing. HerdFlow's decision in all disputes is final.`;

export default function AuctionRegisterPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [existing, setExisting] = useState<Registration | null>(null);
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<Registration | null>(null);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    fullName: "", email: "", phone: "", idNumber: "",
    physicalAddress: "", city: "", province: "", postalCode: "",
    bankName: "", accountNumber: "",
    termsAccepted: false, detailsAccurate: false, bindingAccepted: false,
  });

  useEffect(() => {
    fetch(`/api/auction/register/${sessionId}`)
      .then((r) => r.json())
      .then((d) => { if (d.session) setSession(d.session); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [sessionId]);

  function set(field: keyof typeof form, value: unknown) {
    setForm((p) => ({ ...p, [field]: value }));
    setError("");
  }

  function validateStep(s: number) {
    if (s === 1) {
      if (!form.fullName.trim()) return "Full name is required";
      if (!form.idNumber.trim()) return "SA ID number is required";
      if (!form.phone.trim()) return "Phone number is required";
      if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) return "Valid email is required";
    }
    if (s === 2) {
      if (!form.physicalAddress.trim() || !form.city.trim() || !form.province || !form.postalCode.trim()) return "All address fields are required";
    }
    if (s === 4) {
      if (!form.termsAccepted) return "You must accept the terms and conditions";
      if (!form.detailsAccurate) return "Please confirm your details are accurate";
      if (!form.bindingAccepted) return "You must acknowledge the binding bid agreement";
    }
    return null;
  }

  function next() {
    const err = validateStep(step);
    if (err) { setError(err); return; }
    setStep((s) => s + 1);
    setError("");
  }

  async function submit() {
    const err = validateStep(4);
    if (err) { setError(err); return; }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/auction/register/${sessionId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Registration failed"); return; }
      setDone(data.registration);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const stepLabels = ["Personal Details", "Address", "Banking", "Terms"];

  if (loading) return (
    <div className="min-h-screen bg-[#f5f4ef] flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-[#1B3A6B] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!session) return (
    <div className="min-h-screen bg-[#f5f4ef] flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-2xl font-black text-[#1B3A6B]">Auction Not Found</h1>
        <Link href="/auction" className="mt-4 inline-block text-[#2E7D32] hover:underline">← Back to Auctions</Link>
      </div>
    </div>
  );

  // Success screen
  if (done) return (
    <div className="min-h-screen bg-[#f5f4ef] flex items-center justify-center px-4 py-16">
      <div className="bg-white rounded-2xl shadow-xl border border-[#e4ebf5] p-10 max-w-lg w-full text-center">
        <div className="w-20 h-20 bg-[#2E7D32]/10 rounded-full flex items-center justify-center mx-auto mb-5">
          <CheckCircle size={40} className="text-[#2E7D32]" />
        </div>
        <h2 className="text-3xl font-black text-[#1B3A6B]">Registration Received!</h2>
        <p className="text-[#5d7497] mt-2 text-sm">Your application is being reviewed by our team.</p>
        <div className="mt-6 bg-[#1B3A6B] rounded-xl p-5 text-white">
          <p className="text-sm uppercase tracking-widest text-[#d9c08f] font-bold">Your Bidding Number</p>
          <p className="text-4xl font-black mt-1">{done.biddingNumber}</p>
          <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold uppercase tracking-wide">
            Pending Approval
          </div>
        </div>
        <div className="mt-6 text-left space-y-2 text-sm text-[#5d7497] bg-[#f5f8fd] rounded-xl p-4">
          <p className="font-bold text-[#244367]">What happens next?</p>
          <p>1. Our team reviews your registration within 24 hours.</p>
          <p>2. You will receive an email when you are approved.</p>
          <p>3. Use your bidding number to participate in the live auction.</p>
        </div>
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <Link href={`/auction`} className="flex-1 px-5 py-3 bg-[#1B3A6B] hover:bg-[#122844] text-white font-bold text-sm rounded-lg transition text-center">
            View Auctions
          </Link>
          <Link href="/" className="flex-1 px-5 py-3 border border-[#cdd8e7] text-[#5d7497] hover:border-[#1B3A6B] font-bold text-sm rounded-lg transition text-center">
            Go to Homepage
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f5f4ef] py-8 px-4">
      <div className="mx-auto max-w-2xl space-y-5">
        {/* Header */}
        <div>
          <Link href="/auction" className="text-sm text-[#2E7D32] hover:underline">← Back to Auctions</Link>
          <h1 className="mt-2 text-3xl font-black text-[#1B3A6B]">Register to Bid</h1>
          <p className="text-[#5d7497] text-sm mt-1">{session.title}</p>
          <div className="flex flex-wrap gap-3 mt-3 text-xs text-[#5d7497]">
            <span>📅 {new Date(session.scheduledAt).toLocaleDateString("en-ZA", { weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
            <span>📦 {session.lotCount} lots</span>
            <span>👥 {session.regCount} registered</span>
          </div>
        </div>

        {/* Step progress */}
        <div className="flex items-center gap-1">
          {stepLabels.map((label, i) => (
            <div key={label} className="flex items-center gap-1 flex-1">
              <div className={`flex items-center gap-1.5 flex-1 ${i === stepLabels.length - 1 ? "" : ""}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${step > i + 1 ? "bg-[#2E7D32] text-white" : step === i + 1 ? "bg-[#1B3A6B] text-white" : "bg-[#e4ebf5] text-[#9aabb9]"}`}>
                  {step > i + 1 ? "✓" : i + 1}
                </div>
                <span className={`text-xs hidden sm:block ${step === i + 1 ? "font-bold text-[#1B3A6B]" : "text-[#9aabb9]"}`}>{label}</span>
              </div>
              {i < stepLabels.length - 1 && <div className="w-4 h-0.5 bg-[#e4ebf5] shrink-0" />}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-[#e4ebf5] p-6 sm:p-8">
          {error && (
            <div className="mb-4 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <AlertTriangle size={16} /> {error}
            </div>
          )}

          {/* Step 1 */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="font-bold text-[#1B3A6B] flex items-center gap-2"><User size={18} />Personal Details</h2>
              {[
                { field: "fullName" as const, label: "Full Name *", placeholder: "Your full legal name" },
                { field: "idNumber" as const, label: "SA ID Number *", placeholder: "13-digit ID number" },
                { field: "phone" as const, label: "Phone Number *", placeholder: "+27 82 000 0000" },
                { field: "email" as const, label: "Email Address *", placeholder: "your@email.com" },
              ].map(({ field, label, placeholder }) => (
                <div key={field}>
                  <label className="block text-sm font-semibold text-[#244367] mb-1">{label}</label>
                  <input type={field === "email" ? "email" : "text"} value={form[field]} onChange={(e) => set(field, e.target.value)} placeholder={placeholder}
                    className="w-full px-4 py-2.5 rounded-lg border border-[#cdd8e7] text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30" />
                </div>
              ))}
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="font-bold text-[#1B3A6B] flex items-center gap-2"><MapPin size={18} />Address Details</h2>
              <div>
                <label className="block text-sm font-semibold text-[#244367] mb-1">Physical Address *</label>
                <input value={form.physicalAddress} onChange={(e) => set("physicalAddress", e.target.value)} placeholder="Street address" className="w-full px-4 py-2.5 rounded-lg border border-[#cdd8e7] text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-[#244367] mb-1">City *</label>
                  <input value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="City" className="w-full px-4 py-2.5 rounded-lg border border-[#cdd8e7] text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#244367] mb-1">Postal Code *</label>
                  <input value={form.postalCode} onChange={(e) => set("postalCode", e.target.value)} placeholder="0000" className="w-full px-4 py-2.5 rounded-lg border border-[#cdd8e7] text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#244367] mb-1">Province *</label>
                <select value={form.province} onChange={(e) => set("province", e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-[#cdd8e7] text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30">
                  <option value="">Select province…</option>
                  {PROVINCES.map((p) => <option key={p}>{p}</option>)}
                </select>
              </div>
            </div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="font-bold text-[#1B3A6B] flex items-center gap-2"><CreditCard size={18} />Banking Details <span className="text-xs font-normal text-[#9aabb9]">(optional)</span></h2>
              <p className="text-xs text-[#5d7497]">Banking details may be required for deposit payment or invoice processing.</p>
              <div>
                <label className="block text-sm font-semibold text-[#244367] mb-1">Bank Name</label>
                <select value={form.bankName} onChange={(e) => set("bankName", e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-[#cdd8e7] text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30">
                  <option value="">Select bank…</option>
                  {BANKS.map((b) => <option key={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#244367] mb-1">Account Number</label>
                <input value={form.accountNumber} onChange={(e) => set("accountNumber", e.target.value)} placeholder="Account number" className="w-full px-4 py-2.5 rounded-lg border border-[#cdd8e7] text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30" />
              </div>
            </div>
          )}

          {/* Step 4 */}
          {step === 4 && (
            <div className="space-y-4">
              <h2 className="font-bold text-[#1B3A6B] flex items-center gap-2"><FileText size={18} />Terms and Conditions</h2>
              <div className="h-48 overflow-y-auto rounded-xl border border-[#cdd8e7] bg-[#f5f8fd] p-4 text-xs text-[#5d7497] leading-relaxed whitespace-pre-wrap font-mono">
                {TERMS}
              </div>
              {[
                { field: "termsAccepted" as const, label: "I have read and I accept the HerdFlow Auction Terms and Conditions" },
                { field: "detailsAccurate" as const, label: "I confirm that all details I have provided are accurate and complete" },
                { field: "bindingAccepted" as const, label: "I understand that a winning bid is a legally binding purchase agreement" },
              ].map(({ field, label }) => (
                <label key={field} className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={form[field] as boolean} onChange={(e) => set(field, e.target.checked)} className="mt-0.5 accent-[#2E7D32] w-4 h-4" />
                  <span className="text-sm text-[#5d7497]">{label}</span>
                </label>
              ))}
            </div>
          )}

          {/* Nav buttons */}
          <div className="flex justify-between mt-6 pt-5 border-t border-[#f0f4fb]">
            {step > 1 ? (
              <button onClick={() => setStep((s) => s - 1)} className="px-5 py-2 border border-[#cdd8e7] rounded-lg text-sm font-semibold text-[#5d7497] hover:border-[#1B3A6B] transition">← Back</button>
            ) : (
              <Link href="/auction" className="px-5 py-2 border border-[#cdd8e7] rounded-lg text-sm font-semibold text-[#5d7497] hover:border-[#1B3A6B] transition">← Back</Link>
            )}
            {step < 4 ? (
              <button onClick={next} className="flex items-center gap-2 px-6 py-2 bg-[#1B3A6B] hover:bg-[#122844] text-white rounded-lg text-sm font-bold transition">
                Continue <ChevronRight size={16} />
              </button>
            ) : (
              <button onClick={submit} disabled={submitting} className="px-8 py-2 bg-[#2E7D32] hover:bg-[#1d5e20] disabled:opacity-60 text-white rounded-lg text-sm font-bold transition">
                {submitting ? "Submitting…" : "Complete Registration"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
