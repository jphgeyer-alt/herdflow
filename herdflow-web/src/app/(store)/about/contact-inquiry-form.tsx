"use client";

import { useState } from "react";

type ContactResponse = {
  inquiryId: string;
  message: string;
};

export function ContactInquiryForm() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<ContactResponse | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    setResult(null);

    try {
      const response = await fetch("/api/store/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName,
          email,
          phone,
          subject,
          message,
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as
        | ContactResponse
        | {
            error?: string;
          };

      if (!response.ok) {
        setErrorMessage(payload && "error" in payload && payload.error ? payload.error : "Could not send your message.");
        setIsSubmitting(false);
        return;
      }

      setResult(payload as ContactResponse);
      setFullName("");
      setEmail("");
      setPhone("");
      setSubject("");
      setMessage("");
    } catch {
      setErrorMessage("Network error while sending your message.");
    }

    setIsSubmitting(false);
  }

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1 text-sm text-[#244367]">
          <span>Full Name</span>
          <input
            className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2"
            onChange={(event) => setFullName(event.target.value)}
            required
            value={fullName}
          />
        </label>

        <label className="space-y-1 text-sm text-[#244367]">
          <span>Email</span>
          <input
            className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2"
            onChange={(event) => setEmail(event.target.value)}
            required
            type="email"
            value={email}
          />
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1 text-sm text-[#244367]">
          <span>Phone</span>
          <input
            className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2"
            onChange={(event) => setPhone(event.target.value)}
            type="tel"
            value={phone}
          />
        </label>

        <label className="space-y-1 text-sm text-[#244367]">
          <span>Subject</span>
          <input
            className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2"
            onChange={(event) => setSubject(event.target.value)}
            required
            value={subject}
          />
        </label>
      </div>

      <label className="space-y-1 text-sm text-[#244367]">
        <span>Message</span>
        <textarea
          className="min-h-28 w-full rounded-lg border border-[#cdd8e7] px-3 py-2"
          minLength={15}
          onChange={(event) => setMessage(event.target.value)}
          required
          value={message}
        />
      </label>

      <button
        className="inline-flex w-full items-center justify-center rounded-lg bg-brand-navy px-4 py-2 text-sm font-semibold text-white"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? "Sending Message..." : "Send Message"}
      </button>

      {errorMessage && (
        <p aria-live="polite" className="text-sm font-semibold text-[#8b1f1f]" role="status">
          {errorMessage}
        </p>
      )}

      {result && (
        <div aria-live="polite" className="rounded-lg bg-[#eef8f0] p-3 text-sm text-[#255638]" role="status">
          <p className="font-semibold">{result.message}</p>
          <p>Reference: {result.inquiryId}</p>
        </div>
      )}
    </form>
  );
}
