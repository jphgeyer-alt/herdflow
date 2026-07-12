"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardHeader } from "@/components/admin/Card";
import { Input } from "@/components/admin/Field";
import { Button } from "@/components/admin/Button";

type Config = {
  payfast_merchant_id: string;
  payfast_merchant_key: string;
  payfast_passphrase: string;
  commission_rate: string;
  logistics_commission_rate: string;
  vat_enabled: string;
  vat_rate: string;
};

const EMPTY: Config = {
  payfast_merchant_id: "",
  payfast_merchant_key: "",
  payfast_passphrase: "",
  commission_rate: "0.05",
  logistics_commission_rate: "0.04",
  vat_enabled: "false",
  vat_rate: "1500",
};

export default function AdminPaymentsSettingsPage() {
  const [config, setConfig] = useState<Config>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings/payments")
      .then((r) => r.json())
      .then((data) => {
        if (data.config) setConfig({ ...EMPTY, ...data.config });
      })
      .finally(() => setLoading(false));
  }, []);

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
        toast.success("Payment settings saved.");
      } else {
        toast.error((data as { error?: string }).error || "Failed to save.");
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function handle(field: keyof Config) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setConfig((prev) => ({ ...prev, [field]: e.target.value }));
  }

  function handleVatEnabled(e: React.ChangeEvent<HTMLInputElement>) {
    setConfig((prev) => ({ ...prev, vat_enabled: e.target.checked ? "true" : "false" }));
  }

  return (
    <main className="space-y-5 pb-10">
      <header>
        <h1 className="text-3xl font-semibold text-navy-600">Payment Settings</h1>
        <p className="text-sm text-navy-400">
          Configure PayFast merchant credentials. These values are stored in the database and
          override environment variables at runtime.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="max-w-xl">
        <Card>
          <CardHeader title="PayFast Credentials" />
          <div className="space-y-4 p-6">
            <Input
              label="Merchant ID"
              type="text"
              placeholder="10000100"
              value={config.payfast_merchant_id}
              onChange={handle("payfast_merchant_id")}
              disabled={loading}
              autoComplete="off"
            />

            <Input
              label="Merchant Key"
              type="text"
              placeholder="46f0cd694581a"
              value={config.payfast_merchant_key}
              onChange={handle("payfast_merchant_key")}
              disabled={loading}
              autoComplete="off"
            />

            <Input
              label="Passphrase"
              hint="Optional — leave blank if not set."
              type="password"
              placeholder="••••••••"
              value={config.payfast_passphrase}
              onChange={handle("payfast_passphrase")}
              disabled={loading}
              autoComplete="new-password"
            />
          </div>

          <div className="border-t border-navy-50 p-6">
            <h2 className="mb-4 text-base font-semibold text-navy-600">Marketplace Commission</h2>
            <div className="space-y-4">
              <Input
                label="Commission Rate"
                hint="Decimal — e.g. 0.05 = 5%. Applied to every seller sale and livestock sale."
                type="number"
                step="0.01"
                min="0"
                max="1"
                className="max-w-40"
                placeholder="0.05"
                value={config.commission_rate}
                onChange={handle("commission_rate")}
                disabled={loading}
              />

              <Input
                label="Logistics Commission Rate"
                hint="Decimal — e.g. 0.04 = 4%. Applied to delivery request transport fees."
                type="number"
                step="0.01"
                min="0"
                max="1"
                className="max-w-40"
                placeholder="0.04"
                value={config.logistics_commission_rate}
                onChange={handle("logistics_commission_rate")}
                disabled={loading}
              />
            </div>
          </div>

          <div className="border-t border-navy-50 p-6">
            <h2 className="mb-1 text-base font-semibold text-navy-600">VAT</h2>
            <p className="mb-4 text-xs text-navy-400">
              Off by default — turn on once HerdFlow is VAT-registered. Historical figures never
              change retroactively; this only affects payments and reports going forward.
            </p>
            <div className="space-y-4">
              <label className="flex items-center gap-2 text-sm font-semibold text-navy-500">
                <input
                  type="checkbox"
                  checked={config.vat_enabled === "true"}
                  onChange={handleVatEnabled}
                  disabled={loading}
                  className="h-4 w-4 rounded border-navy-100 text-navy-600 focus:ring-2 focus:ring-navy-600/15"
                />
                Track VAT
              </label>
              <Input
                label="VAT Rate (basis points)"
                hint="e.g. 1500 = 15% (current South African VAT rate)."
                type="number"
                step="1"
                min="0"
                max="10000"
                className="max-w-40"
                placeholder="1500"
                value={config.vat_rate}
                onChange={handle("vat_rate")}
                disabled={loading || config.vat_enabled !== "true"}
              />
            </div>
          </div>

          <div className="space-y-3 border-t border-navy-50 p-6">
            <div className="rounded-lg border border-navy-50 bg-navy-25 p-3 text-xs text-navy-400">
              <p className="font-semibold text-navy-400">Important</p>
              <p className="mt-1">
                For production deployments set{" "}
                <code className="rounded bg-navy-50 px-1 py-0.5">PAYFAST_MERCHANT_ID</code>,{" "}
                <code className="rounded bg-navy-50 px-1 py-0.5">PAYFAST_MERCHANT_KEY</code>, and
                optionally <code className="rounded bg-navy-50 px-1 py-0.5">PAYFAST_PASSPHRASE</code>{" "}
                as server environment variables. Values saved here take effect immediately without a
                redeploy.
              </p>
            </div>

            <Button type="submit" disabled={loading} loading={saving}>
              Save Settings
            </Button>
          </div>
        </Card>
      </form>

      <Card className="max-w-xl p-5">
        <h2 className="text-base font-semibold text-navy-600">PayFast Sandbox</h2>
        <p className="mt-2 text-sm text-navy-400">
          To test payments use PayFast sandbox credentials and set{" "}
          <code className="rounded bg-navy-25 px-1 py-0.5 text-xs">PAYFAST_PROCESS_URL</code> to{" "}
          <code className="rounded bg-navy-25 px-1 py-0.5 text-xs">
            https://sandbox.payfast.co.za/eng/process
          </code>
          .
        </p>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex gap-3">
            <dt className="w-36 shrink-0 font-medium text-navy-500">Sandbox Merchant ID</dt>
            <dd className="font-mono text-navy-400">10000100</dd>
          </div>
          <div className="flex gap-3">
            <dt className="w-36 shrink-0 font-medium text-navy-500">Sandbox Merchant Key</dt>
            <dd className="font-mono text-navy-400">46f0cd694581a</dd>
          </div>
        </dl>
      </Card>
    </main>
  );
}
