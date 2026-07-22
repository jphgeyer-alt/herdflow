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
              HerdFlow operates two things under one account: a marketplace for agricultural trade,
              and the HerdFlow mobile app, a farm-management tool for recording and tracking your own
              livestock, health records, camps, nutrition, and finances. Users must be 18 years or
              older and legally authorized to conduct transactions and operate a farm business in
              South Africa. All marketplace listings must be accurate and comply with South African
              law.
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
            <h2 className="mb-4 text-xl font-black text-[#1B3A6B]">
              4. Farm Data You Enter — Accuracy Is Your Responsibility
            </h2>
            <p>
              The mobile app is a record-keeping and decision-support tool. You are solely
              responsible for the accuracy of the animal, health, financial, and camp data you enter
              — HerdFlow does not verify it. Reminders, stock levels, dosage calculations, and
              reports are only as accurate as the data and settings you provide, and are provided as
              a convenience, not a guarantee.
            </p>
          </section>
          <section>
            <h2 className="mb-4 text-xl font-black text-[#1B3A6B]">
              5. AI-Assisted Features — Not Professional Advice
            </h2>
            <p>
              HerdFlow includes optional AI-assisted features: a sick-animal photo triage tool, a
              receipt-scanning tool, and a pasture/grazing advisory tool. These use a third-party AI
              model to analyse a photo or your own farm data and suggest possibilities — they are{" "}
              <strong>not a diagnosis, not veterinary advice, and not a substitute for consulting a
              qualified veterinarian, agronomist, or professional advisor.</strong> The sick-animal
              triage tool in particular is deliberately designed to present multiple possibilities
              and general first-step guidance only — it will never recommend a specific drug, dosage,
              or procedure, and always requires you to consult a vet before acting. You remain solely
              responsible for all animal-health, grazing, and financial decisions you make, whether
              or not informed by these tools. HerdFlow is not liable for outcomes resulting from
              reliance on AI-generated suggestions.
            </p>
          </section>
          <section>
            <h2 className="mb-4 text-xl font-black text-[#1B3A6B]">
              6. Traceability &amp; Regulatory Compliance
            </h2>
            <p>
              HerdFlow provides tools to help you record and export the animal identification,
              movement, and mortality data South African livestock traceability regulations may
              require. HerdFlow is not an official government or industry traceability registry
              (such as RMIS or a SAWS-linked system), does not submit data to any such registry on
              your behalf, and using HerdFlow does not by itself satisfy any legal traceability or
              disease-control obligation you may have. You remain responsible for registering with
              and reporting to the correct official body where required by law.
            </p>
          </section>
          <section>
            <h2 className="mb-4 text-xl font-black text-[#1B3A6B]">7. Subscriptions &amp; Payments</h2>
            <p>
              The mobile app is offered under the subscription plans described on our Pricing page,
              including any free trial period stated at signup. Marketplace payments (buyer/seller
              transactions) and app subscription payments are both processed through PayFast, a
              secure South African payment gateway — HerdFlow does not store your payment card
              details. Subscription fees are billed in advance for the period selected and, except
              where required by law, are non-refundable for partial periods. You may cancel a
              subscription at any time from your account settings; cancellation takes effect at the
              end of the current billing period.
            </p>
          </section>
          <section>
            <h2 className="mb-4 text-xl font-black text-[#1B3A6B]">8. Dispute Resolution</h2>
            <p>
              Disputes between buyers and sellers must first be attempted to resolve directly. If
              unresolved, contact HerdFlow support at support@herdflow.co.za. HerdFlow reserves the
              right to mediate or remove listings at its discretion.
            </p>
          </section>
          <section>
            <h2 className="mb-4 text-xl font-black text-[#1B3A6B]">9. Limitation of Liability</h2>
            <p>
              HerdFlow is a marketplace and farm-management platform. To the maximum extent
              permitted by law, HerdFlow is not liable for: the quality, safety, or legality of
              marketplace listings, or the truth of listings; the accuracy of farm data you enter or
              of any AI-generated suggestion; loss of livestock, income, or business arising from
              reliance on the app's reminders, calculations, or advisory tools; or outages, sync
              delays, or data unavailable due to your device or internet connection (the app is
              designed to store your data locally first and sync when connectivity allows, but we
              do not guarantee sync will always succeed immediately).
            </p>
          </section>
          <section>
            <h2 className="mb-4 text-xl font-black text-[#1B3A6B]">10. Changes to Terms</h2>
            <p>
              We reserve the right to modify these terms at any time. Continued use of the platform
              constitutes acceptance of revised terms.
            </p>
          </section>
          <section>
            <h2 className="mb-4 text-xl font-black text-[#1B3A6B]">11. Contact</h2>
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
