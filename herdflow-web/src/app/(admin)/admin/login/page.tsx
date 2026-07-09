import Link from "next/link";
import { AdminLoginForm } from "./login-form";

export default function AdminLoginPage() {
  return (
    <main className="mx-auto w-full max-w-md space-y-5 rounded-xl border border-[#d8e0ec] bg-white p-6 shadow-sm">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#5d7497]">
          Admin Access
        </p>
        <h1 className="text-brand-navy text-2xl font-semibold">HerdFlow Admin Login</h1>
        <p className="text-sm text-[#38537a]">
          Sign in with administrator credentials to access the backend dashboard.
        </p>
      </div>

      <AdminLoginForm />

      <Link className="inline-flex text-sm font-semibold text-[#5d7497]" href="/">
        Back to Homepage
      </Link>
    </main>
  );
}
