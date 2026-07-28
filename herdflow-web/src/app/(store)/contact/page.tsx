import { getTranslations } from "next-intl/server";
import { Mail, Phone, MapPin } from "lucide-react";
import { ContactForm } from "./contact-form";

export default async function ContactPage() {
  const t = await getTranslations("marketing");

  return (
    <div className="min-h-screen bg-[#f5f4ef]">
      {/* Hero Header */}
      <div className="bg-[#1B3A6B] px-4 py-12 text-white md:px-8">
        <div className="mx-auto max-w-7xl">
          <h1 className="mb-2 text-4xl font-black">{t("contact_hero_title")}</h1>
          <p className="text-lg text-white/80">{t("contact_hero_sub")}</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-8">
        <div className="grid gap-12 md:grid-cols-2">
          {/* Contact Info */}
          <div className="space-y-8">
            <div>
              <h2 className="mb-6 text-2xl font-black text-[#1B3A6B]">{t("get_in_touch_title")}</h2>
              <p className="leading-relaxed text-[#5d7497]">
                {t("get_in_touch_desc")}
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="rounded-xl bg-[#2E7D32] p-3">
                  <Mail size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="mb-1 font-bold text-[#244367]">{t("email_label")}</h3>
                  <p className="text-[#5d7497]">info@herdflow.co.za</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="rounded-xl bg-[#2E7D32] p-3">
                  <Phone size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="mb-1 font-bold text-[#244367]">{t("phone_label")}</h3>
                  <p className="text-[#5d7497]">+27 60 522 6267</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="rounded-xl bg-[#2E7D32] p-3">
                  <MapPin size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="mb-1 font-bold text-[#244367]">{t("address_label")}</h3>
                  <p className="text-[#5d7497]">
                    Geyer Holdings
                    <br />
                    North West Province
                    <br />
                    South Africa
                  </p>
                </div>
              </div>

              {/* Facebook */}
              <div className="flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4">
                <svg
                  className="h-8 w-8 flex-shrink-0 text-[#1877F2]"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                <div>
                  <p className="text-sm font-semibold text-[#244367]">
                    {t("follow_facebook_label")}
                  </p>
                  <a
                    href="https://www.facebook.com/share/1cUWCfQwut/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-[#1877F2] hover:underline"
                  >
                    {t("follow_facebook_link_text")}
                  </a>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[#e4ebf5] bg-white p-6 shadow-lg">
              <h3 className="mb-3 font-bold text-[#244367]">{t("business_hours_title")}</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#5d7497]">{t("weekday_label")}</span>
                  <span className="font-semibold text-[#244367]">{t("weekday_hours")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5d7497]">{t("saturday_label")}</span>
                  <span className="font-semibold text-[#244367]">{t("saturday_hours")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5d7497]">{t("sunday_label")}</span>
                  <span className="font-semibold text-[#244367]">{t("closed_label")}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <ContactForm />
        </div>
      </div>
    </div>
  );
}
