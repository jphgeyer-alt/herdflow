import Link from "next/link";
import { ContactInquiryForm } from "./contact-inquiry-form";

const contactChannels = [
  {
    title: "Sales Email",
    detail: "sales@herdflow.co.za",
    href: "mailto:sales@herdflow.co.za",
    note: "For product enquiries, pricing, and seller onboarding support.",
  },
  {
    title: "Phone / WhatsApp",
    detail: "+27 87 100 4550",
    href: "tel:+27871004550",
    note: "For urgent order or delivery coordination during business hours.",
  },
  {
    title: "Office Hours",
    detail: "Mon-Fri, 08:00 - 17:00 SAST",
    href: "",
    note: "Support requests are reviewed and routed by the HerdFlow team.",
  },
];

export default function AboutPage() {
  return (
    <main className="space-y-6 pb-10">
      <nav className="text-sm text-[#38537a]">
        <Link className="font-semibold text-brand-navy" href="/">
          Back to Home
        </Link>
      </nav>

      <section className="rounded-2xl bg-gradient-to-r from-brand-navy to-[#254f8e] p-6 text-white shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#d9c08f]">Geyer Holdings</p>
        <h1 className="mt-3 text-3xl font-semibold leading-tight sm:text-4xl">About HerdFlow</h1>
        <p className="mt-3 max-w-2xl text-sm text-[#ecf1f8] sm:text-base">
          HerdFlow is the public commerce platform for livestock and farm trade. The storefront helps buyers discover trusted suppliers,
          place product orders, and connect with verified regional partners.
        </p>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <div className="space-y-4 rounded-xl border border-[#d8e0ec] bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold text-brand-navy">What We Do</h2>
          <p className="text-sm text-[#38537a]">
            HerdFlow combines ecommerce-ready product sales, livestock listing discovery, and onboarding for sellers and logistics partners.
            The platform is designed for practical field operations while staying simple enough for mobile-first rural connectivity.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <article className="rounded-lg bg-[#eef3fb] p-3">
              <h3 className="text-sm font-semibold text-brand-navy">Storefront Trade</h3>
              <p className="mt-1 text-sm text-[#38537a]">Browse products and livestock listings with clear regional and seller context.</p>
            </article>
            <article className="rounded-lg bg-[#f8f4ea] p-3">
              <h3 className="text-sm font-semibold text-brand-navy">Trusted Onboarding</h3>
              <p className="mt-1 text-sm text-[#38537a]">Seller and logistics registrations are captured for verification before activation.</p>
            </article>
            <article className="rounded-lg bg-[#eef3fb] p-3">
              <h3 className="text-sm font-semibold text-brand-navy">Payments and Checkout</h3>
              <p className="mt-1 text-sm text-[#38537a]">Product purchases flow through secure PayFast payment initialization.</p>
            </article>
            <article className="rounded-lg bg-[#f8f4ea] p-3">
              <h3 className="text-sm font-semibold text-brand-navy">Regional Fulfilment</h3>
              <p className="mt-1 text-sm text-[#38537a]">Logistics partners can align transport routes for delivery readiness.</p>
            </article>
          </div>
        </div>

        <aside className="space-y-3 rounded-xl border border-[#d8e0ec] bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-brand-navy">Contact Details</h2>
          {contactChannels.map((channel) => (
            <article key={channel.title} className="rounded-lg border border-[#e4ebf5] p-3 text-sm">
              <p className="font-semibold text-brand-navy">{channel.title}</p>
              {channel.href ? (
                <a className="text-[#244367] underline" href={channel.href}>
                  {channel.detail}
                </a>
              ) : (
                <p className="text-[#244367]">{channel.detail}</p>
              )}
              <p className="mt-1 text-[#5d7497]">{channel.note}</p>
            </article>
          ))}
        </aside>
      </section>

      <section className="rounded-xl border border-[#d8e0ec] bg-white p-5 shadow-sm">
        <h2 className="text-xl font-semibold text-brand-navy">Send Us a Message</h2>
        <p className="mt-2 text-sm text-[#38537a]">Use this contact form for general enquiries, partnerships, or account support.</p>
        <div className="mt-4 max-w-2xl">
          <ContactInquiryForm />
        </div>
      </section>
    </main>
  );
}
