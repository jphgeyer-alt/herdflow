"use client";

import { Suspense, useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { PasswordInput } from "@/components/ui/PasswordInput";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok && data.redirect) {
        router.push(redirectTo || data.redirect);
      } else {
        setError(data.error || "Login failed");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const registerHref = redirectTo
    ? `/auth/register?redirect=${encodeURIComponent(redirectTo)}`
    : "/auth/register";

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f5f4ef] px-4 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-[#e4ebf5] bg-white p-8 shadow-xl">
          <h1 className="mb-2 text-3xl font-black text-[#1B3A6B]">Welcome to HerdFlow</h1>
          <p className="mb-8 text-sm text-[#5d7497]">Sign in to your HerdFlow account</p>

          {error && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#244367]">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-lg border border-[#cdd8e7] px-4 py-3 focus:border-[#1B3A6B] focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/20"
                placeholder="your.email@example.com"
              />
            </div>

            <div>
              <PasswordInput
                id="password"
                label="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                autoComplete="current-password"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-[#5d7497]">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-[#cdd8e7] text-[#2E7D32] focus:ring-[#2E7D32]"
                />
                Remember me
              </label>
              <Link
                href="/auth/forgot-password"
                className="text-sm font-semibold text-[#2E7D32] hover:text-[#1d5e20]"
              >
                Forgot Password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[#2E7D32] py-3.5 font-bold uppercase tracking-wide text-white shadow-lg transition hover:bg-[#1d5e20] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Signing in..." : "LOGIN"}
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#e4ebf5]" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-4 font-semibold text-[#5d7497]">OR</span>
            </div>
          </div>

          <Link
            href={registerHref}
            className="block w-full rounded-lg border-2 border-[#1B3A6B] py-3.5 text-center font-bold uppercase tracking-wide text-[#1B3A6B] transition hover:bg-[#1B3A6B] hover:text-white"
          >
            Create New Account
          </Link>

          <div className="mt-6 space-y-2 border-t border-[#e4ebf5] pt-6 text-center">
            <p className="text-xs text-[#5d7497]">Are you a supplier or service provider?</p>
            <div className="flex justify-center gap-3 text-sm">
              <Link
                href="/register/seller"
                className="font-semibold text-[#2E7D32] hover:underline"
              >
                Register as Seller
              </Link>
              <span className="text-[#cdd8e7]">&bull;</span>
              <Link
                href="/register/logistics"
                className="font-semibold text-[#2E7D32] hover:underline"
              >
                Register as Logistics Partner
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#f5f4ef] px-4 py-12 text-sm text-[#5d7497]">
          Loading…
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
