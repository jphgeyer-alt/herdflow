"use client";

import { useState, FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Send } from "lucide-react";

export function ContactForm() {
  const t = useTranslations("marketing");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, phone, subject, message }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
        setFullName("");
        setEmail("");
        setPhone("");
        setSubject("");
        setMessage("");
      } else {
        setError(data.error || t("failed_to_send_message"));
      }
    } catch {
      setError(t("network_error_retry"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-[#e4ebf5] bg-white p-8 shadow-xl">
      <h2 className="mb-6 text-2xl font-black text-[#1B3A6B]">{t("send_message_title")}</h2>

      {success && (
        <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          {t("message_sent_success")}
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="mb-2 block text-sm font-semibold text-[#244367]">
            {t("full_name_label")}
          </label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            className="w-full rounded-lg border border-[#cdd8e7] px-4 py-3 focus:border-[#1B3A6B] focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/20"
            placeholder={t("full_name_placeholder")}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-[#244367]">
            {t("email_address_label")}
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-lg border border-[#cdd8e7] px-4 py-3 focus:border-[#1B3A6B] focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/20"
            placeholder={t("email_placeholder")}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-[#244367]">
            {t("phone_optional_label")}
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-lg border border-[#cdd8e7] px-4 py-3 focus:border-[#1B3A6B] focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/20"
            placeholder={t("phone_placeholder")}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-[#244367]">{t("subject_label")}</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
            className="w-full rounded-lg border border-[#cdd8e7] px-4 py-3 focus:border-[#1B3A6B] focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/20"
            placeholder={t("subject_placeholder")}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-[#244367]">{t("message_label")}</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            rows={6}
            className="w-full resize-none rounded-lg border border-[#cdd8e7] px-4 py-3 focus:border-[#1B3A6B] focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/20"
            placeholder={t("message_placeholder")}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#2E7D32] py-4 font-bold uppercase tracking-wide text-white shadow-lg transition hover:bg-[#1d5e20] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            t("sending_ellipsis")
          ) : (
            <>
              <Send size={20} />
              {t("send_message_button")}
            </>
          )}
        </button>
      </form>
    </div>
  );
}
