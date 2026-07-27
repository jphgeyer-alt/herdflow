import Link from "next/link";
import { getTranslations } from "next-intl/server";

export default async function PrivacyPage() {
  const t = await getTranslations("marketing");
  const rich = {
    privacyEmail: (chunks: React.ReactNode) => (
      <a href="mailto:privacy@herdflow.co.za" className="font-semibold text-[#2E7D32]">
        {chunks}
      </a>
    ),
  };

  return (
    <div className="min-h-screen bg-[#f5f4ef]">
      <div className="bg-[#1B3A6B] px-4 py-12 text-white md:px-8">
        <div className="mx-auto max-w-4xl">
          <h1 className="mb-2 text-4xl font-black">{t("privacy_page_title")}</h1>
          <p className="text-white/80">{t("legal_last_updated")}</p>
        </div>
      </div>
      <div className="mx-auto max-w-4xl px-4 py-12 md:px-8">
        <div className="space-y-8 rounded-2xl border border-[#e4ebf5] bg-white p-10 leading-relaxed text-[#5d7497] shadow-lg">
          <section>
            <h2 className="mb-4 text-xl font-black text-[#1B3A6B]">{t("privacy_1_title")}</h2>
            <p>{t("privacy_1_body_p1")}</p>
            <p className="mt-3">{t("privacy_1_body_p2")}</p>
          </section>
          <section>
            <h2 className="mb-4 text-xl font-black text-[#1B3A6B]">
              {t("privacy_2_title")}
            </h2>
            <p>{t("privacy_2_body")}</p>
          </section>
          <section>
            <h2 className="mb-4 text-xl font-black text-[#1B3A6B]">{t("privacy_3_title")}</h2>
            <p>{t("privacy_3_body")}</p>
          </section>
          <section>
            <h2 className="mb-4 text-xl font-black text-[#1B3A6B]">{t("privacy_4_title")}</h2>
            <p>{t("privacy_4_body")}</p>
          </section>
          <section>
            <h2 className="mb-4 text-xl font-black text-[#1B3A6B]">{t("privacy_5_title")}</h2>
            <p>{t("privacy_5_body")}</p>
          </section>
          <section>
            <h2 className="mb-4 text-xl font-black text-[#1B3A6B]">{t("privacy_6_title")}</h2>
            <p>{t.rich("privacy_6_body", rich)}</p>
          </section>
          <section>
            <h2 className="mb-4 text-xl font-black text-[#1B3A6B]">{t("privacy_7_title")}</h2>
            <p>{t("privacy_7_body")}</p>
          </section>
          <section>
            <h2 className="mb-4 text-xl font-black text-[#1B3A6B]">{t("privacy_8_title")}</h2>
            <p>{t.rich("privacy_8_body", rich)}</p>
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
