import Link from "next/link";
import { SellerRegistrationForm } from "./seller-registration-form";
import { CheckCircle2 } from "lucide-react";

export default function SellerRegistrationPage() {
  return (
    <div className="min-h-screen bg-[#f5f4ef]">
      {/* Hero Header */}
      <div className="bg-[#1B3A6B] text-white py-12 px-4 md:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#A07C3A] mb-2">Seller Onboarding</p>
          <h1 className="text-4xl font-black mb-2">Register as a HerdFlow Seller</h1>
          <p className="text-lg text-white/80 max-w-2xl">
            Submit your farm profile for verification. Approved sellers can publish livestock and product listings in the storefront.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 md:px-8 py-12">
        <div className="grid md:grid-cols-[1.5fr_1fr] gap-10">
          {/* Form */}
          <div className="bg-white rounded-2xl shadow-xl border border-[#e4ebf5] p-8">
            <h2 className="text-2xl font-black text-[#1B3A6B] mb-2">Application Form</h2>
            <p className="text-sm text-[#5d7497] mb-6">
              Complete the form with your farm details. Our team will review your application within 2–3 business days.
            </p>
            <SellerRegistrationForm />
          </div>

          {/* Requirements */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg border border-[#e4ebf5] p-6">
              <h2 className="text-xl font-black text-[#1B3A6B] mb-4">Requirements</h2>
              <ul className="space-y-3">
                {[
                  "Valid South African farm name and location",
                  "Active contact phone number",
                  "Valid South African ID number",
                  "Copy of your national ID document",
                ].map((req) => (
                  <li key={req} className="flex items-start gap-3">
                    <CheckCircle2 size={20} className="text-[#2E7D32] mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-[#5d7497]">{req}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-[#1B3A6B] rounded-2xl p-6 text-white">
              <h3 className="font-bold mb-2">What happens after approval?</h3>
              <p className="text-sm text-white/80 mb-4">
                Once verified, you can publish livestock listings and products directly from your seller dashboard.
              </p>
              <p className="text-xs text-white/60">
                Verification status updates will be sent to your registered email address.
              </p>
            </div>

            <div className="text-center">
              <p className="text-sm text-[#5d7497]">Already have an account?{" "}
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
