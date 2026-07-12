"use client";

import { useCart } from "@/lib/cart-context";
import { X, Minus, Plus, ShoppingBag } from "lucide-react";
import Link from "next/link";

export function CartDrawer() {
  const {
    items,
    totalItems,
    totalCents,
    removeFromCart,
    updateQuantity,
    isDrawerOpen,
    closeDrawer,
  } = useCart();

  if (!isDrawerOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={closeDrawer} />

      {/* Drawer */}
      <div className="animate-slide-in fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#e4ebf5] bg-[#1B3A6B] p-6">
          <div className="flex items-center gap-3">
            <ShoppingBag size={24} className="text-white" />
            <h2 className="text-xl font-black text-white">Your Cart</h2>
          </div>
          <button
            onClick={closeDrawer}
            className="rounded-lg p-2 text-white transition hover:bg-white/10"
          >
            <X size={24} />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 space-y-4 overflow-y-auto p-6">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <ShoppingBag size={64} className="mb-4 text-[#cdd8e7]" />
              <p className="mb-6 text-lg text-[#5d7497]">Your cart is empty</p>
              <button
                onClick={closeDrawer}
                className="rounded-lg bg-[#1B3A6B] px-8 py-3 font-bold text-white transition hover:bg-[#122844]"
              >
                Start Shopping
              </button>
            </div>
          ) : (
            <>
              {items.map((item) => (
                <div key={item.productId} className="flex gap-4 rounded-xl bg-[#f5f8fd] p-4">
                  <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#e8eef9] to-[#dce6f6]">
                    {item.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.imageUrl}
                        alt={item.productName}
                        className="h-full w-full rounded-lg object-cover"
                      />
                    ) : (
                      <span className="text-2xl">🐄</span>
                    )}
                  </div>

                  <div className="flex-1 space-y-2">
                    <h3 className="line-clamp-2 font-bold text-[#244367]">{item.productName}</h3>
                    <p className="text-lg font-black text-[#2E7D32]">
                      R{(item.priceCents / 100).toFixed(2)}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#cdd8e7] bg-white transition hover:bg-[#e4ebf5]"
                        >
                          <Minus size={16} className="text-[#244367]" />
                        </button>
                        <span className="w-12 text-center font-bold text-[#244367]">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#cdd8e7] bg-white transition hover:bg-[#e4ebf5]"
                        >
                          <Plus size={16} className="text-[#244367]" />
                        </button>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.productId)}
                        className="text-sm font-semibold text-red-600 transition hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="space-y-4 border-t border-[#e4ebf5] bg-[#f5f8fd] p-6">
            <div className="flex items-center justify-between text-lg">
              <span className="font-semibold text-[#244367]">Total Items:</span>
              <span className="font-bold text-[#244367]">{totalItems}</span>
            </div>
            <div className="flex items-center justify-between text-2xl">
              <span className="font-black text-[#1B3A6B]">Total:</span>
              <span className="font-black text-[#2E7D32]">R{(totalCents / 100).toFixed(2)}</span>
            </div>
            <Link
              href="/checkout"
              onClick={closeDrawer}
              className="block w-full rounded-lg bg-[#2E7D32] py-4 text-center font-bold uppercase tracking-wide text-white shadow-lg transition hover:bg-[#1d5e20]"
            >
              Proceed to Checkout
            </Link>
            <button
              onClick={closeDrawer}
              className="block w-full rounded-lg border-2 border-[#1B3A6B] py-3 text-center font-bold text-[#1B3A6B] transition hover:bg-[#1B3A6B] hover:text-white"
            >
              Continue Shopping
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </>
  );
}
