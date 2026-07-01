'use client';

import Link from 'next/link';

export function StoreBanner() {
  return (
    <div 
      className="relative min-h-[500px] rounded-xl overflow-hidden bg-cover bg-center"
      style={{
        backgroundImage: 'linear-gradient(135deg, rgba(27,58,92,0.75) 0%, rgba(107,166,64,0.6) 100%), url(https://images.unsplash.com/photo-1560493676-04071c5f467b?w=1400&h=600&fit=crop)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Decorative elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 right-10 w-64 h-64 bg-white rounded-full blur-3xl" />
        <div className="absolute bottom-5 left-20 w-48 h-48 bg-white rounded-full blur-2xl" />
      </div>
      
      <div className="relative h-full flex flex-col items-center justify-center px-4 py-24 text-center">
        {/* Badge */}
        <div className="inline-block mb-6 px-4 py-2 rounded-full bg-brand-green/20 backdrop-blur border border-brand-green/40">
          <span className="text-brand-green text-sm font-bold">🇿🇦 PROUDLY SOUTH AFRICAN AGRICULTURAL PRODUCTS</span>
        </div>
        
        {/* Main Heading */}
        <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 leading-tight max-w-4xl">
          Premium Livestock & Produce
        </h1>
        
        {/* Subheading */}
        <p className="text-xl text-white/90 max-w-2xl mb-2">
          Direct from South African Farmers
        </p>
        <p className="text-lg text-brand-green font-semibold mb-8">
          Smarter Herds. Stronger Futures.
        </p>
        
        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            href="/shop"
            className="px-8 py-4 bg-brand-green text-white font-bold rounded-lg hover:bg-emerald-700 transition shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            Shop Now
          </Link>
          <Link 
            href="/auction"
            className="px-8 py-4 border-2 border-white text-white font-bold rounded-lg hover:bg-white/10 transition shadow-lg"
          >
            Live Auctions
          </Link>
        </div>

        {/* Features */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl">
          <div className="text-white">
            <div className="text-3xl mb-2">✓</div>
            <p className="font-semibold">Quality Assured</p>
            <p className="text-sm text-white/70">Premium products verified</p>
          </div>
          <div className="text-white">
            <div className="text-3xl mb-2">🚚</div>
            <p className="font-semibold">Fast Delivery</p>
            <p className="text-sm text-white/70">Across South Africa</p>
          </div>
          <div className="text-white">
            <div className="text-3xl mb-2">🤝</div>
            <p className="font-semibold">Fair Prices</p>
            <p className="text-sm text-white/70">Direct from farmers</p>
          </div>
        </div>
      </div>
    </div>
  );
}
