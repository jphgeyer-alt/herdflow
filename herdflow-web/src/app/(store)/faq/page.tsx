import Link from "next/link";
import { getTranslations } from "next-intl/server";

function Question({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-[#e4ebf5] pb-6 last:border-0 last:pb-0">
      <h3 className="mb-2 text-lg font-bold text-[#1B3A6B]">{q}</h3>
      <div className="text-[#5d7497]">{children}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-5 text-xl font-black text-[#1B3A6B]">{title}</h2>
      <div className="space-y-6">{children}</div>
    </section>
  );
}

export default async function FAQPage() {
  const t = await getTranslations("marketing");
  const rich = {
    strong: (chunks: React.ReactNode) => <strong>{chunks}</strong>,
    pricingLink: (chunks: React.ReactNode) => (
      <Link href="/pricing" className="font-semibold text-[#2E7D32] hover:underline">
        {chunks}
      </Link>
    ),
    privacyLink: (chunks: React.ReactNode) => (
      <Link href="/privacy" className="font-semibold text-[#2E7D32] hover:underline">
        {chunks}
      </Link>
    ),
    supportEmail: (chunks: React.ReactNode) => (
      <a href="mailto:support@herdflow.co.za" className="font-semibold text-[#2E7D32] hover:underline">
        {chunks}
      </a>
    ),
  };

  return (
    <div className="min-h-screen bg-[#f5f4ef]">
      <div className="bg-[#1B3A6B] px-4 py-12 text-white md:px-8">
        <div className="mx-auto max-w-4xl">
          <h1 className="mb-2 text-4xl font-black">{t("faq_page_title")}</h1>
          <p className="text-white/80">{t("legal_last_updated")}</p>
        </div>
      </div>
      <div className="mx-auto max-w-4xl px-4 py-12 md:px-8">
        <div className="space-y-12 rounded-2xl border border-[#e4ebf5] bg-white p-10 leading-relaxed shadow-lg">
          <Section title={t("section_getting_started")}>
            <Question q={t("q_what_is_herdflow")}>
              <p>{t("a_what_is_herdflow")}</p>
            </Question>
            <Question q={t("q_offline")}>
              <p>{t("a_offline")}</p>
            </Question>
            <Question q={t("q_multiple_users")}>
              <p>{t("a_multiple_users")}</p>
            </Question>
          </Section>

          <Section title={t("section_ai_features")}>
            <Question q={t("q_ai_features")}>
              <p>{t("a_ai_features")}</p>
            </Question>
            <Question q={t("q_diagnosis")}>
              <p>{t.rich("a_diagnosis", rich)}</p>
            </Question>
            <Question q={t("q_photos_stored")}>
              <p>{t("a_photos_stored")}</p>
            </Question>
          </Section>

          <Section title={t("section_weather_pasture")}>
            <Question q={t("q_weather_source")}>
              <p>{t("a_weather_source")}</p>
            </Question>
            <Question q={t("q_ndvi")}>
              <p>{t("a_ndvi")}</p>
            </Question>
          </Section>

          <Section title={t("section_traceability")}>
            <Question q={t("q_traceability")}>
              <p>{t("a_traceability")}</p>
            </Question>
          </Section>

          <Section title={t("section_subscriptions")}>
            <Question q={t("q_billing")}>
              <p>{t.rich("a_billing", rich)}</p>
            </Question>
          </Section>

          <Section title={t("section_privacy_data")}>
            <Question q={t("q_who_sees_data")}>
              <p>{t.rich("a_who_sees_data", rich)}</p>
            </Question>
          </Section>

          <Section title={t("section_still_need_help")}>
            <Question q={t("q_contact_support")}>
              <p>{t.rich("a_contact_support", rich)}</p>
            </Question>
          </Section>

          <div className="border-t border-[#e4ebf5] pt-4">
            <Link href="/" className="font-semibold text-[#2E7D32] hover:underline">
              {t("back_to_home")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
