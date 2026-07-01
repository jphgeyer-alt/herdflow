import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#f5f4ef]">
      <div className="bg-[#1B3A6B] text-white py-12 px-4 md:px-8">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-4xl font-black mb-2">Privacy Policy</h1>
          <p className="text-white/80">Last updated: July 2026</p>
        </div>
      </div>
      <div className="mx-auto max-w-4xl px-4 md:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-lg border border-[#e4ebf5] p-10 space-y-8 text-[#5d7497] leading-relaxed">
          <section>
            <h2 className="text-xl font-black text-[#1B3A6B] mb-4">1. Information We Collect</h2>
            <p>We collect information you provide when creating an account (name, email, phone), placing orders (billing and shipping details), and registering as a seller or logistics partner (business information, identification documents).</p>
          </section>
          <section>
            <h2 className="text-xl font-black text-[#1B3A6B] mb-4">2. How We Use Your Information</h2>
            <p>Your information is used to operate the HerdFlow marketplace, process orders and payments, verify seller and logistics identities, send transactional emails, and improve our services. We do not sell your personal data to third parties.</p>
          </section>
          <section>
            <h2 className="text-xl font-black text-[#1B3A6B] mb-4">3. Data Storage and Security</h2>
            <p>Your data is stored securely in encrypted databases. We implement industry-standard security measures including HTTPS encryption, secure cookie sessions, and access controls. Payment information is handled exclusively by PayFast and is not stored on HerdFlow servers.</p>
          </section>
          <section>
            <h2 className="text-xl font-black text-[#1B3A6B] mb-4">4. Cookies</h2>
            <p>We use cookies to maintain your login session and remember your cart. These are essential cookies necessary for the platform to function. You may disable cookies in your browser settings, but this may affect functionality.</p>
          </section>
          <section>
            <h2 className="text-xl font-black text-[#1B3A6B] mb-4">5. Third-Party Services</h2>
            <p>HerdFlow uses PayFast for payment processing. Their privacy policy governs how they handle your payment data. We may also use analytics tools to understand platform usage.</p>
          </section>
          <section>
            <h2 className="text-xl font-black text-[#1B3A6B] mb-4">6. Your Rights (POPIA)</h2>
            <p>Under the Protection of Personal Information Act (POPIA), you have the right to access, correct, or delete your personal information. To exercise these rights, contact us at <a href="mailto:privacy@herdflow.co.za" className="text-[#2E7D32] font-semibold">privacy@herdflow.co.za</a>.</p>
          </section>
          <section>
            <h2 className="text-xl font-black text-[#1B3A6B] mb-4">7. Changes to This Policy</h2>
            <p>We may update this policy periodically. We will notify registered users of significant changes via email. Continued use of the platform after changes constitutes acceptance of the updated policy.</p>
          </section>
          <section>
            <h2 className="text-xl font-black text-[#1B3A6B] mb-4">8. Contact</h2>
            <p>For privacy-related enquiries, contact <a href="mailto:privacy@herdflow.co.za" className="text-[#2E7D32] font-semibold">privacy@herdflow.co.za</a>.</p>
          </section>
          <div className="pt-4 border-t border-[#e4ebf5]">
            <Link href="/" className="text-[#2E7D32] font-semibold hover:underline">← Back to Home</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
