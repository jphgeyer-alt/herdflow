'use client';

import { Star, ShoppingCart } from 'lucide-react';
import Link from 'next/link';

interface Product {
  id: string;
  name: string;
  slug: string;
  priceCents: number;
  description: string;
  categoryId: string;
  status: string;
  seller?: {
    farmName: string;
  };
}

interface ProductGridProps {
  products: Product[];
}

export function ProductGrid({ products }: ProductGridProps) {
  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 2,
    }).format(cents / 100);
  };

  if (products.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-neutral-500 text-lg">No products available at the moment.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product) => (
        <Link
          key={product.id}
          href={`/products/${product.slug}`}
          className="group"
        >
          <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden hover:shadow-lg transition duration-300">
            {/* Product Image Placeholder */}
            <div className="h-48 bg-gradient-to-br from-neutral-100 to-neutral-200 flex items-center justify-center group-hover:from-neutral-200 group-hover:to-neutral-300 transition">
              <div className="text-center">
                <div className="text-4xl mb-2">🐄</div>
                <p className="text-xs text-neutral-600">{product.categoryId}</p>
              </div>
            </div>

            {/* Product Info */}
            <div className="p-4">
              <h3 className="font-semibold text-neutral-900 mb-1 line-clamp-2">
                {product.name}
              </h3>
              
              {product.seller && (
                <p className="text-xs text-neutral-600 mb-3">
                  By {product.seller.farmName}
                </p>
              )}

              <p className="text-sm text-neutral-700 mb-4 line-clamp-2">
                {product.description}
              </p>

              {/* Rating */}
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={14}
                    className={i < 4 ? 'fill-yellow-400 text-yellow-400' : 'text-neutral-300'}
                  />
                ))}
                <span className="text-xs text-neutral-600 ml-1">(24)</span>
              </div>

              {/* Price and Button */}
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-brand-navy">
                  {formatPrice(product.priceCents)}
                </span>
                <button aria-label={`Add ${product.name} to cart`} className="p-2 bg-brand-navy text-white rounded-lg hover:bg-blue-900 transition">
                  <ShoppingCart size={18} />
                </button>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
