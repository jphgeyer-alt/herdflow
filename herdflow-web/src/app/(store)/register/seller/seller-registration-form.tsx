"use client";

import { useMemo, useState } from "react";

type SubmitResult = {
  applicationId: string;
  message: string;
};

export function SellerRegistrationForm() {
  const [farmName, setFarmName] = useState("");
  const [location, setLocation] = useState("");
  const [region, setRegion] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [nationalIdNumber, setNationalIdNumber] = useState("");
  const [idDocument, setIdDocument] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<SubmitResult | null>(null);

  const canSubmit = useMemo(() => {
    return Boolean(
      farmName.trim() &&
      location.trim() &&
      region.trim() &&
      contactPhone.trim() &&
      contactEmail.trim() &&
      nationalIdNumber.trim() &&
      idDocument,
    );
  }, [farmName, location, region, contactPhone, contactEmail, nationalIdNumber, idDocument]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSubmit || !idDocument) {
      setErrorMessage("Please complete all fields and upload an ID document.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setResult(null);

    const formData = new FormData();
    formData.set("farmName", farmName);
    formData.set("location", location);
    formData.set("region", region);
    formData.set("contactPhone", contactPhone);
    formData.set("contactEmail", contactEmail);
    formData.set("nationalIdNumber", nationalIdNumber);
    formData.set("idDocument", idDocument);

    try {
      const response = await fetch("/api/store/register/seller", {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json().catch(() => ({}))) as
        | SubmitResult
        | {
            error?: string;
          };

      if (!response.ok) {
        setErrorMessage(
          payload && "error" in payload && payload.error
            ? payload.error
            : "Could not submit application.",
        );
        setIsSubmitting(false);
        return;
      }

      setResult(payload as SubmitResult);
      setFarmName("");
      setLocation("");
      setRegion("");
      setContactPhone("");
      setContactEmail("");
      setNationalIdNumber("");
      setIdDocument(null);
    } catch {
      setErrorMessage("Network error while submitting your application.");
    }

    setIsSubmitting(false);
  }

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <label className="space-y-1 text-sm text-[#244367]">
        <span>Farm Name</span>
        <input
          className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2"
          onChange={(event) => setFarmName(event.target.value)}
          required
          value={farmName}
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1 text-sm text-[#244367]">
          <span>Location</span>
          <input
            className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2"
            onChange={(event) => setLocation(event.target.value)}
            required
            value={location}
          />
        </label>

        <label className="space-y-1 text-sm text-[#244367]">
          <span>Province / Region</span>
          <input
            className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2"
            onChange={(event) => setRegion(event.target.value)}
            required
            value={region}
          />
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1 text-sm text-[#244367]">
          <span>Contact Phone</span>
          <input
            className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2"
            onChange={(event) => setContactPhone(event.target.value)}
            required
            type="tel"
            value={contactPhone}
          />
        </label>

        <label className="space-y-1 text-sm text-[#244367]">
          <span>Contact Email</span>
          <input
            className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2"
            onChange={(event) => setContactEmail(event.target.value)}
            required
            type="email"
            value={contactEmail}
          />
        </label>
      </div>

      <label className="space-y-1 text-sm text-[#244367]">
        <span>National ID Number</span>
        <input
          className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2"
          minLength={6}
          onChange={(event) => setNationalIdNumber(event.target.value)}
          required
          value={nationalIdNumber}
        />
      </label>

      <label className="space-y-1 text-sm text-[#244367]">
        <span>ID Document Upload (PDF/JPG/PNG, max 5MB)</span>
        <input
          accept=".pdf,.jpg,.jpeg,.png"
          className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2"
          onChange={(event) => setIdDocument(event.target.files?.[0] || null)}
          required
          type="file"
        />
      </label>

      <button
        className="bg-brand-navy inline-flex w-full items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold text-white"
        disabled={!canSubmit || isSubmitting}
        type="submit"
      >
        {isSubmitting ? "Submitting Application..." : "Submit Seller Application"}
      </button>

      {errorMessage && (
        <p aria-live="polite" className="text-sm font-semibold text-[#8b1f1f]" role="status">
          {errorMessage}
        </p>
      )}

      {result && (
        <div
          aria-live="polite"
          className="rounded-lg bg-[#eef8f0] p-3 text-sm text-[#255638]"
          role="status"
        >
          <p className="font-semibold">{result.message}</p>
          <p>Application Reference: {result.applicationId}</p>
        </div>
      )}
    </form>
  );
}
