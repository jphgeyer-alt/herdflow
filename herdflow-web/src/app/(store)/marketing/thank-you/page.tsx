import Link from "next/link";

export default function MarketingThankYouPage() {
  return (
    <div className="min-h-screen bg-[#f5f4ef] flex items-center justify-center px-4 py-16">
      <div className="bg-white rounded-2xl shadow-xl border border-[#e4ebf5] p-10 sm:p-14 text-center max-w-lg w-full">
        <div className="w-20 h-20 bg-[#2E7D32]/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-[#2E7D32]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-3xl font-black text-[#1B3A6B] uppercase">Application Received!</h1>
        <p className="mt-2 text-lg font-semibold text-[#2E7D32]">Welcome to the HerdFlow Family</p>
        <p className="mt-4 text-[#5d7497] leading-relaxed text-sm">
          Our marketing team will review your application and contact you within 24 hours.
          We&apos;re excited to help you reach South Africa&apos;s farming community.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="px-8 py-3 bg-[#2E7D32] hover:bg-[#1d5e20] text-white font-bold rounded-lg uppercase tracking-wide transition"
          >
            Explore HerdFlow
          </Link>
          <Link
            href="/marketing"
            className="px-8 py-3 border-2 border-[#1B3A6B] text-[#1B3A6B] hover:bg-[#1B3A6B] hover:text-white font-bold rounded-lg uppercase tracking-wide transition"
          >
            Back to Marketing
          </Link>
        </div>
      </div>
    </div>
  );
}
