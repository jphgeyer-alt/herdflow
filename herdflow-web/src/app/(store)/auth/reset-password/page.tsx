"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle, AlertTriangle, X, Clock } from "lucide-react";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { PasswordStrength, isPasswordStrong } from "@/components/ui/PasswordStrength";

type TokenState = "checking" | "valid" | "expired" | "used" | "invalid";

function ResetForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") || "";

  const [tokenState, setTokenState] = useState<TokenState>("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) { setTokenState("invalid"); return; }
    fetch(`/api/auth/reset-password?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.valid) { setTokenState("valid"); return; }
        setTokenState(d.reason === "expired" ? "expired" : d.reason === "used" ? "used" : "invalid");
      })
      .catch(() => setTokenState("invalid"));
  }, [token]);

  const passwordsMatch = confirm.length > 0 && password === confirm;
  const passwordMismatch = confirm.length > 0 && password !== confirm;
  const canSubmit = isPasswordStrong(password) && passwordsMatch && !loading;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to reset password."); return; }
      setDone(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // ── Checking ──────────────────────────────────────────────────────────────
  if (tokenState === "checking") {
    return (
      <div className="text-center py-8">
        <div className="w-8 h-8 border-4 border-[#1B3A6B] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-[#5d7497] mt-3">Verifying reset link…</p>
      </div>
    );
  }

  // ── Expired ───────────────────────────────────────────────────────────────
  if (tokenState === "expired") {
    return (
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
          <Clock size={32} className="text-amber-600" />
        </div>
        <h2 className="text-xl font-black text-[#1B3A6B]">Link Has Expired</h2>
        <p className="text-sm text-[#5d7497]">This password reset link has expired. Reset links are valid for 1 hour only.</p>
        <Link href="/auth/forgot-password" className="inline-block mt-2 px-6 py-3 bg-[#2E7D32] hover:bg-[#1d5e20] text-white font-bold rounded-lg transition text-sm">
          Request New Link
        </Link>
      </div>
    );
  }

  // ── Used / Invalid ────────────────────────────────────────────────────────
  if (tokenState === "used" || tokenState === "invalid") {
    return (
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
          <X size={32} className="text-red-600" />
        </div>
        <h2 className="text-xl font-black text-[#1B3A6B]">
          {tokenState === "used" ? "Link Already Used" : "Invalid Reset Link"}
        </h2>
        <p className="text-sm text-[#5d7497]">
          {tokenState === "used"
            ? "This password reset link has already been used."
            : "This password reset link is invalid or has already been used."}
        </p>
        <Link href="/auth/forgot-password" className="inline-block mt-2 px-6 py-3 bg-[#2E7D32] hover:bg-[#1d5e20] text-white font-bold rounded-lg transition text-sm">
          Request New Link
        </Link>
      </div>
    );
  }

  // ── Done ──────────────────────────────────────────────────────────────────
  if (done) {
    return (
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle size={32} className="text-[#2E7D32]" />
        </div>
        <h2 className="text-2xl font-black text-[#1B3A6B]">Password Reset Successful</h2>
        <p className="text-sm text-[#5d7497]">Your password has been updated. You can now log in with your new password.</p>
        <Link href="/auth/login" className="inline-block mt-3 px-8 py-3 bg-[#2E7D32] hover:bg-[#1d5e20] text-white font-bold rounded-lg transition text-sm uppercase tracking-wide shadow-lg">
          Login Now
        </Link>
      </div>
    );
  }

  // ── Valid token — show form ────────────────────────────────────────────────
  return (
    <>
      <h1 className="text-2xl font-black text-[#1B3A6B] mb-1">Create New Password</h1>
      <p className="text-sm text-[#5d7497] mb-7">Choose a strong password for your HerdFlow account.</p>

      {error && (
        <div className="mb-5 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <PasswordInput
            id="password"
            label="New Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Create a strong password"
            required
            autoComplete="new-password"
            minLength={8}
          />
          <PasswordStrength password={password} />
        </div>

        <div>
          <PasswordInput
            id="confirm"
            label="Confirm New Password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Re-enter your new password"
            required
            autoComplete="new-password"
            error={passwordMismatch ? "Passwords do not match" : undefined}
          />
          {passwordsMatch && (
            <p className="mt-1 text-xs text-green-600 flex items-center gap-1">
              <CheckCircle size={12} /> Passwords match
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={!canSubmit}
          className="w-full bg-[#2E7D32] hover:bg-[#1d5e20] text-white font-bold uppercase tracking-wide py-3.5 rounded-lg shadow-lg transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Resetting…
            </>
          ) : (
            "Reset Password"
          )}
        </button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
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
          <Suspense fallback={<div className="text-center py-8 text-[#5d7497] text-sm">Loading…</div>}>
            <ResetForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
