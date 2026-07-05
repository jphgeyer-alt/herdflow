// WEBSITE — herdflow-web/src/app/(store)/download/page.tsx
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Download HerdFlow Farm App | Free Mobile App for Farmers",
  description:
    "Download the free HerdFlow farm management app. Track your herd, health records and vaccinations — works offline in remote farm areas.",
};

// Update EAS_APK_URL once eas build --platform android --profile preview completes
// Build ID: f09c8110-b476-45db-bc19-3d966899ba92 (v1.4.0 QA — finished 2026-07-05)
// Previous build (v1.4.0): dU6aazjPz9WcpFfUYHis58aEWbaMVU8tQlHkPx2jfjc.apk
const EAS_BUILDS_PAGE = "https://expo.dev/accounts/hannesgeyer101/projects/herdflow/builds/f09c8110-b476-45db-bc19-3d966899ba92";
const EAS_APK_DIRECT  = "https://expo.dev/artifacts/eas/NfdxmQ3J6YVQrYgWOr6l_C43vQ6zbyiws6E_jNznqgw.apk";
const APP_VERSION     = "v1.4.0";
const EXPO_GO_URL = "exp://u.expo.dev/9adc77e5-3ea3-4131-a3a6-b4c4091e3e4b?channel-name=production";

// Free QR code API — generates real scannable QR images from any URL
function qrUrl(data: string, size = 180) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=10&data=${encodeURIComponent(data)}`;
}

function StepBadge({ n }: { n: number }) {
  return (
    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[#1B3A6B] text-white text-xs font-bold flex items-center justify-center">
      {n}
    </span>
  );
}

export default function DownloadPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <section className="bg-[#1B3A6B] text-white py-16 px-4">
        <div className="mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-semibold text-[#A07C3A] mb-6">
            Free Download · {APP_VERSION}
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold mb-4">
            Download HerdFlow<br />Farm App
          </h1>
          <p className="text-white/75 text-lg max-w-xl mx-auto leading-relaxed">
            Manage your herd, health records, vaccinations and farm reports from your phone.
            Works offline in remote farm areas.
          </p>
          <div className="flex flex-wrap justify-center gap-3 mt-8 text-sm text-white/70">
            {["100% Free", "Works Offline", "Secure Data", "All Livestock Types"].map((f) => (
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
                <p className="text-green-100 text-sm">Recommended — no Play Store needed</p>
              </div>
            </div>
            <span className="rounded-full bg-white text-[#2E7D32] text-xs font-bold px-3 py-1 uppercase tracking-wide">
              Most Popular
            </span>
          </div>

          <div className="p-6 flex flex-col sm:flex-row gap-8">
            <div className="flex-1 space-y-4">
              <p className="text-slate-600 text-sm leading-relaxed">
                Download the APK file directly to your Android phone. Install it like any normal app.
              </p>
              <div className="space-y-3">
                {[
                  "Tap the Download APK button below",
                  "The APK file downloads to your phone",
                  "Open the downloaded file and tap Install",
                  "Allow unknown sources if prompted in Settings",
                  "Open HerdFlow and create your free account",
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <StepBadge n={i + 1} />
                    <p className="text-sm text-slate-600 pt-0.5">{step}</p>
                  </div>
                ))}
              </div>
              <a
                href={EAS_APK_DIRECT}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-[#2E7D32] hover:bg-[#1d5e20] text-white font-bold px-6 py-3 text-sm transition-colors shadow-sm"
              >
                ⬇️ Download APK for Android ({APP_VERSION})
              </a>
              <p className="text-xs text-slate-400">Android 8.0 and newer required</p>
              {/* What's new */}
              <div className="rounded-lg bg-green-50 border border-green-200 p-4 mt-2">
                <p className="text-xs font-bold text-[#2E7D32] uppercase tracking-wide mb-2">What&apos;s new in {APP_VERSION}</p>
                <ul className="space-y-1">
                  {[
                    "🌿 Camp Management — rotational grazing tracking",
                    "📋 Count Animals — records who counted & when",
                    "🔄 Move Animals — records who moved & reason",
                    "💊 Medicine & Treatment tracking",
                    "🔒 Role-based access (FARM_WORKER can't see financials)",
                  ].map(item => (
                    <li key={item} className="text-xs text-slate-600">{item}</li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="flex flex-col items-center gap-2 shrink-0">
              {/* Real QR code generated by qrserver.com API */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrUrl(EAS_APK_DIRECT)}
                alt="QR code — HerdFlow APK download"
                width={160}
                height={160}
                className="rounded-lg border border-slate-200"
              />
              <p className="text-xs text-slate-500 text-center max-w-[140px] leading-snug">
                Scan to go to download page on your phone
              </p>
            </div>
          </div>
        </div>

        {/* Option 2 — Expo Go */}
        <div className="rounded-2xl border-2 border-[#1B3A6B] bg-white overflow-hidden shadow-md">
          <div className="bg-[#1B3A6B] px-6 py-4 flex items-center gap-3">
            <span className="text-3xl">🚀</span>
            <div>
              <h2 className="text-xl font-bold text-white">Test with Expo Go</h2>
              <p className="text-blue-200 text-sm">For developers and testers — instant preview</p>
            </div>
          </div>

          <div className="p-6 flex flex-col sm:flex-row gap-8">
            <div className="flex-1 space-y-4">
              <p className="text-slate-600 text-sm leading-relaxed">
                Use the free <strong>Expo Go</strong> app to run HerdFlow instantly without installing a full APK.
              </p>
              <div className="space-y-3">
                {[
                  "Download Expo Go from Google Play Store (free)",
                  "Open Expo Go and tap Scan QR Code",
                  "Scan the QR code on the right",
                  "HerdFlow opens immediately",
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <StepBadge n={i + 1} />
                    <p className="text-sm text-slate-600 pt-0.5">{step}</p>
                  </div>
                ))}
              </div>
              <a
                href="https://play.google.com/store/apps/details?id=host.exp.exponent"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-[#1B3A6B] hover:bg-[#0f1e44] text-white font-bold px-5 py-2.5 text-sm transition-colors"
              >
                Download Expo Go from Play Store
              </a>
              <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
                <p className="text-xs font-semibold text-slate-600 mb-1">Or paste this link into Expo Go:</p>
                <code className="text-xs text-[#1B3A6B] break-all select-all">{EXPO_GO_URL}</code>
              </div>
            </div>
            <div className="flex flex-col items-center gap-2 shrink-0">
              {/* Real QR code for Expo Go */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrUrl(EXPO_GO_URL)}
                alt="QR code — HerdFlow on Expo Go"
                width={160}
                height={160}
                className="rounded-lg border border-slate-200"
              />
              <p className="text-xs text-slate-500 text-center max-w-[140px] leading-snug">
                Scan with Expo Go app
              </p>
            </div>
          </div>
        </div>

        {/* Coming soon */}
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { icon: "📱", name: "iOS App Store" },
            { icon: "🏪", name: "Google Play Store" },
          ].map(({ icon, name }) => (
            <div key={name} className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center opacity-60">
              <div className="text-4xl mb-3">{icon}</div>
              <h3 className="font-bold text-slate-700">{name}</h3>
              <p className="text-sm text-slate-500 mt-1">Coming Soon</p>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="rounded-2xl bg-white border border-slate-200 p-6">
          <h2 className="text-xl font-bold text-[#1B3A6B] mb-5">Frequently Asked Questions</h2>
          <div className="divide-y divide-slate-100">
            {[
              { q: "Is the HerdFlow app free?",        a: "Yes — completely free. No subscription or hidden fees." },
              { q: "Is my farm data safe?",            a: "Yes. Your data is encrypted and stored securely on our servers." },
              { q: "Does it work without internet?",   a: "Yes. The app works fully offline and syncs automatically when you reconnect." },
              { q: "Which animals can I track?",       a: "Cattle, sheep, goats, pigs, game, poultry and other livestock." },
              { q: "How do I get support?",            a: "WhatsApp us on +27600000000 or email support@herdflow.co.za." },
              { q: "Can I use it on iPhone?",          a: "An iOS version is coming soon. The website at herdflow.co.za works on iPhone Safari in the meantime." },
            ].map(({ q, a }) => (
              <details key={q} className="group py-4">
                <summary className="flex cursor-pointer items-center justify-between text-sm font-semibold text-slate-800">
                  {q}
                  <span className="ml-4 text-[#A07C3A] group-open:rotate-180 transition-transform">v</span>
                </summary>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">{a}</p>
              </details>
            ))}
          </div>
        </div>

        {/* Support */}
        <div className="rounded-2xl bg-[#1B3A6B] text-white p-8 text-center">
          <h2 className="text-2xl font-bold mb-2">Need help installing?</h2>
          <p className="text-white/70 mb-6">Our team helps any farmer get set up in minutes.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="https://wa.me/27600000000"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-[#2E7D32] hover:bg-[#1d5e20] text-white font-bold px-6 py-3 text-sm transition-colors"
            >
              WhatsApp Support
            </a>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-xl border-2 border-white/30 hover:border-white text-white font-bold px-6 py-3 text-sm transition-colors"
            >
              Email Support
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
