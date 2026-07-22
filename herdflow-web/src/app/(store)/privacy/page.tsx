import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#f5f4ef]">
      <div className="bg-[#1B3A6B] px-4 py-12 text-white md:px-8">
        <div className="mx-auto max-w-4xl">
          <h1 className="mb-2 text-4xl font-black">Privacy Policy</h1>
          <p className="text-white/80">Last updated: July 2026</p>
        </div>
      </div>
      <div className="mx-auto max-w-4xl px-4 py-12 md:px-8">
        <div className="space-y-8 rounded-2xl border border-[#e4ebf5] bg-white p-10 leading-relaxed text-[#5d7497] shadow-lg">
          <section>
            <h2 className="mb-4 text-xl font-black text-[#1B3A6B]">1. Information We Collect</h2>
            <p>
              We collect information you provide when creating an account (name, email, phone),
              placing orders on the marketplace (billing and shipping details), and registering as
              a seller or logistics partner (business information, identification documents).
            </p>
            <p className="mt-3">
              If you use the HerdFlow mobile app to manage your farm, we additionally collect: farm
              and livestock records you enter (animal details, health and treatment history,
              vaccination and breeding records, camp/paddock information, feed and nutrition
              inventory, financial transactions you log); GPS coordinates for camps/paddocks you
              choose to tag, and your device&apos;s approximate location when displaying a weather
              forecast (only while the app is open — the app never tracks your location in the
              background); and camera access for scanning ear-tag barcodes, receipts, and photos of
              animals for the features described in Section 5. Farm-team members you invite
              (managers/workers) can see the farm data you grant them access to, by design.
            </p>
          </section>
          <section>
            <h2 className="mb-4 text-xl font-black text-[#1B3A6B]">
              2. How We Use Your Information
            </h2>
            <p>
              Your information is used to operate the HerdFlow marketplace and mobile app, process
              orders and payments, verify seller and logistics identities, send transactional
              emails and push notifications (e.g. health reminders, camp rest reminders, weather
              alerts), and improve our services. We do not sell your personal data to third
              parties.
            </p>
          </section>
          <section>
            <h2 className="mb-4 text-xl font-black text-[#1B3A6B]">3. Data Storage and Security</h2>
            <p>
              Your data is stored securely in encrypted databases, isolated per farm account so
              other farmers cannot see your data. We implement industry-standard security measures
              including HTTPS encryption, secure cookie/token-based sessions, database-level access
              controls, and hashed passwords. Payment information is handled exclusively by
              PayFast and is not stored on HerdFlow servers. The mobile app stores a working copy
              of your farm data on your device (for offline use) and your login credentials in your
              device&apos;s secure hardware-backed storage (Keychain on iOS, Keystore on Android),
              not in plain, unencrypted app storage.
            </p>
          </section>
          <section>
            <h2 className="mb-4 text-xl font-black text-[#1B3A6B]">4. Cookies</h2>
            <p>
              We use cookies to maintain your login session and remember your cart on the website.
              These are essential cookies necessary for the platform to function. You may disable
              cookies in your browser settings, but this may affect functionality. The mobile app
              does not use cookies; it uses a secure device-stored session token instead.
            </p>
          </section>
          <section>
            <h2 className="mb-4 text-xl font-black text-[#1B3A6B]">5. Third-Party Services</h2>
            <p>
              HerdFlow uses PayFast for payment processing — their privacy policy governs how they
              handle your payment data. We use OpenWeatherMap to provide weather forecasts, and the
              Copernicus Data Space Ecosystem (an EU public satellite-data service) to provide
              vegetation-health readings for camps with a location set — both sent only the GPS
              coordinates needed for that lookup (a camp&apos;s tagged location, or your
              device&apos;s current location), never your name or account details. Where you choose
              to use the app&apos;s AI-assisted features (receipt scanning, sick-animal photo triage,
              pasture grazing advice), the photo or farm data you submit for that one request is sent
              to Anthropic (our AI provider) for analysis and is not retained by HerdFlow afterwards
              — only the information you review and choose to save (e.g. the transaction or
              treatment record) is stored. Livestock market price indicators shown in the app are
              sourced from published third-party industry data (RPO/ABSA, Digikraal) — this is public
              market data displayed to you, not your personal data being shared with them. We may
              also use analytics tools to understand platform usage.
            </p>
          </section>
          <section>
            <h2 className="mb-4 text-xl font-black text-[#1B3A6B]">6. Your Rights (POPIA)</h2>
            <p>
              Under the Protection of Personal Information Act (POPIA), you have the right to
              access, correct, or delete your personal information. To exercise these rights,
              contact us at{" "}
              <a href="mailto:privacy@herdflow.co.za" className="font-semibold text-[#2E7D32]">
                privacy@herdflow.co.za
              </a>
              .
            </p>
          </section>
          <section>
            <h2 className="mb-4 text-xl font-black text-[#1B3A6B]">7. Changes to This Policy</h2>
            <p>
              We may update this policy periodically. We will notify registered users of significant
              changes via email. Continued use of the platform after changes constitutes acceptance
              of the updated policy.
            </p>
          </section>
          <section>
            <h2 className="mb-4 text-xl font-black text-[#1B3A6B]">8. Contact</h2>
            <p>
              For privacy-related enquiries, contact{" "}
              <a href="mailto:privacy@herdflow.co.za" className="font-semibold text-[#2E7D32]">
                privacy@herdflow.co.za
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
