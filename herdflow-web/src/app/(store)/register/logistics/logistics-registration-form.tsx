"use client";

import { useMemo, useState } from "react";

type SubmitResult = {
  applicationId: string;
  message: string;
};

export function LogisticsRegistrationForm() {
  const [companyName, setCompanyName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fleetSize, setFleetSize] = useState("");
  const [routesCovered, setRoutesCovered] = useState("");
  const [vehicleDocuments, setVehicleDocuments] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<SubmitResult | null>(null);

  const canSubmit = useMemo(() => {
    const parsedFleet = Number.parseInt(fleetSize, 10);
    return Boolean(
      companyName.trim() &&
      contactPhone.trim() &&
      contactEmail.trim() &&
      password.length >= 8 &&
      password === confirmPassword &&
      routesCovered.trim() &&
      vehicleDocuments &&
      Number.isInteger(parsedFleet) &&
      parsedFleet > 0,
    );
  }, [
    companyName,
    contactPhone,
    contactEmail,
    password,
    confirmPassword,
    fleetSize,
    routesCovered,
    vehicleDocuments,
  ]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSubmit || !vehicleDocuments) {
      if (password.length > 0 && password.length < 8) {
        setErrorMessage("Password must be at least 8 characters.");
      } else if (password !== confirmPassword) {
        setErrorMessage("Passwords do not match.");
      } else {
        setErrorMessage("Please complete all fields and upload your vehicle documents.");
      }
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setResult(null);

    const formData = new FormData();
    formData.set("companyName", companyName);
    formData.set("contactPhone", contactPhone);
    formData.set("contactEmail", contactEmail);
    formData.set("password", password);
    formData.set("fleetSize", fleetSize);
    formData.set("routesCovered", routesCovered);
    formData.set("vehicleDocuments", vehicleDocuments);

    try {
      const response = await fetch("/api/store/register/logistics", {
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
      setCompanyName("");
      setContactPhone("");
      setContactEmail("");
      setPassword("");
      setConfirmPassword("");
      setFleetSize("");
      setRoutesCovered("");
      setVehicleDocuments(null);
    } catch {
      setErrorMessage("Network error while submitting your application.");
    }

    setIsSubmitting(false);
  }

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <label className="space-y-1 text-sm text-[#244367]">
        <span>Company Name</span>
        <input
          className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2"
          onChange={(event) => setCompanyName(event.target.value)}
          required
          value={companyName}
        />
      </label>

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

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1 text-sm text-[#244367]">
          <span>Password</span>
          <input
            className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2"
            minLength={8}
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            value={password}
            autoComplete="new-password"
          />
        </label>

        <label className="space-y-1 text-sm text-[#244367]">
          <span>Confirm Password</span>
          <input
            className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2"
            minLength={8}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
            type="password"
            value={confirmPassword}
            autoComplete="new-password"
          />
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1 text-sm text-[#244367]">
          <span>Fleet Size</span>
          <input
            className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2"
            min={1}
            onChange={(event) => setFleetSize(event.target.value)}
            required
            type="number"
            value={fleetSize}
          />
        </label>

        <label className="space-y-1 text-sm text-[#244367]">
          <span>Routes Covered</span>
          <input
            className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2"
            onChange={(event) => setRoutesCovered(event.target.value)}
            placeholder="e.g. North West, Gauteng, Free State"
            required
            value={routesCovered}
          />
        </label>
      </div>

      <label className="space-y-1 text-sm text-[#244367]">
        <span>Vehicle Documents Upload (PDF/JPG/PNG, max 8MB)</span>
        <input
          accept=".pdf,.jpg,.jpeg,.png"
          className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2"
          onChange={(event) => setVehicleDocuments(event.target.files?.[0] || null)}
          required
          type="file"
        />
      </label>

      <button
        className="bg-brand-navy inline-flex w-full items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold text-white"
        disabled={!canSubmit || isSubmitting}
        type="submit"
      >
        {isSubmitting ? "Submitting Application..." : "Submit Logistics Application"}
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
