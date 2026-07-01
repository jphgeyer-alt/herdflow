"use client";

import { useState } from "react";

type CheckoutFormProps = {
  cart: string;
  totalLabel: string;
};

type CheckoutResponse = {
  processUrl: string;
  fields: Record<string, string>;
};

export function CheckoutForm({ cart, totalLabel }: CheckoutFormProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/store/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cart,
          customer: {
            firstName,
            lastName,
            email,
          },
        }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        const message = typeof errorBody.error === "string" ? errorBody.error : "Could not initialize payment.";
        setErrorMessage(message);
        setIsSubmitting(false);
        return;
      }

      const payload = (await response.json()) as CheckoutResponse;
      const form = document.createElement("form");
      form.method = "POST";
      form.action = payload.processUrl;

      Object.entries(payload.fields).forEach(([key, value]) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = key;
        input.value = value;
        form.appendChild(input);
      });

      document.body.appendChild(form);
      form.submit();
    } catch {
      setErrorMessage("Network error while starting payment.");
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1 text-sm text-[#244367]">
          <span>First Name</span>
          <input
            className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2"
            name="firstName"
            onChange={(event) => setFirstName(event.target.value)}
            required
            value={firstName}
          />
        </label>

        <label className="space-y-1 text-sm text-[#244367]">
          <span>Last Name</span>
          <input
            className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2"
            name="lastName"
            onChange={(event) => setLastName(event.target.value)}
            required
            value={lastName}
          />
        </label>
      </div>

      <label className="space-y-1 text-sm text-[#244367]">
        <span>Email</span>
        <input
          className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2"
          name="email"
          onChange={(event) => setEmail(event.target.value)}
          required
          type="email"
          value={email}
        />
      </label>

      <button
        className="inline-flex w-full items-center justify-center rounded-lg bg-brand-navy px-4 py-2 text-sm font-semibold text-white"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? "Starting Payment..." : `Pay ${totalLabel} with PayFast`}
      </button>

      {errorMessage && (
        <p aria-live="polite" className="text-sm font-semibold text-[#8b1f1f]" role="status">
          {errorMessage}
        </p>
      )}
    </form>
  );
}
