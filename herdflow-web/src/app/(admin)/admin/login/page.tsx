import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { AdminLoginForm } from "./login-form";

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f7f9fc] px-4">
      <main className="w-full max-w-md space-y-6 rounded-2xl border border-navy-50 bg-white p-8 shadow-lg">
        <div className="space-y-3 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-navy-600 text-white">
            <ShieldCheck size={22} />
          </div>
          <div>
            <p className="text-xs font-semibold tracking-[0.18em] text-navy-300 uppercase">
              Admin Access
            </p>
            <h1 className="text-navy-600 text-2xl font-bold">HerdFlow Admin</h1>
          </div>
          <p className="text-sm text-navy-300">
            Sign in with your staff account to access the backend dashboard.
          </p>
        </div>

        <AdminLoginForm />

        <Link
          className="block text-center text-sm font-semibold text-navy-300 hover:text-navy-600"
          href="/"
        >
          ← Back to Homepage
        </Link>
      </main>
    </div>
  );
}
