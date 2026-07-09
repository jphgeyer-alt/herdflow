import Link from "next/link";
import { LogisticsRegistrationForm } from "./logistics-registration-form";
import { CheckCircle2 } from "lucide-react";

export default function LogisticsRegistrationPage() {
  return (
    <div className="min-h-screen bg-[#f5f4ef]">
      {/* Hero Header */}
      <div className="bg-[#1B3A6B] px-4 py-12 text-white md:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="mb-2 text-sm font-bold uppercase tracking-[0.18em] text-[#A07C3A]">
            Logistics Onboarding
          </p>
          <h1 className="mb-2 text-4xl font-black">Register as a Logistics Partner</h1>
          <p className="max-w-2xl text-lg text-white/80">
            Join the HerdFlow transport network and deliver livestock and farm products across your
            active routes.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12 md:px-8">
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr]">
          {/* Form */}
          <div className="rounded-2xl border border-[#e4ebf5] bg-white p-8 shadow-xl">
            <h2 className="mb-2 text-2xl font-black text-[#1B3A6B]">Application Form</h2>
            <p className="mb-6 text-sm text-[#5d7497]">
              Share your fleet details and routes. Our team will review your application within 2–3
              business days.
            </p>
            <LogisticsRegistrationForm />
          </div>

          {/* Requirements */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-[#e4ebf5] bg-white p-6 shadow-lg">
              <h2 className="mb-4 text-xl font-black text-[#1B3A6B]">Requirements</h2>
              <ul className="space-y-3">
                {[
                  "Registered company name and contact details",
                  "Fleet size (number of vehicles)",
                  "Provinces and routes currently covered",
                  "Vehicle and fleet documentation",
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
                Approved partners are matched with delivery requests from sellers by region and load
                type, accessible from your logistics dashboard.
              </p>
              <p className="text-xs text-white/60">
                Verification updates will be sent to your registered email address.
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
