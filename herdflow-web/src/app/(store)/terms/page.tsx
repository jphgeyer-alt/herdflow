import Link from "next/link";
import { getTranslations } from "next-intl/server";

export default async function TermsPage() {
  const t = await getTranslations("marketing");
  const rich = {
    strong: (chunks: React.ReactNode) => <strong>{chunks}</strong>,
    supportEmail: (chunks: React.ReactNode) => (
      <a href="mailto:support@herdflow.co.za" className="font-semibold text-[#2E7D32]">
        {chunks}
      </a>
    ),
  };

  return (
    <div className="min-h-screen bg-[#f5f4ef]">
      <div className="bg-[#1B3A6B] px-4 py-12 text-white md:px-8">
        <div className="mx-auto max-w-4xl">
          <h1 className="mb-2 text-4xl font-black">{t("terms_page_title")}</h1>
          <p className="text-white/80">{t("legal_last_updated")}</p>
        </div>
      </div>
      <div className="mx-auto max-w-4xl px-4 py-12 md:px-8">
        <div className="space-y-8 rounded-2xl border border-[#e4ebf5] bg-white p-10 leading-relaxed text-[#5d7497] shadow-lg">
          <section>
            <h2 className="mb-4 text-xl font-black text-[#1B3A6B]">{t("terms_1_title")}</h2>
            <p>{t("terms_1_body")}</p>
          </section>
          <section>
            <h2 className="mb-4 text-xl font-black text-[#1B3A6B]">{t("terms_2_title")}</h2>
            <p>{t("terms_2_body")}</p>
          </section>
          <section>
            <h2 className="mb-4 text-xl font-black text-[#1B3A6B]">{t("terms_3_title")}</h2>
            <p>{t("terms_3_body")}</p>
          </section>
          <section>
            <h2 className="mb-4 text-xl font-black text-[#1B3A6B]">
              {t("terms_4_title")}
            </h2>
            <p>{t("terms_4_body")}</p>
          </section>
          <section>
            <h2 className="mb-4 text-xl font-black text-[#1B3A6B]">
              {t("terms_5_title")}
            </h2>
            <p>{t.rich("terms_5_body_p1", rich)}</p>
          </section>
          <section>
            <h2 className="mb-4 text-xl font-black text-[#1B3A6B]">
              {t("terms_6_title")}
            </h2>
            <p>{t("terms_6_body")}</p>
          </section>
          <section>
            <h2 className="mb-4 text-xl font-black text-[#1B3A6B]">{t("terms_7_title")}</h2>
            <p>{t("terms_7_body")}</p>
          </section>
          <section>
            <h2 className="mb-4 text-xl font-black text-[#1B3A6B]">{t("terms_8_title")}</h2>
            <p>{t("terms_8_body")}</p>
          </section>
          <section>
            <h2 className="mb-4 text-xl font-black text-[#1B3A6B]">{t("terms_9_title")}</h2>
            <p>{t("terms_9_body")}</p>
          </section>
          <section>
            <h2 className="mb-4 text-xl font-black text-[#1B3A6B]">{t("terms_10_title")}</h2>
            <p>{t("terms_10_body")}</p>
          </section>
          <section>
            <h2 className="mb-4 text-xl font-black text-[#1B3A6B]">{t("terms_11_title")}</h2>
            <p>{t.rich("terms_11_body", rich)}</p>
          </section>
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
