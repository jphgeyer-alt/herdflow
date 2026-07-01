import Link from "next/link";

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-[#f5f4ef] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl border border-[#e4ebf5] p-8 text-center">
          <h1 className="text-2xl font-black text-[#1B3A6B] mb-4">Reset Password</h1>
          <p className="text-sm text-[#5d7497] mb-6">
            Password reset functionality will be available soon. Please contact support for assistance.
          </p>
          <Link
            href="/auth/login"
            className="inline-block bg-[#2E7D32] hover:bg-[#1d5e20] text-white font-bold uppercase tracking-wide px-8 py-3 rounded-lg shadow-lg transition"
          >
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
