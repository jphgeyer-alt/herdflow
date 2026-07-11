"use client";

import { useState } from "react";
import { Check } from "lucide-react";

type Plan = {
  key: string;
  displayName: string;
  monthlyPrice: string;
  annualPrice: string;
  maxAnimals: number | null;
  maxUsers: number | null;
  maxFarms: number;
  features: string[];
  isPopular: boolean;
};

export function PricingClient({ plans }: { plans: Plan[] }) {
  const [annual, setAnnual] = useState(false);
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [error, setError] = useState("");

  function submitToPayFast(processUrl: string, fields: Record<string, string>) {
    const form = document.createElement("form");
    form.method = "POST";
    form.action = processUrl;
    for (const [name, value] of Object.entries(fields)) {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = name;
      input.value = value;
      form.appendChild(input);
    }
    document.body.appendChild(form);
    form.submit();
  }

  async function choosePlan(planKey: string) {
    setError("");
    setLoadingKey(planKey);
    try {
      const res = await fetch("/api/subscriptions/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planKey, billingCycle: annual ? "ANNUAL" : "MONTHLY" }),
      });
      const data = await res.json();
      if (res.status === 401) {
        window.location.href = "/auth/login?next=/pricing";
        return;
      }
      if (res.ok && data.payment) {
        submitToPayFast(data.payment.processUrl, data.payment.fields);
      } else if (res.ok) {
        window.location.href = "/dashboard/seller";
      } else {
        setError(data.error || "Failed to start subscription.");
        setLoadingKey(null);
      }
    } catch {
      setError("Network error. Please try again.");
      setLoadingKey(null);
    }
  }

  return (
    <div>
      {/* Toggle */}
      <div className="mb-10 flex items-center justify-center gap-4">
        <span className={`text-sm font-semibold ${!annual ? "text-[#1B3A6B]" : "text-[#9aabb9]"}`}>
          Monthly
        </span>
        <button
          onClick={() => setAnnual((a) => !a)}
          className="relative h-8 w-16 rounded-full bg-[#1B3A6B] transition"
          aria-label="Toggle billing cycle"
        >
          <span
            className={`absolute top-1 h-6 w-6 rounded-full bg-white transition-transform ${
              annual ? "translate-x-9" : "translate-x-1"
            }`}
          />
        </button>
        <span className={`text-sm font-semibold ${annual ? "text-[#1B3A6B]" : "text-[#9aabb9]"}`}>
          Annual
        </span>
        <span className="rounded-full bg-[#A07C3A]/15 px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#A07C3A]">
          2 months free
        </span>
      </div>

      {error && (
        <div className="mx-auto mb-8 max-w-2xl rounded-lg border border-red-200 bg-red-50 p-4 text-center text-sm text-red-800">
          {error}
        </div>
      )}

      {/* Plan cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
        {plans.map((plan) => {
          const price = annual ? plan.annualPrice : plan.monthlyPrice;
          const priceNum = Number(price);
          return (
            <div
              key={plan.key}
              className={`relative flex flex-col rounded-2xl border-2 bg-white p-6 shadow-lg ${
                plan.isPopular ? "border-[#A07C3A]" : "border-[#e4ebf5]"
              }`}
            >
              {plan.isPopular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#A07C3A] px-3 py-1 text-xs font-black uppercase tracking-wide text-white">
                  Most Popular
                </span>
              )}
              <h3 className="mb-1 text-lg font-black text-[#1B3A6B]">{plan.displayName}</h3>
              <div className="mb-4">
                <span className="text-3xl font-black text-[#244367]">
                  {priceNum === 0 ? "Free" : `R${priceNum.toLocaleString("en-ZA")}`}
                </span>
                {priceNum > 0 && (
                  <span className="text-sm text-[#9aabb9]">/{annual ? "yr" : "mo"}</span>
                )}
              </div>
              <ul className="mb-6 flex-1 space-y-2">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-[#5d7497]">
                    <Check size={16} className="mt-0.5 shrink-0 text-[#2E7D32]" />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => choosePlan(plan.key)}
                disabled={loadingKey === plan.key}
                className={`w-full rounded-lg py-3 text-sm font-bold uppercase tracking-wide transition disabled:cursor-not-allowed disabled:opacity-50 ${
                  plan.isPopular
                    ? "bg-[#A07C3A] text-white hover:bg-[#8a6a30]"
                    : "bg-[#1B3A6B] text-white hover:bg-[#122844]"
                }`}
              >
                {loadingKey === plan.key
                  ? "Processing…"
                  : priceNum === 0
                    ? "Get Started Free"
                    : "Choose Plan"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
