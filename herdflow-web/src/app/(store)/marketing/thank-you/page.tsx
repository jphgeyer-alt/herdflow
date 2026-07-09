import Link from "next/link";

export default function MarketingThankYouPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f5f4ef] px-4 py-16">
      <div className="w-full max-w-lg rounded-2xl border border-[#e4ebf5] bg-white p-10 text-center shadow-xl sm:p-14">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#2E7D32]/10">
          <svg
            className="h-10 w-10 text-[#2E7D32]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-3xl font-black uppercase text-[#1B3A6B]">Application Received!</h1>
        <p className="mt-2 text-lg font-semibold text-[#2E7D32]">Welcome to the HerdFlow Family</p>
        <p className="mt-4 text-sm leading-relaxed text-[#5d7497]">
          Our marketing team will review your application and contact you within 24 hours.
          We&apos;re excited to help you reach South Africa&apos;s farming community.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/"
            className="rounded-lg bg-[#2E7D32] px-8 py-3 font-bold uppercase tracking-wide text-white transition hover:bg-[#1d5e20]"
          >
            Explore HerdFlow
          </Link>
          <Link
            href="/marketing"
            className="rounded-lg border-2 border-[#1B3A6B] px-8 py-3 font-bold uppercase tracking-wide text-[#1B3A6B] transition hover:bg-[#1B3A6B] hover:text-white"
          >
            Back to Marketing
          </Link>
        </div>
      </div>
    </div>
  );
}
