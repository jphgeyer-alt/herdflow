"use client";

import { useCart } from "@/lib/cart-context";
import { X, Minus, Plus, ShoppingBag } from "lucide-react";
import Link from "next/link";

export function CartDrawer() {
  const { items, totalItems, totalCents, removeFromCart, updateQuantity, isDrawerOpen, closeDrawer } = useCart();

  if (!isDrawerOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm" onClick={closeDrawer} />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col animate-slide-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#e4ebf5] bg-[#1B3A6B]">
          <div className="flex items-center gap-3">
            <ShoppingBag size={24} className="text-white" />
            <h2 className="text-xl font-black text-white">Your Cart</h2>
          </div>
          <button onClick={closeDrawer} className="p-2 hover:bg-white/10 rounded-lg transition text-white">
            <X size={24} />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <ShoppingBag size={64} className="text-[#cdd8e7] mb-4" />
              <p className="text-[#5d7497] text-lg mb-6">Your cart is empty</p>
              <button
                onClick={closeDrawer}
                className="px-8 py-3 bg-[#1B3A6B] hover:bg-[#122844] text-white font-bold rounded-lg transition"
              >
                Start Shopping
              </button>
            </div>
          ) : (
            <>
              {items.map((item) => (
                <div key={item.productId} className="flex gap-4 bg-[#f5f8fd] rounded-xl p-4">
                  <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-[#e8eef9] to-[#dce6f6] flex items-center justify-center flex-shrink-0">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <span className="text-2xl">🐄</span>
                    )}
                  </div>

                  <div className="flex-1 space-y-2">
                    <h3 className="font-bold text-[#244367] line-clamp-2">{item.productName}</h3>
                    <p className="text-lg font-black text-[#2E7D32]">R{(item.priceCents / 100).toFixed(2)}</p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          className="w-8 h-8 flex items-center justify-center bg-white hover:bg-[#e4ebf5] border border-[#cdd8e7] rounded-lg transition"
                        >
                          <Minus size={16} className="text-[#244367]" />
                        </button>
                        <span className="w-12 text-center font-bold text-[#244367]">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          className="w-8 h-8 flex items-center justify-center bg-white hover:bg-[#e4ebf5] border border-[#cdd8e7] rounded-lg transition"
                        >
                          <Plus size={16} className="text-[#244367]" />
                        </button>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.productId)}
                        className="text-sm font-semibold text-red-600 hover:text-red-700 transition"
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
          <div className="border-t border-[#e4ebf5] p-6 space-y-4 bg-[#f5f8fd]">
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
              className="block w-full text-center bg-[#2E7D32] hover:bg-[#1d5e20] text-white font-bold uppercase tracking-wide py-4 rounded-lg shadow-lg transition"
            >
              Proceed to Checkout
            </Link>
            <button
              onClick={closeDrawer}
              className="block w-full text-center border-2 border-[#1B3A6B] text-[#1B3A6B] font-bold py-3 rounded-lg hover:bg-[#1B3A6B] hover:text-white transition"
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
