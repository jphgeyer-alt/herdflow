"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

const PACKAGES = [
  { id: "starter", name: "STARTER", price: "R2,500 / month" },
  { id: "growth", name: "GROWTH", price: "R5,500 / month" },
  { id: "premium", name: "PREMIUM", price: "R12,000 / month" },
  { id: "enterprise", name: "ENTERPRISE", price: "Custom pricing" },
];

const BUSINESS_TYPES = [
  "Feed and Supplement Supplier",
  "Veterinary Products",
  "Farm Equipment and Machinery",
  "Financial Services and Insurance",
  "Transport and Logistics",
  "Agricultural Technology",
  "Retail and General Trade",
  "Other Agricultural Business",
];

const PROVINCES = [
  "All Provinces",
  "Gauteng",
  "North West",
  "Limpopo",
  "Northern Cape",
  "Free State",
  "KwaZulu-Natal",
  "Eastern Cape",
  "Western Cape",
  "Mpumalanga",
];

const MARKETING_GOALS = ["Brand Awareness", "Lead Generation", "Direct Sales", "Event Promotion"];

type FormData = {
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  website: string;
  businessType: string;
  package: string;
  targetProvinces: string[];
  marketingGoal: string;
  brief: string;
  logoUrl: string;
  agreeTerms: boolean;
};

const EMPTY_FORM: FormData = {
  companyName: "",
  contactPerson: "",
  email: "",
  phone: "+27 ",
  website: "",
  businessType: "",
  package: "",
  targetProvinces: [],
  marketingGoal: "",
  brief: "",
  logoUrl: "",
  agreeTerms: false,
};

export default function MarketingRegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-[#5d7497]">Loading…</div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}

function RegisterForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>({ ...EMPTY_FORM });
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Pre-select package from URL
  useEffect(() => {
    const pkg = searchParams.get("package");
    if (pkg) setForm((f) => ({ ...f, package: pkg }));
  }, [searchParams]);

  function set(field: keyof FormData, value: unknown) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: "" }));
  }

  function toggleProvince(p: string) {
    setForm((f) => ({
      ...f,
      targetProvinces: f.targetProvinces.includes(p)
        ? f.targetProvinces.filter((x) => x !== p)
        : [...f.targetProvinces, p],
    }));
    setErrors((e) => ({ ...e, targetProvinces: "" }));
  }

  function validateStep(s: number): boolean {
    const errs: Partial<Record<keyof FormData, string>> = {};
    if (s === 1) {
      if (!form.companyName.trim()) errs.companyName = "Company name is required";
      if (!form.contactPerson.trim()) errs.contactPerson = "Contact person is required";
      if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email))
        errs.email = "Valid email is required";
      if (!form.phone.trim() || form.phone.length < 10) errs.phone = "Valid phone is required";
      if (!form.businessType) errs.businessType = "Business type is required";
    }
    if (s === 2) {
      if (!form.package) errs.package = "Please select a package";
    }
    if (s === 3) {
      if (!form.brief.trim()) errs.brief = "Please describe your products or services";
      if (form.targetProvinces.length === 0) errs.targetProvinces = "Select at least one province";
      if (!form.marketingGoal) errs.marketingGoal = "Select a marketing goal";
    }
    if (s === 4) {
      if (!form.agreeTerms) errs.agreeTerms = "You must agree to the terms";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function next() {
    if (validateStep(step)) setStep((s) => s + 1);
  }

  async function submit() {
    if (!validateStep(4)) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch("/api/marketing/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error || "Submission failed. Please try again.");
        return;
      }
      router.push("/marketing/thank-you");
    } catch {
      setSubmitError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const stepLabels = ["Business Details", "Package", "Marketing Brief", "Confirmation"];

  return (
    <div className="min-h-screen bg-[#f5f4ef] py-12">
      <div className="mx-auto max-w-2xl px-4 sm:px-6">
        {/* Header */}
        <div className="mb-8 text-center">
          <Link href="/marketing" className="text-sm text-[#2E7D32] hover:underline">
            ← Back to Marketing
          </Link>
          <h1 className="mt-4 text-3xl font-black uppercase text-[#1B3A6B]">Become a Sponsor</h1>
          <p className="mt-2 text-sm text-[#5d7497]">Complete your application in 4 simple steps</p>
        </div>

        {/* Progress */}
        <div className="mb-8 flex items-center justify-between px-2">
          {stepLabels.map((label, i) => (
            <div key={label} className="flex flex-1 flex-col items-center">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-bold transition ${
                  step > i + 1
                    ? "border-[#2E7D32] bg-[#2E7D32] text-white"
                    : step === i + 1
                      ? "border-[#1B3A6B] bg-[#1B3A6B] text-white"
                      : "border-[#cdd8e7] bg-white text-[#9aabb9]"
                }`}
              >
                {step > i + 1 ? "✓" : i + 1}
              </div>
              <span className="mt-1 hidden text-center text-[10px] text-[#5d7497] sm:block">
                {label}
              </span>
              {i < stepLabels.length - 1 && <div className="hidden" />}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-[#e4ebf5] bg-white p-6 shadow-lg sm:p-8">
          {/* STEP 1 */}
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold text-[#1B3A6B]">Business Details</h2>
              {[
                {
                  field: "companyName" as const,
                  label: "Company Name *",
                  placeholder: "Agri Feeds SA (Pty) Ltd",
                },
                {
                  field: "contactPerson" as const,
                  label: "Contact Person *",
                  placeholder: "Full name",
                },
                {
                  field: "email" as const,
                  label: "Email Address *",
                  placeholder: "info@company.co.za",
                },
                {
                  field: "phone" as const,
                  label: "Phone Number *",
                  placeholder: "+27 82 000 0000",
                },
                {
                  field: "website" as const,
                  label: "Company Website (optional)",
                  placeholder: "https://www.yourcompany.co.za",
                },
              ].map(({ field, label, placeholder }) => (
                <div key={field}>
                  <label className="mb-1 block text-sm font-semibold text-[#244367]">{label}</label>
                  <input
                    type={field === "email" ? "email" : "text"}
                    value={form[field] as string}
                    onChange={(e) => set(field, e.target.value)}
                    placeholder={placeholder}
                    className={`w-full rounded-lg border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30 ${errors[field] ? "border-red-400" : "border-[#cdd8e7]"}`}
                  />
                  {errors[field] && <p className="mt-1 text-xs text-red-600">{errors[field]}</p>}
                </div>
              ))}
              <div>
                <label className="mb-1 block text-sm font-semibold text-[#244367]">
                  Business Type *
                </label>
                <select
                  value={form.businessType}
                  onChange={(e) => set("businessType", e.target.value)}
                  className={`w-full rounded-lg border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30 ${errors.businessType ? "border-red-400" : "border-[#cdd8e7]"}`}
                >
                  <option value="">Select business type…</option>
                  {BUSINESS_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                {errors.businessType && (
                  <p className="mt-1 text-xs text-red-600">{errors.businessType}</p>
                )}
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold text-[#1B3A6B]">Select Your Package</h2>
              {errors.package && <p className="text-xs text-red-600">{errors.package}</p>}
              <div className="space-y-3">
                {PACKAGES.map((pkg) => (
                  <label
                    key={pkg.id}
                    className={`flex cursor-pointer items-center gap-4 rounded-xl border-2 p-4 transition ${
                      form.package === pkg.id
                        ? "border-[#2E7D32] bg-[#f0faf0]"
                        : "border-[#e4ebf5] hover:border-[#cdd8e7]"
                    }`}
                  >
                    <input
                      type="radio"
                      name="package"
                      value={pkg.id}
                      checked={form.package === pkg.id}
                      onChange={() => set("package", pkg.id)}
                      className="accent-[#2E7D32]"
                    />
                    <div className="flex-1">
                      <p className="font-bold text-[#1B3A6B]">{pkg.name}</p>
                      <p className="text-sm text-[#5d7497]">{pkg.price}</p>
                    </div>
                    {form.package === pkg.id && (
                      <span className="text-lg font-bold text-[#2E7D32]">✓</span>
                    )}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold text-[#1B3A6B]">Marketing Brief</h2>
              <div>
                <label className="mb-1 block text-sm font-semibold text-[#244367]">
                  Products / Services *
                </label>
                <textarea
                  rows={3}
                  value={form.brief}
                  onChange={(e) => set("brief", e.target.value)}
                  placeholder="Describe your products or services and what you want farmers to know…"
                  className={`w-full rounded-lg border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30 ${errors.brief ? "border-red-400" : "border-[#cdd8e7]"}`}
                />
                {errors.brief && <p className="mt-1 text-xs text-red-600">{errors.brief}</p>}
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#244367]">
                  Target Provinces *
                </label>
                {errors.targetProvinces && (
                  <p className="mb-1 text-xs text-red-600">{errors.targetProvinces}</p>
                )}
                <div className="grid grid-cols-2 gap-2">
                  {PROVINCES.map((p) => (
                    <label key={p} className="flex cursor-pointer items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={form.targetProvinces.includes(p)}
                        onChange={() => toggleProvince(p)}
                        className="accent-[#2E7D32]"
                      />
                      {p}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-[#244367]">
                  Marketing Goal *
                </label>
                <select
                  value={form.marketingGoal}
                  onChange={(e) => set("marketingGoal", e.target.value)}
                  className={`w-full rounded-lg border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30 ${errors.marketingGoal ? "border-red-400" : "border-[#cdd8e7]"}`}
                >
                  <option value="">Select goal…</option>
                  {MARKETING_GOALS.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
                {errors.marketingGoal && (
                  <p className="mt-1 text-xs text-red-600">{errors.marketingGoal}</p>
                )}
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-[#244367]">
                  Logo URL (optional)
                </label>
                <input
                  type="url"
                  value={form.logoUrl}
                  onChange={(e) => set("logoUrl", e.target.value)}
                  placeholder="https://your-cdn.com/logo.png"
                  className="w-full rounded-lg border border-[#cdd8e7] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30"
                />
                <p className="mt-1 text-xs text-[#9aabb9]">
                  Paste a public URL to your logo (PNG, JPG, SVG)
                </p>
              </div>
            </div>
          )}

          {/* STEP 4 */}
          {step === 4 && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold text-[#1B3A6B]">Confirm Your Application</h2>
              <div className="space-y-3 rounded-xl bg-[#f5f8fd] p-5 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#5d7497]">Company</span>
                  <span className="font-semibold text-[#1B3A6B]">{form.companyName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5d7497]">Contact</span>
                  <span className="font-semibold text-[#1B3A6B]">{form.contactPerson}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5d7497]">Email</span>
                  <span className="font-semibold text-[#1B3A6B]">{form.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5d7497]">Package</span>
                  <span className="font-semibold uppercase text-[#2E7D32]">{form.package}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5d7497]">Monthly Investment</span>
                  <span className="font-bold text-[#1B3A6B]">
                    {PACKAGES.find((p) => p.id === form.package)?.price}
                  </span>
                </div>
              </div>
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={form.agreeTerms}
                  onChange={(e) => set("agreeTerms", e.target.checked)}
                  className="mt-0.5 accent-[#2E7D32]"
                />
                <span className="text-sm text-[#5d7497]">
                  I agree to the{" "}
                  <Link href="/terms" className="text-[#2E7D32] hover:underline">
                    HerdFlow marketing terms and conditions
                  </Link>
                </span>
              </label>
              {errors.agreeTerms && <p className="text-xs text-red-600">{errors.agreeTerms}</p>}
              {submitError && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {submitError}
                </div>
              )}
            </div>
          )}

          {/* Navigation buttons */}
          <div className="mt-8 flex justify-between border-t border-[#e4ebf5] pt-6">
            {step > 1 ? (
              <button
                onClick={() => setStep((s) => s - 1)}
                className="rounded-lg border border-[#cdd8e7] px-6 py-2.5 text-sm font-semibold text-[#5d7497] transition hover:border-[#1B3A6B]"
              >
                ← Back
              </button>
            ) : (
              <Link
                href="/marketing"
                className="rounded-lg border border-[#cdd8e7] px-6 py-2.5 text-sm font-semibold text-[#5d7497] transition hover:border-[#1B3A6B]"
              >
                ← Back
              </Link>
            )}
            {step < 4 ? (
              <button
                onClick={next}
                className="rounded-lg bg-[#1B3A6B] px-8 py-2.5 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-[#122844]"
              >
                Continue →
              </button>
            ) : (
              <button
                onClick={submit}
                disabled={submitting}
                className="rounded-lg bg-[#2E7D32] px-8 py-2.5 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-[#1d5e20] disabled:opacity-60"
              >
                {submitting ? "Submitting…" : "Submit Application"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
