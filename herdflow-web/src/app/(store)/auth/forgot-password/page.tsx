"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { Mail, CheckCircle, ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (cooldown > 0) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.status === 429) {
        setError(data.error || "Too many requests. Please wait before trying again.");
        return;
      }
      // Always show success (even if email not found — prevents enumeration)
      setSent(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setSent(false);
    setCooldown(60);
    const tick = setInterval(() => {
      setCooldown((c) => { if (c <= 1) { clearInterval(tick); return 0; } return c - 1; });
    }, 1000);
    await handleSubmit({ preventDefault: () => {} } as FormEvent);
  }

  return (
    <div className="min-h-screen bg-[#f5f4ef] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl border border-[#e4ebf5] p-8">
          {/* Logo */}
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-[#1B3A6B] rounded-xl flex items-center justify-center mx-auto mb-3">
              <span className="text-white font-black text-sm">HF</span>
            </div>
          </div>

          {sent ? (
            /* ── SUCCESS STATE ── */
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle size={32} className="text-[#2E7D32]" />
              </div>
              <h1 className="text-2xl font-black text-[#1B3A6B]">Check Your Email</h1>
              <p className="text-sm text-[#5d7497] leading-relaxed">
                We sent a password reset link to{" "}
                <strong className="text-[#244367]">{email}</strong>.
                <br />The link expires in 1 hour.
              </p>
              <p className="text-xs text-[#9aabb9]">
                Don&apos;t see it? Check your spam or junk folder.
              </p>
              <div className="pt-2 space-y-2">
                <button
                  onClick={handleResend}
                  disabled={cooldown > 0 || loading}
                  className="block w-full text-sm font-semibold text-[#2E7D32] hover:underline disabled:opacity-50 disabled:no-underline py-2"
                >
                  {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend Email"}
                </button>
                <Link href="/auth/login" className="flex items-center justify-center gap-2 text-sm text-[#5d7497] hover:text-[#1B3A6B] transition">
                  <ArrowLeft size={14} /> Back to Login
                </Link>
              </div>
            </div>
          ) : (
            /* ── FORM STATE ── */
            <>
              <h1 className="text-2xl font-black text-[#1B3A6B] mb-1">Forgot Your Password?</h1>
              <p className="text-sm text-[#5d7497] mb-7">
                Enter your email address and we will send you a link to reset your password.
              </p>

              {error && (
                <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-[#244367] mb-2">Email Address</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9aabb9]" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="your.email@example.com"
                      className="w-full pl-10 pr-4 py-3 rounded-lg border border-[#cdd8e7] focus:outline-none focus:border-[#1B3A6B] focus:ring-2 focus:ring-[#1B3A6B]/20"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#2E7D32] hover:bg-[#1d5e20] text-white font-bold uppercase tracking-wide py-3.5 rounded-lg shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Sending…
                    </>
                  ) : (
                    "Send Reset Link"
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <Link href="/auth/login" className="flex items-center justify-center gap-2 text-sm text-[#5d7497] hover:text-[#1B3A6B] transition">
                  <ArrowLeft size={14} /> Back to Login
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

