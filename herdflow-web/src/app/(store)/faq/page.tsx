import Link from "next/link";

function Question({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-[#e4ebf5] pb-6 last:border-0 last:pb-0">
      <h3 className="mb-2 text-lg font-bold text-[#1B3A6B]">{q}</h3>
      <div className="text-[#5d7497]">{children}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-5 text-xl font-black text-[#1B3A6B]">{title}</h2>
      <div className="space-y-6">{children}</div>
    </section>
  );
}

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-[#f5f4ef]">
      <div className="bg-[#1B3A6B] px-4 py-12 text-white md:px-8">
        <div className="mx-auto max-w-4xl">
          <h1 className="mb-2 text-4xl font-black">FAQ &amp; Help Centre</h1>
          <p className="text-white/80">Last updated: July 2026</p>
        </div>
      </div>
      <div className="mx-auto max-w-4xl px-4 py-12 md:px-8">
        <div className="space-y-12 rounded-2xl border border-[#e4ebf5] bg-white p-10 leading-relaxed shadow-lg">
          <Section title="Getting Started">
            <Question q="What is HerdFlow?">
              <p>
                HerdFlow is two things in one account: a mobile app for managing your own farm
                (animals, health records, camps/paddocks, nutrition, and finances) and a marketplace
                for buying and selling livestock and agricultural products in South Africa.
              </p>
            </Question>
            <Question q="Does the app work without internet?">
              <p>
                Yes. Everything you record is saved to your phone immediately and always available
                offline. When you have a connection, it syncs to your account in the background. If
                a sync fails (e.g. no signal), your record is still safely saved on your device — the
                app will keep retrying automatically.
              </p>
            </Question>
            <Question q="Can more than one person on my farm use the app?">
              <p>
                Yes. From your Profile, you can invite farm managers or workers with their own
                logins. They see the same farm data you do, scoped to your farm only — no other
                farmer can ever see your data, and you can&apos;t see theirs.
              </p>
            </Question>
          </Section>

          <Section title="AI-Assisted Features">
            <Question q="What can the AI features do?">
              <p>
                Three optional tools: scanning a receipt/invoice photo to pre-fill an expense,
                photographing a sick or injured animal to get possible conditions to discuss with a
                vet, and a pasture advisory that suggests grazing rotation based on your camp data,
                the weather forecast, and (for camps with a location set) satellite vegetation
                readings.
              </p>
            </Question>
            <Question q="Is the sick-animal photo tool a diagnosis?">
              <p>
                <strong>No.</strong> It is deliberately designed to never give a single confident
                answer — it always shows several possible conditions with reasoning, general
                first-step guidance only (never a specific drug, dosage, or procedure), and a
                permanent reminder to consult a veterinarian before acting. Treat it as a starting
                point for a conversation with your vet, not a substitute for one.
              </p>
            </Question>
            <Question q="Are my photos stored?">
              <p>
                No. A photo you use for scanning or triage is sent once for analysis and discarded —
                only the information you review and choose to save (e.g. the resulting transaction
                or treatment record) is kept.
              </p>
            </Question>
          </Section>

          <Section title="Weather &amp; Pasture Advisory">
            <Question q="Where does the weather data come from?">
              <p>
                OpenWeatherMap, a commercial weather data provider — not the South African Weather
                Service (SAWS). Use it as a general planning guide, not for severe-weather safety
                decisions; consult SAWS or a local advisory for official warnings.
              </p>
            </Question>
            <Question q="What is the vegetation health reading in Pasture Advisory?">
              <p>
                For a camp with a GPS location set, HerdFlow shows an NDVI (vegetation greenness)
                reading from Sentinel-2 satellite imagery via the EU&apos;s Copernicus programme, for
                an approximate area around that point — not a surveyed boundary of your camp. It&apos;s
                one input alongside your camp&apos;s rest status and the weather forecast, not a
                replacement for walking the land yourself.
              </p>
            </Question>
          </Section>

          <Section title="Traceability &amp; Compliance">
            <Question q="Does HerdFlow register my animals with an official traceability system?">
              <p>
                No. HerdFlow helps you record and export the animal ID, movement, and mortality
                information South African livestock traceability regulations may require, in a
                format you can hand to an inspector, vet, or upload elsewhere — but it does not
                submit anything to RMIS or any government registry on your behalf. If your farm is
                legally required to register with an official body, you remain responsible for doing
                so directly.
              </p>
            </Question>
          </Section>

          <Section title="Subscriptions &amp; Billing">
            <Question q="How does billing work?">
              <p>
                See our{" "}
                <Link href="/pricing" className="font-semibold text-[#2E7D32] hover:underline">
                  Pricing
                </Link>{" "}
                page for current plans and any free trial. Subscriptions are billed in advance for
                the period you choose and processed securely through PayFast; you can cancel anytime
                from your account settings, effective at the end of the current billing period.
              </p>
            </Question>
          </Section>

          <Section title="Privacy &amp; Data">
            <Question q="Who can see my farm data?">
              <p>
                Only you and any farm team members you invite. Full details on what we collect and
                how it&apos;s used are in our{" "}
                <Link href="/privacy" className="font-semibold text-[#2E7D32] hover:underline">
                  Privacy Policy
                </Link>
                .
              </p>
            </Question>
          </Section>

          <Section title="Still Need Help?">
            <Question q="How do I contact support?">
              <p>
                Email{" "}
                <a
                  href="mailto:support@herdflow.co.za"
                  className="font-semibold text-[#2E7D32] hover:underline"
                >
                  support@herdflow.co.za
                </a>{" "}
                — or use &quot;Email Support&quot; / &quot;Report a Problem&quot; from the Profile
                tab in the app, which pre-fills a message for you.
              </p>
            </Question>
          </Section>

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
