import Link from "next/link";
import { CheckCircle2, Users, TrendingUp, Shield, Award, Target } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#f5f4ef]">
      {/* Hero Header */}
      <div className="bg-[#1B3A6B] px-4 py-16 text-white md:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.18em] text-[#A07C3A]">
            About HerdFlow
          </p>
          <h1 className="mb-4 text-5xl font-black">Connecting South African Agriculture</h1>
          <p className="max-w-3xl text-xl leading-relaxed text-white/80">
            HerdFlow is the all-in-one digital marketplace for livestock trade, agricultural
            products, and logistics coordination across South Africa.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl space-y-16 px-4 py-16 md:px-8">
        {/* Our Story */}
        <section className="grid items-center gap-12 md:grid-cols-2">
          <div className="space-y-6">
            <h2 className="text-3xl font-black text-[#1B3A6B]">Our Story</h2>
            <p className="leading-relaxed text-[#5d7497]">
              HerdFlow was born from a simple observation: South African farmers needed a modern,
              trusted platform to buy and sell livestock and agricultural products. Traditional
              methods were inefficient, lacked transparency, and created unnecessary friction in
              agricultural trade.
            </p>
            <p className="leading-relaxed text-[#5d7497]">
              We set out to build a platform that puts farmers first—combining the convenience of
              ecommerce with the trust and relationships that agricultural communities depend on.
              Today, HerdFlow connects buyers, sellers, and logistics partners across all provinces,
              making agricultural trade faster, safer, and more profitable for everyone.
            </p>
            <div className="flex items-center gap-4">
              <div className="rounded-xl bg-[#2E7D32] p-3">
                <CheckCircle2 size={28} className="text-white" />
              </div>
              <div>
                <p className="text-2xl font-black text-[#1B3A6B]">2024</p>
                <p className="text-sm text-[#5d7497]">
                  Founded with a mission to modernize agriculture
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
          <h2 className="mb-8 text-center text-3xl font-black text-[#1B3A6B]">What We Do</h2>
          <div className="grid gap-8 md:grid-cols-3">
            <div className="rounded-2xl border border-[#e4ebf5] bg-white p-8 shadow-lg transition hover:shadow-xl">
              <div className="mb-4 w-fit rounded-xl bg-blue-100 p-4">
                <Users size={32} className="text-[#1B3A6B]" />
              </div>
              <h3 className="mb-3 text-xl font-bold text-[#244367]">Livestock Marketplace</h3>
              <p className="leading-relaxed text-[#5d7497]">
                Browse verified livestock listings from trusted farmers across South Africa. Every
                listing includes detailed breed information, health records, and seller
                verification.
              </p>
            </div>

            <div className="rounded-2xl border border-[#e4ebf5] bg-white p-8 shadow-lg transition hover:shadow-xl">
              <div className="mb-4 w-fit rounded-xl bg-green-100 p-4">
                <TrendingUp size={32} className="text-[#2E7D32]" />
              </div>
              <h3 className="mb-3 text-xl font-bold text-[#244367]">Agricultural Products</h3>
              <p className="leading-relaxed text-[#5d7497]">
                Shop for farm equipment, feed, veterinary supplies, and more from verified sellers.
                Secure checkout with PayFast ensures safe transactions every time.
              </p>
            </div>

            <div className="rounded-2xl border border-[#e4ebf5] bg-white p-8 shadow-lg transition hover:shadow-xl">
              <div className="mb-4 w-fit rounded-xl bg-yellow-100 p-4">
                <Shield size={32} className="text-[#A07C3A]" />
              </div>
              <h3 className="mb-3 text-xl font-bold text-[#244367]">Logistics Network</h3>
              <p className="leading-relaxed text-[#5d7497]">
                Connect with verified logistics partners for reliable livestock and product delivery
                across all provinces. Track your shipments in real-time.
              </p>
            </div>
          </div>
        </section>

        {/* Why Choose HerdFlow */}
        <section className="rounded-2xl border border-[#e4ebf5] bg-white p-12 shadow-xl">
          <h2 className="mb-8 text-center text-3xl font-black text-[#1B3A6B]">
            Why Choose HerdFlow
          </h2>
          <div className="grid gap-8 md:grid-cols-2">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 rounded-lg bg-green-100 p-2">
                <CheckCircle2 size={24} className="text-[#2E7D32]" />
              </div>
              <div>
                <h3 className="mb-2 font-bold text-[#244367]">Verified Sellers</h3>
                <p className="text-sm text-[#5d7497]">
                  Every seller goes through identity verification and farm documentation before
                  approval.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 rounded-lg bg-green-100 p-2">
                <CheckCircle2 size={24} className="text-[#2E7D32]" />
              </div>
              <div>
                <h3 className="mb-2 font-bold text-[#244367]">Secure Payments</h3>
                <p className="text-sm text-[#5d7497]">
                  All transactions processed through PayFast for maximum security and buyer
                  protection.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 rounded-lg bg-green-100 p-2">
                <CheckCircle2 size={24} className="text-[#2E7D32]" />
              </div>
              <div>
                <h3 className="mb-2 font-bold text-[#244367]">Regional Coverage</h3>
                <p className="text-sm text-[#5d7497]">
                  Active across all nine provinces with growing logistics partner network.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 rounded-lg bg-green-100 p-2">
                <CheckCircle2 size={24} className="text-[#2E7D32]" />
              </div>
              <div>
                <h3 className="mb-2 font-bold text-[#244367]">Mobile-First Design</h3>
                <p className="text-sm text-[#5d7497]">
                  Optimized for rural connectivity and field usage—works great even on slow
                  networks.
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
                  Powered By
                </p>
                <h2 className="text-3xl font-black">Geyer Holdings</h2>
              </div>
            </div>

            <p className="text-lg leading-relaxed text-white/90">
              HerdFlow is developed and operated by Geyer Holdings, a family-owned agricultural
              investment company based in the North West Province of South Africa.
            </p>

            <p className="leading-relaxed text-white/80">
              With deep roots in South African farming communities and decades of experience in
              agricultural operations, Geyer Holdings understands the challenges facing farmers
              today. HerdFlow represents our commitment to leveraging technology to strengthen
              agricultural trade, improve market access, and support rural economic development.
            </p>

            <div className="grid gap-6 pt-6 md:grid-cols-3">
              <div className="rounded-xl bg-white/10 p-6 backdrop-blur-sm">
                <Target size={32} className="mb-3 text-[#A07C3A]" />
                <h3 className="mb-2 font-bold">Our Mission</h3>
                <p className="text-sm text-white/80">
                  Empower farmers with modern tools for transparent, efficient agricultural trade.
                </p>
              </div>

              <div className="rounded-xl bg-white/10 p-6 backdrop-blur-sm">
                <Users size={32} className="mb-3 text-[#A07C3A]" />
                <h3 className="mb-2 font-bold">Our Values</h3>
                <p className="text-sm text-white/80">
                  Trust, transparency, and community-first approach in everything we do.
                </p>
              </div>

              <div className="rounded-xl bg-white/10 p-6 backdrop-blur-sm">
                <TrendingUp size={32} className="mb-3 text-[#A07C3A]" />
                <h3 className="mb-2 font-bold">Our Vision</h3>
                <p className="text-sm text-white/80">
                  Become the leading agricultural marketplace across Southern Africa.
                </p>
              </div>
            </div>

            <div className="border-t border-white/20 pt-8">
              <p className="mb-4 text-sm text-white/70">Learn more about Geyer Holdings:</p>
              <div className="flex flex-wrap gap-4">
                <a
                  href="mailto:info@geyerholdings.co.za"
                  className="rounded-lg bg-white px-6 py-3 font-bold text-[#1B3A6B] transition hover:bg-white/90"
                >
                  Contact Geyer Holdings
                </a>
                <a
                  href="/contact"
                  className="rounded-lg bg-[#2E7D32] px-6 py-3 font-bold text-white transition hover:bg-[#1d5e20]"
                >
                  Get in Touch
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="space-y-6 text-center">
          <h2 className="text-3xl font-black text-[#1B3A6B]">Ready to Get Started?</h2>
          <p className="mx-auto max-w-2xl text-[#5d7497]">
            Join thousands of farmers, buyers, and logistics partners using HerdFlow to transform
            agricultural trade.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/auth/register"
              className="rounded-lg bg-[#2E7D32] px-8 py-4 font-bold uppercase tracking-wide text-white shadow-lg transition hover:bg-[#1d5e20]"
            >
              Create Account
            </Link>
            <Link
              href="/shop"
              className="rounded-lg border-2 border-[#1B3A6B] px-8 py-4 font-bold uppercase tracking-wide text-[#1B3A6B] transition hover:bg-[#1B3A6B] hover:text-white"
            >
              Browse Products
            </Link>
          </div>
        </section>

        {/* Facebook CTA */}
        <section className="mt-4 border-t border-[#e4ebf5] py-12 text-center">
          <p className="mb-2 text-lg text-[#5d7497]">Stay connected with HerdFlow</p>
          <p className="mb-6 text-sm text-[#9aabb9]">
            Follow us for the latest listings, auction dates and farming news
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
            Follow HerdFlow on Facebook
          </a>
        </section>
      </div>
    </div>
  );
}
