import Link from "next/link";
import { SellerRegistrationForm } from "./seller-registration-form";

export default function SellerRegistrationPage() {
  return (
    <main className="space-y-5 pb-10">
      <nav className="text-sm text-[#38537a]">
        <Link className="font-semibold text-brand-navy" href="/">
          Back to Home
        </Link>
      </nav>

      <section className="rounded-2xl bg-gradient-to-r from-brand-navy to-[#254f8e] p-6 text-white shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#d9c08f]">Seller Onboarding</p>
        <h1 className="mt-3 text-3xl font-semibold leading-tight sm:text-4xl">Register as a HerdFlow Seller</h1>
        <p className="mt-3 max-w-2xl text-sm text-[#ecf1f8] sm:text-base">
          Submit your farm profile for verification. Approved sellers can publish livestock and product listings in the storefront.
        </p>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <div className="rounded-xl border border-[#d8e0ec] bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold text-brand-navy">Application Form</h2>
          <p className="mt-2 text-sm text-[#38537a]">
            Complete the form with your farm details and upload a national ID document for verification.
          </p>
          <div className="mt-4">
            <SellerRegistrationForm />
          </div>
        </div>

        <aside className="space-y-3 rounded-xl border border-[#d8e0ec] bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-brand-navy">Requirements</h2>
          <ul className="space-y-2 text-sm text-[#38537a]">
            <li>Farm name and operating location</li>
            <li>Valid South African contact details</li>
            <li>National ID number and ID document upload</li>
          </ul>
          <p className="text-xs text-[#5d7497]">
            Verification status updates will be sent to your registered email address.
          </p>
        </aside>
      </section>
    </main>
  );
}
