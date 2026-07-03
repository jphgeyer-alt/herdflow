import Link from "next/link";
import { CheckCircle2, Users, TrendingUp, Shield, Award, Target } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#f5f4ef]">
      {/* Hero Header */}
      <div className="bg-[#1B3A6B] text-white py-16 px-4 md:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#A07C3A] mb-3">About HerdFlow</p>
          <h1 className="text-5xl font-black mb-4">Connecting South African Agriculture</h1>
          <p className="text-xl text-white/80 max-w-3xl leading-relaxed">
            HerdFlow is the all-in-one digital marketplace for livestock trade, agricultural products, and logistics coordination across South Africa.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 md:px-8 py-16 space-y-16">
        {/* Our Story */}
        <section className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-3xl font-black text-[#1B3A6B]">Our Story</h2>
            <p className="text-[#5d7497] leading-relaxed">
              HerdFlow was born from a simple observation: South African farmers needed a modern, trusted platform to buy and sell livestock and agricultural products. Traditional methods were inefficient, lacked transparency, and created unnecessary friction in agricultural trade.
            </p>
            <p className="text-[#5d7497] leading-relaxed">
              We set out to build a platform that puts farmers first—combining the convenience of ecommerce with the trust and relationships that agricultural communities depend on. Today, HerdFlow connects buyers, sellers, and logistics partners across all provinces, making agricultural trade faster, safer, and more profitable for everyone.
            </p>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-[#2E7D32] rounded-xl">
                <CheckCircle2 size={28} className="text-white" />
              </div>
              <div>
                <p className="font-black text-[#1B3A6B] text-2xl">2024</p>
                <p className="text-sm text-[#5d7497]">Founded with a mission to modernize agriculture</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#e8eef9] to-[#dce6f6] rounded-2xl h-96 flex items-center justify-center">
            <span className="text-8xl">🐄</span>
          </div>
        </section>

        {/* What We Do */}
        <section>
          <h2 className="text-3xl font-black text-[#1B3A6B] mb-8 text-center">What We Do</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl shadow-lg border border-[#e4ebf5] p-8 hover:shadow-xl transition">
              <div className="p-4 bg-blue-100 rounded-xl w-fit mb-4">
                <Users size={32} className="text-[#1B3A6B]" />
              </div>
              <h3 className="text-xl font-bold text-[#244367] mb-3">Livestock Marketplace</h3>
              <p className="text-[#5d7497] leading-relaxed">
                Browse verified livestock listings from trusted farmers across South Africa. Every listing includes detailed breed information, health records, and seller verification.
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-[#e4ebf5] p-8 hover:shadow-xl transition">
              <div className="p-4 bg-green-100 rounded-xl w-fit mb-4">
                <TrendingUp size={32} className="text-[#2E7D32]" />
              </div>
              <h3 className="text-xl font-bold text-[#244367] mb-3">Agricultural Products</h3>
              <p className="text-[#5d7497] leading-relaxed">
                Shop for farm equipment, feed, veterinary supplies, and more from verified sellers. Secure checkout with PayFast ensures safe transactions every time.
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-[#e4ebf5] p-8 hover:shadow-xl transition">
              <div className="p-4 bg-yellow-100 rounded-xl w-fit mb-4">
                <Shield size={32} className="text-[#A07C3A]" />
              </div>
              <h3 className="text-xl font-bold text-[#244367] mb-3">Logistics Network</h3>
              <p className="text-[#5d7497] leading-relaxed">
                Connect with verified logistics partners for reliable livestock and product delivery across all provinces. Track your shipments in real-time.
              </p>
            </div>
          </div>
        </section>

        {/* Why Choose HerdFlow */}
        <section className="bg-white rounded-2xl shadow-xl border border-[#e4ebf5] p-12">
          <h2 className="text-3xl font-black text-[#1B3A6B] mb-8 text-center">Why Choose HerdFlow</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
                <CheckCircle2 size={24} className="text-[#2E7D32]" />
              </div>
              <div>
                <h3 className="font-bold text-[#244367] mb-2">Verified Sellers</h3>
                <p className="text-sm text-[#5d7497]">Every seller goes through identity verification and farm documentation before approval.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
                <CheckCircle2 size={24} className="text-[#2E7D32]" />
              </div>
              <div>
                <h3 className="font-bold text-[#244367] mb-2">Secure Payments</h3>
                <p className="text-sm text-[#5d7497]">All transactions processed through PayFast for maximum security and buyer protection.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
                <CheckCircle2 size={24} className="text-[#2E7D32]" />
              </div>
              <div>
                <h3 className="font-bold text-[#244367] mb-2">Regional Coverage</h3>
                <p className="text-sm text-[#5d7497]">Active across all nine provinces with growing logistics partner network.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
                <CheckCircle2 size={24} className="text-[#2E7D32]" />
              </div>
              <div>
                <h3 className="font-bold text-[#244367] mb-2">Mobile-First Design</h3>
                <p className="text-sm text-[#5d7497]">Optimized for rural connectivity and field usage—works great even on slow networks.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Geyer Holdings Section */}
        <section className="bg-gradient-to-r from-[#1B3A6B] to-[#254f8e] rounded-2xl shadow-2xl p-12 text-white">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <Award size={40} className="text-[#A07C3A]" />
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#A07C3A]">Powered By</p>
                <h2 className="text-3xl font-black">Geyer Holdings</h2>
              </div>
            </div>

            <p className="text-lg text-white/90 leading-relaxed">
              HerdFlow is developed and operated by Geyer Holdings, a family-owned agricultural investment company based in the North West Province of South Africa.
            </p>

            <p className="text-white/80 leading-relaxed">
              With deep roots in South African farming communities and decades of experience in agricultural operations, Geyer Holdings understands the challenges facing farmers today. HerdFlow represents our commitment to leveraging technology to strengthen agricultural trade, improve market access, and support rural economic development.
            </p>

            <div className="grid md:grid-cols-3 gap-6 pt-6">
              <div className="bg-white/10 rounded-xl p-6 backdrop-blur-sm">
                <Target size={32} className="text-[#A07C3A] mb-3" />
                <h3 className="font-bold mb-2">Our Mission</h3>
                <p className="text-sm text-white/80">Empower farmers with modern tools for transparent, efficient agricultural trade.</p>
              </div>

              <div className="bg-white/10 rounded-xl p-6 backdrop-blur-sm">
                <Users size={32} className="text-[#A07C3A] mb-3" />
                <h3 className="font-bold mb-2">Our Values</h3>
                <p className="text-sm text-white/80">Trust, transparency, and community-first approach in everything we do.</p>
              </div>

              <div className="bg-white/10 rounded-xl p-6 backdrop-blur-sm">
                <TrendingUp size={32} className="text-[#A07C3A] mb-3" />
                <h3 className="font-bold mb-2">Our Vision</h3>
                <p className="text-sm text-white/80">Become the leading agricultural marketplace across Southern Africa.</p>
              </div>
            </div>

            <div className="pt-8 border-t border-white/20">
              <p className="text-sm text-white/70 mb-4">Learn more about Geyer Holdings:</p>
              <div className="flex flex-wrap gap-4">
                <a
                  href="mailto:info@geyerholdings.co.za"
                  className="px-6 py-3 bg-white hover:bg-white/90 text-[#1B3A6B] font-bold rounded-lg transition"
                >
                  Contact Geyer Holdings
                </a>
                <a
                  href="/contact"
                  className="px-6 py-3 bg-[#2E7D32] hover:bg-[#1d5e20] text-white font-bold rounded-lg transition"
                >
                  Get in Touch
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="text-center space-y-6">
          <h2 className="text-3xl font-black text-[#1B3A6B]">Ready to Get Started?</h2>
          <p className="text-[#5d7497] max-w-2xl mx-auto">
            Join thousands of farmers, buyers, and logistics partners using HerdFlow to transform agricultural trade.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/auth/register"
              className="px-8 py-4 bg-[#2E7D32] hover:bg-[#1d5e20] text-white font-bold uppercase tracking-wide rounded-lg shadow-lg transition"
            >
              Create Account
            </Link>
            <Link
              href="/shop"
              className="px-8 py-4 border-2 border-[#1B3A6B] text-[#1B3A6B] hover:bg-[#1B3A6B] hover:text-white font-bold uppercase tracking-wide rounded-lg transition"
            >
              Browse Products
            </Link>
          </div>
        </section>

        {/* Facebook CTA */}
        <section className="text-center py-12 border-t border-[#e4ebf5] mt-4">
          <p className="text-[#5d7497] mb-2 text-lg">Stay connected with HerdFlow</p>
          <p className="text-[#9aabb9] text-sm mb-6">Follow us for the latest listings, auction dates and farming news</p>
          <a
            href="https://www.facebook.com/share/1cUWCfQwut/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-8 py-4 bg-[#1877F2] text-white rounded-lg font-semibold text-lg hover:bg-[#1565D8] transition-colors duration-200 shadow-lg hover:shadow-xl"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            Follow HerdFlow on Facebook
          </a>
        </section>
      </div>
    </div>
  );
}
