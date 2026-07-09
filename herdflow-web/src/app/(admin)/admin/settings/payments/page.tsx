"use client";

import { useEffect, useRef, useState } from "react";

type Config = {
  payfast_merchant_id: string;
  payfast_merchant_key: string;
  payfast_passphrase: string;
  commission_rate: string;
};

const EMPTY: Config = {
  payfast_merchant_id: "",
  payfast_merchant_key: "",
  payfast_passphrase: "",
  commission_rate: "0.05",
};

export default function AdminPaymentsSettingsPage() {
  const [config, setConfig] = useState<Config>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ ok: boolean; msg: string } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch("/api/admin/settings/payments")
      .then((r) => r.json())
      .then((data) => {
        if (data.config) setConfig({ ...EMPTY, ...data.config });
      })
      .finally(() => setLoading(false));
  }, []);

  function showToast(ok: boolean, msg: string) {
    setToast({ ok, msg });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings/payments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(true, "Payment settings saved.");
      } else {
        showToast(false, (data as { error?: string }).error || "Failed to save.");
      }
    } catch {
      showToast(false, "Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function handle(field: keyof Config) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setConfig((prev) => ({ ...prev, [field]: e.target.value }));
  }

  return (
    <main className="space-y-5 pb-10">
      <header>
        <h1 className="text-brand-navy text-3xl font-semibold">Payment Settings</h1>
        <p className="text-sm text-[#38537a]">
          Configure PayFast merchant credentials. These values are stored in the database and
          override environment variables at runtime.
        </p>
      </header>

      {toast && (
        <div
          role="alert"
          className={`rounded-lg border px-4 py-3 text-sm font-medium ${
            toast.ok
              ? "border-green-300 bg-green-50 text-green-800"
              : "border-red-300 bg-red-50 text-red-800"
          }`}
        >
          {toast.msg}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="max-w-xl space-y-5 rounded-xl border border-[#d8e0ec] bg-white p-6 shadow-sm"
      >
        <section className="space-y-4">
          <h2 className="text-brand-navy text-base font-semibold">PayFast Credentials</h2>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-[#244367]" htmlFor="pf-merchant-id">
              Merchant ID
            </label>
            <input
              id="pf-merchant-id"
              type="text"
              className="focus:border-brand-navy focus:ring-brand-navy/20 w-full rounded-lg border border-[#cdd8e7] px-3 py-2 text-sm text-[#1a2c42] placeholder-[#9aabb9] outline-none focus:ring-2"
              placeholder="10000100"
              value={config.payfast_merchant_id}
              onChange={handle("payfast_merchant_id")}
              disabled={loading}
              autoComplete="off"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-[#244367]" htmlFor="pf-merchant-key">
              Merchant Key
            </label>
            <input
              id="pf-merchant-key"
              type="text"
              className="focus:border-brand-navy focus:ring-brand-navy/20 w-full rounded-lg border border-[#cdd8e7] px-3 py-2 text-sm text-[#1a2c42] placeholder-[#9aabb9] outline-none focus:ring-2"
              placeholder="46f0cd694581a"
              value={config.payfast_merchant_key}
              onChange={handle("payfast_merchant_key")}
              disabled={loading}
              autoComplete="off"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-[#244367]" htmlFor="pf-passphrase">
              Passphrase{" "}
              <span className="font-normal text-[#5d7497]">
                (optional — leave blank if not set)
              </span>
            </label>
            <input
              id="pf-passphrase"
              type="password"
              className="focus:border-brand-navy focus:ring-brand-navy/20 w-full rounded-lg border border-[#cdd8e7] px-3 py-2 text-sm text-[#1a2c42] placeholder-[#9aabb9] outline-none focus:ring-2"
              placeholder="••••••••"
              value={config.payfast_passphrase}
              onChange={handle("payfast_passphrase")}
              disabled={loading}
              autoComplete="new-password"
            />
          </div>
        </section>

        <section className="space-y-4 border-t border-[#e4ebf5] pt-4">
          <h2 className="text-brand-navy text-base font-semibold">Marketplace Commission</h2>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-[#244367]" htmlFor="commission-rate">
              Commission Rate{" "}
              <span className="font-normal text-[#5d7497]">
                (decimal — e.g. 0.05 = 5%. Applied to every seller sale and livestock sale.)
              </span>
            </label>
            <input
              id="commission-rate"
              type="number"
              step="0.01"
              min="0"
              max="1"
              className="focus:border-brand-navy focus:ring-brand-navy/20 w-full max-w-40 rounded-lg border border-[#cdd8e7] px-3 py-2 text-sm text-[#1a2c42] placeholder-[#9aabb9] outline-none focus:ring-2"
              placeholder="0.05"
              value={config.commission_rate}
              onChange={handle("commission_rate")}
              disabled={loading}
            />
          </div>
        </section>

        <div className="rounded-lg border border-[#e4ebf5] bg-[#f5f8fd] p-3 text-xs text-[#5d7497]">
          <p className="font-semibold text-[#38537a]">Important</p>
          <p className="mt-1">
            For production deployments set{" "}
            <code className="rounded bg-[#e4ebf5] px-1 py-0.5">PAYFAST_MERCHANT_ID</code>,{" "}
            <code className="rounded bg-[#e4ebf5] px-1 py-0.5">PAYFAST_MERCHANT_KEY</code>, and
            optionally <code className="rounded bg-[#e4ebf5] px-1 py-0.5">PAYFAST_PASSPHRASE</code>{" "}
            as server environment variables. Values saved here take effect immediately without a
            redeploy.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading || saving}
          className="bg-brand-navy inline-flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save Settings"}
        </button>
      </form>

      <aside className="max-w-xl rounded-xl border border-[#d8e0ec] bg-white p-5 shadow-sm">
        <h2 className="text-brand-navy text-base font-semibold">PayFast Sandbox</h2>
        <p className="mt-2 text-sm text-[#38537a]">
          To test payments use PayFast sandbox credentials and set{" "}
          <code className="rounded bg-[#eef3fb] px-1 py-0.5 text-xs">PAYFAST_PROCESS_URL</code> to{" "}
          <code className="rounded bg-[#eef3fb] px-1 py-0.5 text-xs">
            https://sandbox.payfast.co.za/eng/process
          </code>
          .
        </p>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex gap-3">
            <dt className="w-36 shrink-0 font-medium text-[#244367]">Sandbox Merchant ID</dt>
            <dd className="font-mono text-[#5d7497]">10000100</dd>
          </div>
          <div className="flex gap-3">
            <dt className="w-36 shrink-0 font-medium text-[#244367]">Sandbox Merchant Key</dt>
            <dd className="font-mono text-[#5d7497]">46f0cd694581a</dd>
          </div>
        </dl>
      </aside>
    </main>
  );
}
