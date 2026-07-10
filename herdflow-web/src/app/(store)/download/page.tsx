// WEBSITE — herdflow-web/src/app/(store)/download/page.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Download HerdFlow | Free Farm App for Mobile & Desktop",
  description:
    "Download the free HerdFlow farm management app for Android or Windows. Track your herd, health records and vaccinations — works offline in remote farm areas.",
};

// Direct .apk artifact link (downloads the file immediately, no expo.dev
// build-details page in between). Get this via:
//   eas build:view <build-id> --json   ->  .artifacts.applicationArchiveUrl
// Build ID: 427f197c-e164-4bf3-98a7-09f16a5dcfaf (v1.9.0 — finished 2026-07-10)
// NOTE: EAS artifact links expire — this one expires roughly 2026-10-08. Refresh
// before then by running the command above against the latest build.
const EAS_APK_DIRECT =
  "https://expo.dev/artifacts/eas/FSlY72hUIVd-AHHNUk659cBj0vnMjqK5hHSa4a982IY.apk";
const APP_VERSION = "v1.9.0";

// Stable filename (see herdflow-desktop/package.json nsis.artifactName) so this
// GitHub "latest" redirect always resolves to the newest release's installer.
const DESKTOP_DOWNLOAD_URL =
  "https://github.com/jphgeyer-alt/herdflow/releases/latest/download/HerdFlow-Setup.exe";
const DESKTOP_RELEASES_URL = "https://github.com/jphgeyer-alt/herdflow/releases/latest";

// Free QR code API — generates real scannable QR images from any URL
function qrUrl(data: string, size = 180) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=10&data=${encodeURIComponent(data)}`;
}

function StepBadge({ n }: { n: number }) {
  return (
    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#1B3A6B] text-xs font-bold text-white">
      {n}
    </span>
  );
}

export default function DownloadPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <section className="bg-[#1B3A6B] px-4 py-16 text-white">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-semibold text-[#A07C3A]">
            Free Download · {APP_VERSION}
          </div>
          <h1 className="mb-4 text-3xl font-bold sm:text-5xl">
            Download HerdFlow
            <br />
            Farm App
          </h1>
          <p className="mx-auto max-w-xl text-lg leading-relaxed text-white/75">
            Manage your herd, health records, vaccinations and farm reports from your phone. Works
            offline in remote farm areas.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3 text-sm text-white/70">
            {["100% Free", "Works Offline", "Secure Data", "All Livestock Types"].map((f) => (
              <span key={f} className="rounded-full bg-white/10 px-4 py-1.5">
                {f}
              </span>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl space-y-8 px-4 py-12">
        {/* Option 1 — Android APK */}
        <div className="overflow-hidden rounded-2xl border-2 border-[#2E7D32] bg-white shadow-md">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#2E7D32] px-6 py-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🤖</span>
              <div>
                <h2 className="text-xl font-bold text-white">Android APK</h2>
                <p className="text-sm text-green-100">Recommended — no Play Store needed</p>
              </div>
            </div>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#2E7D32]">
              Most Popular
            </span>
          </div>

          <div className="flex flex-col gap-8 p-6 sm:flex-row">
            <div className="flex-1 space-y-4">
              <p className="text-sm leading-relaxed text-slate-600">
                Download the APK file directly to your Android phone. Install it like any normal
                app.
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
                    <p className="pt-0.5 text-sm text-slate-600">{step}</p>
                  </div>
                ))}
              </div>
              <a
                href={EAS_APK_DIRECT}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-[#2E7D32] px-6 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#1d5e20]"
              >
                ⬇️ Download APK for Android ({APP_VERSION})
              </a>
              <p className="text-xs text-slate-400">Android 8.0 and newer required</p>
              {/* What's new */}
              <div className="mt-2 rounded-lg border border-green-200 bg-green-50 p-4">
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[#2E7D32]">
                  What&apos;s new in {APP_VERSION}
                </p>
                <ul className="space-y-1">
                  {[
                    "🏷️ Animals auto-name from tag colour + number",
                    "💰 Purchase price now auto-recorded as a Finance expense",
                    "🐮 Link a new calf to its mother at add-time",
                    "🔢 Camp codes auto-generate (C-01, C-02...)",
                    "📊 Camp counts break down by bulls/cows/heifers/calves",
                    "📍 Open a camp's GPS location directly in Maps",
                    "🐂 Bull turnout tracking with expected calving windows",
                    "➕ Add multiple animals at once from a tag range",
                    "💊 Apply a treatment to a whole camp or selected animals",
                  ].map((item) => (
                    <li key={item} className="text-xs text-slate-600">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="flex shrink-0 flex-col items-center gap-2">
              {/* Real QR code generated by qrserver.com API */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrUrl(EAS_APK_DIRECT)}
                alt="QR code — HerdFlow APK download"
                width={160}
                height={160}
                className="rounded-lg border border-slate-200"
              />
              <p className="max-w-35 text-center text-xs leading-snug text-slate-500">
                Scan to download the APK on your phone
              </p>
            </div>
          </div>
        </div>

        {/* Option 2 — Windows Desktop */}
        <div className="overflow-hidden rounded-2xl border-2 border-slate-300 bg-white shadow-md">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-800 px-6 py-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🖥️</span>
              <div>
                <h2 className="text-xl font-bold text-white">Windows Desktop App</h2>
                <p className="text-sm text-slate-300">A dedicated app for the office PC</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-8 p-6 sm:flex-row">
            <div className="flex-1 space-y-4">
              <p className="text-sm leading-relaxed text-slate-600">
                Install HerdFlow as its own app on Windows — a taskbar icon and its own window, no
                browser tabs to hunt for.
              </p>
              <div className="space-y-3">
                {[
                  "Tap the Download for Windows button below",
                  "Open the downloaded HerdFlow-Setup.exe file",
                  "Follow the installer prompts",
                  "Launch HerdFlow from the Start Menu or desktop shortcut",
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <StepBadge n={i + 1} />
                    <p className="pt-0.5 text-sm text-slate-600">{step}</p>
                  </div>
                ))}
              </div>
              <a
                href={DESKTOP_DOWNLOAD_URL}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-6 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-slate-900"
              >
                ⬇️ Download for Windows
              </a>
              <p className="text-xs text-slate-400">
                Windows 10 and newer required ·{" "}
                <a
                  href={DESKTOP_RELEASES_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-slate-600"
                >
                  see release notes
                </a>
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrUrl(DESKTOP_RELEASES_URL)}
                alt="QR code — HerdFlow Desktop releases"
                width={160}
                height={160}
                className="rounded-lg border border-slate-200"
              />
              <p className="max-w-35 text-center text-xs leading-snug text-slate-500">
                Scan to open the releases page
              </p>
            </div>
          </div>
        </div>

        {/* Coming soon */}
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { icon: "📱", name: "iOS App Store" },
            { icon: "🏪", name: "Google Play Store" },
            { icon: "🍎", name: "macOS Desktop App" },
          ].map(({ icon, name }) => (
            <div
              key={name}
              className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center opacity-60"
            >
              <div className="mb-3 text-4xl">{icon}</div>
              <h3 className="font-bold text-slate-700">{name}</h3>
              <p className="mt-1 text-sm text-slate-500">Coming Soon</p>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="mb-5 text-xl font-bold text-[#1B3A6B]">Frequently Asked Questions</h2>
          <div className="divide-y divide-slate-100">
            {[
              {
                q: "Is the HerdFlow app free?",
                a: "Yes — completely free. No subscription or hidden fees.",
              },
              {
                q: "Is my farm data safe?",
                a: "Yes. Your data is encrypted and stored securely on our servers.",
              },
              {
                q: "Does it work without internet?",
                a: "Yes. The app works fully offline and syncs automatically when you reconnect.",
              },
              {
                q: "Which animals can I track?",
                a: "Cattle, sheep, goats, pigs, game, poultry and other livestock.",
              },
              {
                q: "How do I get support?",
                a: "WhatsApp us on +27 60 522 6267 or email support@herdflow.co.za.",
              },
              {
                q: "Can I use it on iPhone?",
                a: "An iOS version is coming soon. The website at herdflow.co.za works on iPhone Safari in the meantime.",
              },
            ].map(({ q, a }) => (
              <details key={q} className="group py-4">
                <summary className="flex cursor-pointer items-center justify-between text-sm font-semibold text-slate-800">
                  {q}
                  <span className="ml-4 text-[#A07C3A] transition-transform group-open:rotate-180">
                    v
                  </span>
                </summary>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{a}</p>
              </details>
            ))}
          </div>
        </div>

        {/* Support */}
        <div className="rounded-2xl bg-[#1B3A6B] p-8 text-center text-white">
          <h2 className="mb-2 text-2xl font-bold">Need help installing?</h2>
          <p className="mb-6 text-white/70">Our team helps any farmer get set up in minutes.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="https://wa.me/27605226267"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-[#2E7D32] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-[#1d5e20]"
            >
              WhatsApp Support
            </a>
            <a
              href="mailto:support@herdflow.co.za"
              className="inline-flex items-center gap-2 rounded-xl border-2 border-white/30 px-6 py-3 text-sm font-bold text-white transition-colors hover:border-white"
            >
              Email Support
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
