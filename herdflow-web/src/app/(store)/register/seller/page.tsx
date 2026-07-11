import Link from "next/link";
import { SellerRegistrationForm } from "./seller-registration-form";
import { CheckCircle2 } from "lucide-react";

export default function SellerRegistrationPage() {
  return (
    <div className="min-h-screen bg-[#f5f4ef]">
      {/* Hero Header */}
      <div className="bg-[#1B3A6B] px-4 py-12 text-white md:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="mb-2 text-sm font-bold uppercase tracking-[0.18em] text-[#A07C3A]">
            Seller Onboarding
          </p>
          <h1 className="mb-2 text-4xl font-black">Register as a HerdFlow Seller</h1>
          <p className="max-w-2xl text-lg text-white/80">
            Submit your farm profile for verification. Approved sellers can publish livestock and
            product listings in the storefront.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12 md:px-8">
        {/* Pricing */}
        <div className="mb-10 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-[#e4ebf5] bg-white p-5 text-center shadow-lg">
            <p className="text-xs font-bold uppercase tracking-wide text-[#5d7497]">
              One-Time Registration
            </p>
            <p className="mt-1 text-2xl font-black text-[#1B3A6B]">R500</p>
          </div>
          <div className="rounded-2xl border border-[#e4ebf5] bg-white p-5 text-center shadow-lg">
            <p className="text-xs font-bold uppercase tracking-wide text-[#5d7497]">
              Storefront Plan
            </p>
            <p className="mt-1 text-2xl font-black text-[#1B3A6B]">R299 – R499/mo</p>
            <p className="mt-1 text-xs text-[#9aabb9]">Basic (20 products) or Unlimited</p>
          </div>
          <div className="rounded-2xl border border-[#e4ebf5] bg-white p-5 text-center shadow-lg">
            <p className="text-xs font-bold uppercase tracking-wide text-[#5d7497]">
              Sale Commission
            </p>
            <p className="mt-1 text-2xl font-black text-[#1B3A6B]">5%</p>
            <p className="mt-1 text-xs text-[#9aabb9]">Only on completed sales</p>
          </div>
        </div>

        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr]">
          {/* Form */}
          <div className="rounded-2xl border border-[#e4ebf5] bg-white p-8 shadow-xl">
            <h2 className="mb-2 text-2xl font-black text-[#1B3A6B]">Application Form</h2>
            <p className="mb-6 text-sm text-[#5d7497]">
              Complete the form with your farm details. Our team will review your application within
              2–3 business days.
            </p>
            <SellerRegistrationForm />
          </div>

          {/* Requirements */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-[#e4ebf5] bg-white p-6 shadow-lg">
              <h2 className="mb-4 text-xl font-black text-[#1B3A6B]">Requirements</h2>
              <ul className="space-y-3">
                {[
                  "Valid South African farm name and location",
                  "Active contact phone number",
                  "Valid South African ID number",
                  "Copy of your national ID document",
                ].map((req) => (
                  <li key={req} className="flex items-start gap-3">
                    <CheckCircle2 size={20} className="mt-0.5 flex-shrink-0 text-[#2E7D32]" />
                    <span className="text-sm text-[#5d7497]">{req}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl bg-[#1B3A6B] p-6 text-white">
              <h3 className="mb-2 font-bold">What happens after approval?</h3>
              <p className="mb-4 text-sm text-white/80">
                Once verified, you can publish livestock listings and products directly from your
                seller dashboard.
              </p>
              <p className="text-xs text-white/60">
                Verification status updates will be sent to your registered email address.
              </p>
            </div>

            <div className="text-center">
              <p className="text-sm text-[#5d7497]">
                Already have an account?{" "}
                <Link href="/auth/login" className="font-semibold text-[#2E7D32] hover:underline">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
