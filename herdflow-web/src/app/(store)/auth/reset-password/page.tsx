"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, AlertTriangle, X, Clock } from "lucide-react";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { PasswordStrength, isPasswordStrong } from "@/components/ui/PasswordStrength";

type TokenState = "checking" | "valid" | "expired" | "used" | "invalid";

function ResetForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [tokenState, setTokenState] = useState<TokenState>(() => (token ? "checking" : "invalid"));
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    fetch(`/api/auth/reset-password?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.valid) {
          setTokenState("valid");
          return;
        }
        setTokenState(
          d.reason === "expired" ? "expired" : d.reason === "used" ? "used" : "invalid",
        );
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
      if (!res.ok) {
        setError(data.error || "Failed to reset password.");
        return;
      }
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
      <div className="py-8 text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-[#1B3A6B] border-t-transparent" />
        <p className="mt-3 text-sm text-[#5d7497]">Verifying reset link…</p>
      </div>
    );
  }

  // ── Expired ───────────────────────────────────────────────────────────────
  if (tokenState === "expired") {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
          <Clock size={32} className="text-amber-600" />
        </div>
        <h2 className="text-xl font-black text-[#1B3A6B]">Link Has Expired</h2>
        <p className="text-sm text-[#5d7497]">
          This password reset link has expired. Reset links are valid for 1 hour only.
        </p>
        <Link
          href="/auth/forgot-password"
          className="mt-2 inline-block rounded-lg bg-[#2E7D32] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#1d5e20]"
        >
          Request New Link
        </Link>
      </div>
    );
  }

  // ── Used / Invalid ────────────────────────────────────────────────────────
  if (tokenState === "used" || tokenState === "invalid") {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
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
        <Link
          href="/auth/forgot-password"
          className="mt-2 inline-block rounded-lg bg-[#2E7D32] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#1d5e20]"
        >
          Request New Link
        </Link>
      </div>
    );
  }

  // ── Done ──────────────────────────────────────────────────────────────────
  if (done) {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <CheckCircle size={32} className="text-[#2E7D32]" />
        </div>
        <h2 className="text-2xl font-black text-[#1B3A6B]">Password Reset Successful</h2>
        <p className="text-sm text-[#5d7497]">
          Your password has been updated. You can now log in with your new password.
        </p>
        <Link
          href="/auth/login"
          className="mt-3 inline-block rounded-lg bg-[#2E7D32] px-8 py-3 text-sm font-bold uppercase tracking-wide text-white shadow-lg transition hover:bg-[#1d5e20]"
        >
          Login Now
        </Link>
      </div>
    );
  }

  // ── Valid token — show form ────────────────────────────────────────────────
  return (
    <>
      <h1 className="mb-1 text-2xl font-black text-[#1B3A6B]">Create New Password</h1>
      <p className="mb-7 text-sm text-[#5d7497]">
        Choose a strong password for your HerdFlow account.
      </p>

      {error && (
        <div className="mb-5 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
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
            <p className="mt-1 flex items-center gap-1 text-xs text-green-600">
              <CheckCircle size={12} /> Passwords match
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={!canSubmit}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#2E7D32] py-3.5 font-bold uppercase tracking-wide text-white shadow-lg transition hover:bg-[#1d5e20] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
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
    <div className="flex min-h-screen items-center justify-center bg-[#f5f4ef] px-4 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-[#e4ebf5] bg-white p-8 shadow-xl">
          {/* Logo */}
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[#1B3A6B]">
              <span className="text-sm font-black text-white">HF</span>
            </div>
          </div>
          <Suspense
            fallback={<div className="py-8 text-center text-sm text-[#5d7497]">Loading…</div>}
          >
            <ResetForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
