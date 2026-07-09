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
      setCooldown((c) => {
        if (c <= 1) {
          clearInterval(tick);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    await handleSubmit({ preventDefault: () => {} } as FormEvent);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f5f4ef] px-4 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-[#e4ebf5] bg-white p-8 shadow-xl">
          {/* Logo */}
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[#1B3A6B]">
              <span className="text-sm font-black text-white">HF</span>
            </div>
          </div>

          {sent ? (
            /* ── SUCCESS STATE ── */
            <div className="space-y-4 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <CheckCircle size={32} className="text-[#2E7D32]" />
              </div>
              <h1 className="text-2xl font-black text-[#1B3A6B]">Check Your Email</h1>
              <p className="text-sm leading-relaxed text-[#5d7497]">
                We sent a password reset link to <strong className="text-[#244367]">{email}</strong>
                .
                <br />
                The link expires in 1 hour.
              </p>
              <p className="text-xs text-[#9aabb9]">
                Don&apos;t see it? Check your spam or junk folder.
              </p>
              <div className="space-y-2 pt-2">
                <button
                  onClick={handleResend}
                  disabled={cooldown > 0 || loading}
                  className="block w-full py-2 text-sm font-semibold text-[#2E7D32] hover:underline disabled:no-underline disabled:opacity-50"
                >
                  {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend Email"}
                </button>
                <Link
                  href="/auth/login"
                  className="flex items-center justify-center gap-2 text-sm text-[#5d7497] transition hover:text-[#1B3A6B]"
                >
                  <ArrowLeft size={14} /> Back to Login
                </Link>
              </div>
            </div>
          ) : (
            /* ── FORM STATE ── */
            <>
              <h1 className="mb-1 text-2xl font-black text-[#1B3A6B]">Forgot Your Password?</h1>
              <p className="mb-7 text-sm text-[#5d7497]">
                Enter your email address and we will send you a link to reset your password.
              </p>

              {error && (
                <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#244367]">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9aabb9]"
                    />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="your.email@example.com"
                      className="w-full rounded-lg border border-[#cdd8e7] py-3 pl-10 pr-4 focus:border-[#1B3A6B] focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/20"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#2E7D32] py-3.5 font-bold uppercase tracking-wide text-white shadow-lg transition hover:bg-[#1d5e20] disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Sending…
                    </>
                  ) : (
                    "Send Reset Link"
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <Link
                  href="/auth/login"
                  className="flex items-center justify-center gap-2 text-sm text-[#5d7497] transition hover:text-[#1B3A6B]"
                >
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
