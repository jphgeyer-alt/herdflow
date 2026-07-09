import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#f5f4ef]">
      <div className="bg-[#1B3A6B] px-4 py-12 text-white md:px-8">
        <div className="mx-auto max-w-4xl">
          <h1 className="mb-2 text-4xl font-black">Terms of Service</h1>
          <p className="text-white/80">Last updated: July 2026</p>
        </div>
      </div>
      <div className="mx-auto max-w-4xl px-4 py-12 md:px-8">
        <div className="space-y-8 rounded-2xl border border-[#e4ebf5] bg-white p-10 leading-relaxed text-[#5d7497] shadow-lg">
          <section>
            <h2 className="mb-4 text-xl font-black text-[#1B3A6B]">1. Acceptance of Terms</h2>
            <p>
              By accessing or using HerdFlow, you agree to be bound by these Terms of Service. If
              you do not agree to all terms, you may not access or use our services.
            </p>
          </section>
          <section>
            <h2 className="mb-4 text-xl font-black text-[#1B3A6B]">2. Use of the Platform</h2>
            <p>
              HerdFlow is a marketplace for agricultural trade. Users must be 18 years or older and
              legally authorized to conduct transactions in South Africa. All listings must be
              accurate and comply with South African law.
            </p>
          </section>
          <section>
            <h2 className="mb-4 text-xl font-black text-[#1B3A6B]">3. Seller Obligations</h2>
            <p>
              Sellers must provide accurate product information, maintain up-to-date listings, and
              fulfil orders within the agreed timeframe. Fraudulent listings will result in
              immediate account termination.
            </p>
          </section>
          <section>
            <h2 className="mb-4 text-xl font-black text-[#1B3A6B]">4. Payments</h2>
            <p>
              All payments are processed through PayFast, a secure South African payment gateway.
              HerdFlow does not store your payment card details. Transaction fees may apply.
            </p>
          </section>
          <section>
            <h2 className="mb-4 text-xl font-black text-[#1B3A6B]">5. Dispute Resolution</h2>
            <p>
              Disputes between buyers and sellers must first be attempted to resolve directly. If
              unresolved, contact HerdFlow support at support@herdflow.co.za. HerdFlow reserves the
              right to mediate or remove listings at its discretion.
            </p>
          </section>
          <section>
            <h2 className="mb-4 text-xl font-black text-[#1B3A6B]">6. Limitation of Liability</h2>
            <p>
              HerdFlow is a marketplace platform and is not liable for the quality, safety, or
              legality of items listed, the truth or accuracy of listings, or the ability of sellers
              to sell or buyers to purchase items.
            </p>
          </section>
          <section>
            <h2 className="mb-4 text-xl font-black text-[#1B3A6B]">7. Changes to Terms</h2>
            <p>
              We reserve the right to modify these terms at any time. Continued use of the platform
              constitutes acceptance of revised terms.
            </p>
          </section>
          <section>
            <h2 className="mb-4 text-xl font-black text-[#1B3A6B]">8. Contact</h2>
            <p>
              For questions about these terms, contact us at{" "}
              <a href="mailto:support@herdflow.co.za" className="font-semibold text-[#2E7D32]">
                support@herdflow.co.za
              </a>
              .
            </p>
          </section>
          <div className="border-t border-[#e4ebf5] pt-4">
            <Link href="/" className="font-semibold text-[#2E7D32] hover:underline">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
