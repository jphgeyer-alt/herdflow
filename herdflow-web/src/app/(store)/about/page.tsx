import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { CheckCircle2, Users, TrendingUp, Shield, Award, Target } from "lucide-react";

export default async function AboutPage() {
  const t = await getTranslations("marketing");
  return (
    <div className="min-h-screen bg-[#f5f4ef]">
      {/* Hero Header */}
      <div className="bg-[#1B3A6B] px-4 py-16 text-white md:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.18em] text-[#A07C3A]">
            {t("about_eyebrow")}
          </p>
          <h1 className="mb-4 text-5xl font-black">{t("about_hero_title")}</h1>
          <p className="max-w-3xl text-xl leading-relaxed text-white/80">
            {t("about_hero_sub")}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl space-y-16 px-4 py-16 md:px-8">
        {/* Our Story */}
        <section className="grid items-center gap-12 md:grid-cols-2">
          <div className="space-y-6">
            <h2 className="text-3xl font-black text-[#1B3A6B]">{t("our_story_title")}</h2>
            <p className="leading-relaxed text-[#5d7497]">
              {t("our_story_p1")}
            </p>
            <p className="leading-relaxed text-[#5d7497]">
              {t("our_story_p2")}
            </p>
            <div className="flex items-center gap-4">
              <div className="rounded-xl bg-[#2E7D32] p-3">
                <CheckCircle2 size={28} className="text-white" />
              </div>
              <div>
                <p className="text-2xl font-black text-[#1B3A6B]">2024</p>
                <p className="text-sm text-[#5d7497]">
                  {t("founded_caption")}
                </p>
              </div>
            </div>
          </div>

          <div className="flex h-96 items-center justify-center rounded-2xl bg-gradient-to-br from-[#e8eef9] to-[#dce6f6]">
            <span className="text-8xl">🐄</span>
          </div>
        </section>

        {/* What We Do */}
        <section>
          <h2 className="mb-8 text-center text-3xl font-black text-[#1B3A6B]">{t("what_we_do_title")}</h2>
          <div className="grid gap-8 md:grid-cols-3">
            <div className="rounded-2xl border border-[#e4ebf5] bg-white p-8 shadow-lg transition hover:shadow-xl">
              <div className="mb-4 w-fit rounded-xl bg-blue-100 p-4">
                <Users size={32} className="text-[#1B3A6B]" />
              </div>
              <h3 className="mb-3 text-xl font-bold text-[#244367]">{t("feature_marketplace_title")}</h3>
              <p className="leading-relaxed text-[#5d7497]">
                {t("feature_marketplace_desc")}
              </p>
            </div>

            <div className="rounded-2xl border border-[#e4ebf5] bg-white p-8 shadow-lg transition hover:shadow-xl">
              <div className="mb-4 w-fit rounded-xl bg-green-100 p-4">
                <TrendingUp size={32} className="text-[#2E7D32]" />
              </div>
              <h3 className="mb-3 text-xl font-bold text-[#244367]">{t("feature_products_title")}</h3>
              <p className="leading-relaxed text-[#5d7497]">
                {t("feature_products_desc")}
              </p>
            </div>

            <div className="rounded-2xl border border-[#e4ebf5] bg-white p-8 shadow-lg transition hover:shadow-xl">
              <div className="mb-4 w-fit rounded-xl bg-yellow-100 p-4">
                <Shield size={32} className="text-[#A07C3A]" />
              </div>
              <h3 className="mb-3 text-xl font-bold text-[#244367]">{t("feature_logistics_title")}</h3>
              <p className="leading-relaxed text-[#5d7497]">
                {t("feature_logistics_desc")}
              </p>
            </div>
          </div>
        </section>

        {/* Why Choose HerdFlow */}
        <section className="rounded-2xl border border-[#e4ebf5] bg-white p-12 shadow-xl">
          <h2 className="mb-8 text-center text-3xl font-black text-[#1B3A6B]">
            {t("why_choose_title")}
          </h2>
          <div className="grid gap-8 md:grid-cols-2">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 rounded-lg bg-green-100 p-2">
                <CheckCircle2 size={24} className="text-[#2E7D32]" />
              </div>
              <div>
                <h3 className="mb-2 font-bold text-[#244367]">{t("why_verified_sellers_title")}</h3>
                <p className="text-sm text-[#5d7497]">
                  {t("why_verified_sellers_desc")}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 rounded-lg bg-green-100 p-2">
                <CheckCircle2 size={24} className="text-[#2E7D32]" />
              </div>
              <div>
                <h3 className="mb-2 font-bold text-[#244367]">{t("why_secure_payments_title")}</h3>
                <p className="text-sm text-[#5d7497]">
                  {t("why_secure_payments_desc")}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 rounded-lg bg-green-100 p-2">
                <CheckCircle2 size={24} className="text-[#2E7D32]" />
              </div>
              <div>
                <h3 className="mb-2 font-bold text-[#244367]">{t("why_regional_coverage_title")}</h3>
                <p className="text-sm text-[#5d7497]">
                  {t("why_regional_coverage_desc")}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 rounded-lg bg-green-100 p-2">
                <CheckCircle2 size={24} className="text-[#2E7D32]" />
              </div>
              <div>
                <h3 className="mb-2 font-bold text-[#244367]">{t("why_mobile_first_title")}</h3>
                <p className="text-sm text-[#5d7497]">
                  {t("why_mobile_first_desc")}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Geyer Holdings Section */}
        <section className="rounded-2xl bg-gradient-to-r from-[#1B3A6B] to-[#254f8e] p-12 text-white shadow-2xl">
          <div className="mx-auto max-w-4xl space-y-6">
            <div className="mb-4 flex items-center gap-3">
              <Award size={40} className="text-[#A07C3A]" />
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#A07C3A]">
                  {t("powered_by_label")}
                </p>
                <h2 className="text-3xl font-black">Geyer Holdings</h2>
              </div>
            </div>

            <p className="text-lg leading-relaxed text-white/90">
              {t("geyer_p1")}
            </p>

            <p className="leading-relaxed text-white/80">
              {t("geyer_p2")}
            </p>

            <div className="grid gap-6 pt-6 md:grid-cols-3">
              <div className="rounded-xl bg-white/10 p-6 backdrop-blur-sm">
                <Target size={32} className="mb-3 text-[#A07C3A]" />
                <h3 className="mb-2 font-bold">{t("our_mission_title")}</h3>
                <p className="text-sm text-white/80">
                  {t("our_mission_desc")}
                </p>
              </div>

              <div className="rounded-xl bg-white/10 p-6 backdrop-blur-sm">
                <Users size={32} className="mb-3 text-[#A07C3A]" />
                <h3 className="mb-2 font-bold">{t("our_values_title")}</h3>
                <p className="text-sm text-white/80">
                  {t("our_values_desc")}
                </p>
              </div>

              <div className="rounded-xl bg-white/10 p-6 backdrop-blur-sm">
                <TrendingUp size={32} className="mb-3 text-[#A07C3A]" />
                <h3 className="mb-2 font-bold">{t("our_vision_title")}</h3>
                <p className="text-sm text-white/80">
                  {t("our_vision_desc")}
                </p>
              </div>
            </div>

            <div className="border-t border-white/20 pt-8">
              <p className="mb-4 text-sm text-white/70">{t("learn_more_geyer")}</p>
              <div className="flex flex-wrap gap-4">
                <a
                  href="mailto:info@geyerholdings.co.za"
                  className="rounded-lg bg-white px-6 py-3 font-bold text-[#1B3A6B] transition hover:bg-white/90"
                >
                  {t("contact_geyer_button")}
                </a>
                <a
                  href="/contact"
                  className="rounded-lg bg-[#2E7D32] px-6 py-3 font-bold text-white transition hover:bg-[#1d5e20]"
                >
                  {t("get_in_touch_button")}
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="space-y-6 text-center">
          <h2 className="text-3xl font-black text-[#1B3A6B]">{t("ready_to_start_title")}</h2>
          <p className="mx-auto max-w-2xl text-[#5d7497]">
            {t("ready_to_start_sub")}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/auth/register"
              className="rounded-lg bg-[#2E7D32] px-8 py-4 font-bold uppercase tracking-wide text-white shadow-lg transition hover:bg-[#1d5e20]"
            >
              {t("create_account_button")}
            </Link>
            <Link
              href="/shop"
              className="rounded-lg border-2 border-[#1B3A6B] px-8 py-4 font-bold uppercase tracking-wide text-[#1B3A6B] transition hover:bg-[#1B3A6B] hover:text-white"
            >
              {t("browse_products_button")}
            </Link>
          </div>
        </section>

        {/* Facebook CTA */}
        <section className="mt-4 border-t border-[#e4ebf5] py-12 text-center">
          <p className="mb-2 text-lg text-[#5d7497]">{t("stay_connected")}</p>
          <p className="mb-6 text-sm text-[#9aabb9]">
            {t("follow_us_sub")}
          </p>
          <a
            href="https://www.facebook.com/share/1cUWCfQwut/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 rounded-lg bg-[#1877F2] px-8 py-4 text-lg font-semibold text-white shadow-lg transition-colors duration-200 hover:bg-[#1565D8] hover:shadow-xl"
          >
            <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            {t("follow_facebook_button")}
          </a>
        </section>
      </div>
    </div>
  );
}
