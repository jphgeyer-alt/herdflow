import Link from "next/link";
import { LogisticsRegistrationForm } from "./logistics-registration-form";

export default function LogisticsRegistrationPage() {
  return (
    <main className="space-y-5 pb-10">
      <nav className="text-sm text-[#38537a]">
        <Link className="font-semibold text-brand-navy" href="/">
          Back to Home
        </Link>
      </nav>

      <section className="rounded-2xl bg-gradient-to-r from-brand-navy to-[#254f8e] p-6 text-white shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#d9c08f]">Logistics Onboarding</p>
        <h1 className="mt-3 text-3xl font-semibold leading-tight sm:text-4xl">Register as a Logistics Partner</h1>
        <p className="mt-3 max-w-2xl text-sm text-[#ecf1f8] sm:text-base">
          Join the HerdFlow transport network and deliver livestock and farm products across your active routes.
        </p>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <div className="rounded-xl border border-[#d8e0ec] bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold text-brand-navy">Application Form</h2>
          <p className="mt-2 text-sm text-[#38537a]">
            Share your fleet capability, routes covered, and upload supporting vehicle documents for review.
          </p>
          <div className="mt-4">
            <LogisticsRegistrationForm />
          </div>
        </div>

        <aside className="space-y-3 rounded-xl border border-[#d8e0ec] bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-brand-navy">Requirements</h2>
          <ul className="space-y-2 text-sm text-[#38537a]">
            <li>Company name and contact details</li>
            <li>Fleet size and routes covered</li>
            <li>Vehicle documents upload</li>
          </ul>
          <p className="text-xs text-[#5d7497]">
            Approved partners are listed for matching with seller deliveries by region and load type.
          </p>
        </aside>
      </section>
    </main>
  );
}
