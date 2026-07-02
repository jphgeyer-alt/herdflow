"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
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
        router.push(data.redirect);
      } else {
        setError(data.error || "Login failed");
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
          <h1 className="text-3xl font-black text-[#1B3A6B] mb-2">Welcome to HerdFlow</h1>
          <p className="text-sm text-[#5d7497] mb-8">Sign in to your HerdFlow account</p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
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
              <label className="block text-sm font-semibold text-[#244367] mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg border border-[#cdd8e7] focus:outline-none focus:border-[#1B3A6B] focus:ring-2 focus:ring-[#1B3A6B]/20"
                placeholder="Enter your password"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-[#5d7497] cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-[#cdd8e7] text-[#2E7D32] focus:ring-[#2E7D32]"
                />
                Remember me
              </label>
              <Link href="/auth/forgot-password" className="text-sm font-semibold text-[#2E7D32] hover:text-[#1d5e20]">
                Forgot Password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#2E7D32] hover:bg-[#1d5e20] text-white font-bold uppercase tracking-wide py-3.5 rounded-lg shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Signing in..." : "LOGIN"}
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#e4ebf5]" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-[#5d7497] font-semibold">OR</span>
            </div>
          </div>

          <Link
            href="/auth/register"
            className="block w-full text-center border-2 border-[#1B3A6B] text-[#1B3A6B] font-bold uppercase tracking-wide py-3.5 rounded-lg hover:bg-[#1B3A6B] hover:text-white transition"
          >
            Create New Account
          </Link>

          <div className="mt-6 pt-6 border-t border-[#e4ebf5] text-center space-y-2">
            <p className="text-xs text-[#5d7497]">Are you a supplier or service provider?</p>
            <div className="flex gap-3 justify-center text-sm">
              <Link href="/register/seller" className="font-semibold text-[#2E7D32] hover:underline">
                Register as Seller
              </Link>
              <span className="text-[#cdd8e7]">&bull;</span>
              <Link href="/register/logistics" className="font-semibold text-[#2E7D32] hover:underline">
                Register as Logistics Partner
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
