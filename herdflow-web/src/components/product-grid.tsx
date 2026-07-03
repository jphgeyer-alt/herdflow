'use client';

import { Star, ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { useCart } from '@/lib/cart-context';
import { SafeImg } from '@/components/safe-img';

interface Product {
  id: string;
  name: string;
  slug: string;
  priceCents: number;
  description: string;
  categoryId: string;
  photos?: string[];
  category?: { name: string };
  status: string;
  seller?: {
    farmName: string;
  };
}

interface ProductGridProps {
  products: Product[];
}

export function ProductGrid({ products }: ProductGridProps) {
  const { addToCart } = useCart();

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 2,
    }).format(cents / 100);
  };

  const handleAddToCart = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart({
      productId: product.id,
      productName: product.name,
      priceCents: product.priceCents,
    });
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
        <div
          key={product.id}
          className="group bg-white rounded-lg border border-neutral-200 overflow-hidden hover:shadow-lg transition duration-300"
        >
          <Link href={`/products/${product.slug}`}>
            {/* Product Image */}
            <div className="h-48 bg-gradient-to-br from-neutral-100 to-neutral-200 overflow-hidden group-hover:from-neutral-200 group-hover:to-neutral-300 transition">
              {product.photos && product.photos.length > 0 ? (
                <SafeImg
                  src={product.photos[0]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  <p className="text-xs text-neutral-500">{product.category?.name ?? "Product"}</p>
                </div>
              )}
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
              </div>
            </div>
          </Link>
          
          {/* Add to Cart Button Outside Link */}
          <div className="px-4 pb-4">
            <button
              onClick={(e) => handleAddToCart(e, product)}
              className="w-full flex items-center justify-center gap-2 bg-brand-navy text-white py-2 rounded-lg hover:bg-blue-900 transition font-semibold"
            >
              <ShoppingCart size={18} />
              Add to Cart
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
