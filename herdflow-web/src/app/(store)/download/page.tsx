// WEBSITE — herdflow-web/src/app/(store)/download/page.tsx
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Download HerdFlow Farm App | Free Mobile App for Farmers",
  description:
    "Download the free HerdFlow farm management app for Android. Track your herd, health records, vaccinations and more — works offline in remote areas.",
};

const EXPO_GO_URL = "exp://exp.host/@hannesgeyer101/herdflow";
const EAS_APK_URL = "https://expo.dev/accounts/hannesgeyer101/projects/herdflow/builds";

function QRCodePlaceholder({ label }: { label: string }) {
  // Simple styled QR placeholder — real QR generated at qr-code-generator.com
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="w-32 h-32 border-2 border-dashed border-[#A07C3A] rounded-lg flex items-center justify-center bg-white">
        <div className="text-center p-2">
          <div className="text-2xl">📱</div>
          <p className="text-[9px] text-slate-500 mt-1 leading-tight">
            Generate QR at<br />qr-code-generator.com
          </p>
        </div>
      </div>
      <p className="text-xs text-slate-500 text-center max-w-[140px] leading-snug">{label}</p>
    </div>
  );
}

function StepBadge({ n }: { n: number }) {
  return (
    <div className="flex-shrink-0 w-7 h-7 rounded-full bg-[#1B3A6B] text-white text-xs font-bold flex items-center justify-center">
      {n}
    </div>
  );
}

export default function DownloadPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <section className="bg-[#1B3A6B] text-white py-16 px-4">
        <div className="mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-semibold text-[#A07C3A] mb-6">
            📱 Free Download
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold mb-4">
            Download HerdFlow<br />Farm App
          </h1>
          <p className="text-white/75 text-lg max-w-xl mx-auto leading-relaxed">
            Manage your herd, health records, vaccinations and farm reports — directly from your phone. Works offline in remote farm areas.
          </p>
          <div className="flex flex-wrap justify-center gap-3 mt-8 text-sm text-white/70">
            {["✅ 100% Free", "📶 Works Offline", "🔒 Secure Data", "🐄 All Livestock Types"].map((f) => (
              <span key={f} className="rounded-full bg-white/10 px-4 py-1.5">{f}</span>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 py-12 space-y-8">

        {/* Option 1 — Android APK */}
        <div className="rounded-2xl border-2 border-[#2E7D32] bg-white overflow-hidden shadow-md">
          <div className="bg-[#2E7D32] px-6 py-4 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🤖</span>
              <div>
                <h2 className="text-xl font-bold text-white">Android APK</h2>
                <p className="text-green-100 text-sm">Recommended · Direct install</p>
              </div>
            </div>
            <span className="rounded-full bg-white text-[#2E7D32] text-xs font-bold px-3 py-1 uppercase tracking-wide">
              Most Popular
            </span>
          </div>

          <div className="p-6 flex flex-col sm:flex-row gap-8">
            <div className="flex-1 space-y-4">
              <p className="text-slate-600 text-sm leading-relaxed">
                Download the APK file directly to your Android phone and install it without needing the Google Play Store.
              </p>

              <div className="space-y-3">
                {[
                  "Tap the Download APK button below",
                  "Open the downloaded file on your phone",
                  'Allow "Install from unknown sources" if prompted in Settings → Security',
                  "Open HerdFlow and create your free account",
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <StepBadge n={i + 1} />
                    <p className="text-sm text-slate-600 pt-0.5">{step}</p>
                  </div>
                ))}
              </div>

              <a
                href={EAS_APK_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-[#2E7D32] hover:bg-[#1d5e20] text-white font-bold px-6 py-3 text-sm transition-colors shadow-sm"
              >
                ⬇️ Download APK for Android
              </a>
              <p className="text-xs text-slate-400">Android 8.0+ required · ~50 MB</p>
            </div>

            <div className="flex justify-center sm:justify-end">
              <QRCodePlaceholder label="Scan to go to download page" />
            </div>
          </div>
        </div>

        {/* Option 2 — Expo Go */}
        <div className="rounded-2xl border-2 border-[#1B3A6B] bg-white overflow-hidden shadow-md">
          <div className="bg-[#1B3A6B] px-6 py-4 flex items-center gap-3">
            <span className="text-3xl">🚀</span>
            <div>
              <h2 className="text-xl font-bold text-white">Test with Expo Go</h2>
              <p className="text-blue-200 text-sm">Fastest option — no installation needed</p>
            </div>
          </div>

          <div className="p-6 flex flex-col sm:flex-row gap-8">
            <div className="flex-1 space-y-4">
              <p className="text-slate-600 text-sm leading-relaxed">
                Use the free <strong>Expo Go</strong> app to run HerdFlow instantly. Perfect for testing before full installation.
              </p>

              <div className="space-y-3">
                {[
                  "Download Expo Go from the Google Play Store (free)",
                  "Open Expo Go and tap Scan QR Code",
                  "Scan the QR code on this page",
                  "HerdFlow opens immediately — no install needed",
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <StepBadge n={i + 1} />
                    <p className="text-sm text-slate-600 pt-0.5">{step}</p>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-3">
                <a
                  href="https://play.google.com/store/apps/details?id=host.exp.exponent"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#1B3A6B] hover:bg-[#0f1e44] text-white font-bold px-5 py-2.5 text-sm transition-colors"
                >
                  📲 Download Expo Go
                </a>
                <a
                  href={EXPO_GO_URL}
                  className="inline-flex items-center gap-2 rounded-xl border-2 border-[#1B3A6B] text-[#1B3A6B] font-bold px-5 py-2.5 text-sm hover:bg-[#1B3A6B] hover:text-white transition-colors"
                >
                  Open in Expo Go
                </a>
              </div>

              <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
                <p className="text-xs font-semibold text-slate-600 mb-1">Direct Expo Go link:</p>
                <code className="text-xs text-[#1B3A6B] break-all">{EXPO_GO_URL}</code>
              </div>
            </div>

            <div className="flex justify-center sm:justify-end">
              <QRCodePlaceholder label="Scan with Expo Go app" />
            </div>
          </div>
        </div>

        {/* Coming soon */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center opacity-60">
            <div className="text-4xl mb-3"></div>
            <h3 className="font-bold text-slate-700">iOS App Store</h3>
            <p className="text-sm text-slate-500 mt-1">Coming Soon</p>
          </div>
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center opacity-60">
            <div className="text-4xl mb-3">🏪</div>
            <h3 className="font-bold text-slate-700">Google Play Store</h3>
            <p className="text-sm text-slate-500 mt-1">Coming Soon</p>
          </div>
        </div>

        {/* FAQ */}
        <div className="rounded-2xl bg-white border border-slate-200 p-6">
          <h2 className="text-xl font-bold text-[#1B3A6B] mb-5">Frequently Asked Questions</h2>
          <div className="divide-y divide-slate-100">
            {[
              { q: "Is the HerdFlow app free?", a: "Yes — completely free. No subscription or hidden fees." },
              { q: "Is my farm data safe?", a: "Yes. Your data is encrypted and stored securely on our servers in South Africa." },
              { q: "Does it work without internet?", a: "Yes. The app works fully offline and syncs your records automatically when you reconnect." },
              { q: "Which animals can I track?", a: "Cattle, sheep, goats, pigs, game, poultry and other livestock." },
              { q: "How do I get help or support?", a: "WhatsApp us on +27600000000 or email support@herdflow.co.za — we respond quickly." },
              { q: "Can I use it on iOS (iPhone)?", a: "An iOS version is coming soon. For now, use the website at herdflow.co.za from Safari." },
            ].map(({ q, a }) => (
              <details key={q} className="group py-4">
                <summary className="flex cursor-pointer items-center justify-between text-sm font-semibold text-slate-800">
                  {q}
                  <span className="ml-4 text-[#A07C3A] group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">{a}</p>
              </details>
            ))}
          </div>
        </div>

        {/* Support CTA */}
        <div className="rounded-2xl bg-[#1B3A6B] text-white p-8 text-center">
          <h2 className="text-2xl font-bold mb-2">Need help installing?</h2>
          <p className="text-white/70 mb-6">Our team is ready to help farmers get set up quickly.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="https://wa.me/27600000000"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-[#2E7D32] hover:bg-[#1d5e20] text-white font-bold px-6 py-3 text-sm transition-colors"
            >
              💬 WhatsApp Support
            </a>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-xl border-2 border-white/30 hover:border-white text-white font-bold px-6 py-3 text-sm transition-colors"
            >
              ✉️ Email Support
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
