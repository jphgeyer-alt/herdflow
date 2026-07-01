"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [accountType, setAccountType] = useState<"buyer" | "seller" | "logistics" | "">("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) { setError("Passwords do not match"); return; }
    if (!accountType) { setError("Please select an account type"); return; }
    if (!agreeTerms) { setError("You must accept the terms and conditions"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, phone, password, accountType }),
      });
      const data = await res.json();
      if (res.ok && data.redirect) {
        router.push(data.redirect);
      } else {
        setError(data.error || "Registration failed");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f4ef] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl border border-[#e4ebf5] p-8">
          <h1 className="text-3xl font-black text-[#1B3A6B] mb-2">Create Account</h1>
          <p className="text-sm text-[#5d7497] mb-8">Join the HerdFlow community</p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-[#244367] mb-2">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg border border-[#cdd8e7] focus:outline-none focus:border-[#1B3A6B] focus:ring-2 focus:ring-[#1B3A6B]/20"
                placeholder="John Smith"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#244367] mb-2">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg border border-[#cdd8e7] focus:outline-none focus:border-[#1B3A6B] focus:ring-2 focus:ring-[#1B3A6B]/20"
                placeholder="your.email@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#244367] mb-2">Phone Number (Optional)</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-[#cdd8e7] focus:outline-none focus:border-[#1B3A6B] focus:ring-2 focus:ring-[#1B3A6B]/20"
                placeholder="+27 82 123 4567"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#244367] mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full px-4 py-3 rounded-lg border border-[#cdd8e7] focus:outline-none focus:border-[#1B3A6B] focus:ring-2 focus:ring-[#1B3A6B]/20"
                placeholder="At least 8 characters"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#244367] mb-2">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg border border-[#cdd8e7] focus:outline-none focus:border-[#1B3A6B] focus:ring-2 focus:ring-[#1B3A6B]/20"
                placeholder="Re-enter your password"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#244367] mb-3">Account Type</label>
              <div className="space-y-2">
                {[
                  { value: "buyer", label: "I am a Buyer" },
                  { value: "seller", label: "I am a Seller / Farmer" },
                  { value: "logistics", label: "I am a Logistics Company" },
                ].map((type) => (
                  <label
                    key={type.value}
                    className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition ${
                      accountType === type.value ? "border-[#2E7D32] bg-green-50" : "border-[#e4ebf5] hover:border-[#cdd8e7]"
                    }`}
                  >
                    <input
                      type="radio"
                      name="accountType"
                      value={type.value}
                      checked={accountType === type.value}
                      onChange={(e) => setAccountType(e.target.value as typeof accountType)}
                      className="w-4 h-4 text-[#2E7D32] focus:ring-[#2E7D32]"
                    />
                    <span className="text-sm font-medium text-[#244367]">{type.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                required
                className="w-4 h-4 mt-0.5 rounded border-[#cdd8e7] text-[#2E7D32] focus:ring-[#2E7D32]"
              />
              <span className="text-xs text-[#5d7497]">
                I agree to the HerdFlow{" "}
                <Link href="/terms" className="text-[#2E7D32] font-semibold hover:underline">Terms of Service</Link>
                {" "}and{" "}
                <Link href="/privacy" className="text-[#2E7D32] font-semibold hover:underline">Privacy Policy</Link>
              </span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#2E7D32] hover:bg-[#1d5e20] text-white font-bold uppercase tracking-wide py-3.5 rounded-lg shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating Account..." : "CREATE ACCOUNT"}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-[#e4ebf5] text-center">
            <p className="text-sm text-[#5d7497]">
              Already have an account?{" "}
              <Link href="/auth/login" className="font-semibold text-[#2E7D32] hover:underline">Sign In</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
