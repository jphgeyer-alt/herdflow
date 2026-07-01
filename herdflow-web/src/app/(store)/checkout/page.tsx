"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { ShoppingBag, ChevronRight, CreditCard, MapPin, User, Check } from "lucide-react";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalItems, totalCents, clearCart } = useCart();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [postalCode, setPostalCode] = useState("");

  const provinces = [
    "Eastern Cape",
    "Free State",
    "Gauteng",
    "KwaZulu-Natal",
    "Limpopo",
    "Mpumalanga",
    "Northern Cape",
    "North West",
    "Western Cape",
  ];

  async function handleSubmitOrder(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Create order in database
      const res = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          customerInfo: { fullName, email, phone, address, city, province, postalCode },
          totalCents,
        }),
      });

      const data = await res.json();

      if (res.ok && data.orderNumber) {
        // Clear cart
        clearCart();

        // Redirect to order confirmation page
        router.push(`/orders/${data.orderNumber}`);
      } else {
        setError(data.error || "Failed to create order");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#f5f4ef] flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-xl border border-[#e4ebf5] p-12 text-center max-w-md">
          <ShoppingBag size={64} className="mx-auto text-[#cdd8e7] mb-4" />
          <h1 className="text-2xl font-black text-[#1B3A6B] mb-4">Your Cart is Empty</h1>
          <p className="text-[#5d7497] mb-6">Add some products before checking out.</p>
          <Link
            href="/shop"
            className="inline-block px-8 py-3 bg-[#2E7D32] hover:bg-[#1d5e20] text-white font-bold rounded-lg transition"
          >
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f4ef]">
      {/* Hero Header */}
      <div className="bg-[#1B3A6B] text-white py-12 px-4 md:px-8">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-4xl font-black mb-2">Checkout</h1>
          <p className="text-lg text-white/80">Complete your purchase in 3 easy steps</p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-white border-b border-[#e4ebf5] py-8">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            <div className="flex flex-col items-center flex-1">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center font-bold ${
                  step >= 1 ? "bg-[#2E7D32] text-white" : "bg-[#e4ebf5] text-[#5d7497]"
                }`}
              >
                {step > 1 ? <Check size={24} /> : "1"}
              </div>
              <span className="text-sm font-semibold text-[#244367] mt-2">Review Cart</span>
            </div>

            <ChevronRight className="text-[#cdd8e7] mx-4" />

            <div className="flex flex-col items-center flex-1">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center font-bold ${
                  step >= 2 ? "bg-[#2E7D32] text-white" : "bg-[#e4ebf5] text-[#5d7497]"
                }`}
              >
                {step > 2 ? <Check size={24} /> : "2"}
              </div>
              <span className="text-sm font-semibold text-[#244367] mt-2">Billing Info</span>
            </div>

            <ChevronRight className="text-[#cdd8e7] mx-4" />

            <div className="flex flex-col items-center flex-1">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center font-bold ${
                  step >= 3 ? "bg-[#2E7D32] text-white" : "bg-[#e4ebf5] text-[#5d7497]"
                }`}
              >
                3
              </div>
              <span className="text-sm font-semibold text-[#244367] mt-2">Payment</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 md:px-8 py-12">
        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800 max-w-2xl mx-auto">
            {error}
          </div>
        )}

        {/* Step 1: Review Cart */}
        {step === 1 && (
          <div className="max-w-2xl mx-auto space-y-6">
            <h2 className="text-2xl font-black text-[#1B3A6B]">Review Your Order</h2>

            <div className="bg-white rounded-2xl shadow-lg border border-[#e4ebf5] p-6 space-y-4">
              {items.map((item) => (
                <div key={item.productId} className="flex items-center justify-between pb-4 border-b border-[#e4ebf5] last:border-0">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-[#e8eef9] to-[#dce6f6] flex items-center justify-center">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover rounded-lg" />
                      ) : (
                        <span className="text-2xl">📦</span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-[#244367]">{item.productName}</h3>
                      <p className="text-sm text-[#5d7497]">Quantity: {item.quantity}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-[#2E7D32]">R{((item.priceCents * item.quantity) / 100).toFixed(2)}</p>
                    <p className="text-xs text-[#5d7497]">R{(item.priceCents / 100).toFixed(2)} each</p>
                  </div>
                </div>
              ))}

              <div className="pt-4 border-t border-[#e4ebf5]">
                <div className="flex justify-between mb-2">
                  <span className="text-[#5d7497]">Total Items:</span>
                  <span className="font-semibold text-[#244367]">{totalItems}</span>
                </div>
                <div className="flex justify-between text-2xl">
                  <span className="font-black text-[#1B3A6B]">Order Total:</span>
                  <span className="font-black text-[#2E7D32]">R{(totalCents / 100).toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <Link
                href="/shop"
                className="flex-1 text-center border-2 border-[#1B3A6B] text-[#1B3A6B] font-bold py-3 rounded-lg hover:bg-[#1B3A6B] hover:text-white transition"
              >
                Continue Shopping
              </Link>
              <button
                onClick={() => setStep(2)}
                className="flex-1 bg-[#2E7D32] hover:bg-[#1d5e20] text-white font-bold py-3 rounded-lg transition"
              >
                Continue to Billing
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Billing Information */}
        {step === 2 && (
          <div className="max-w-2xl mx-auto space-y-6">
            <h2 className="text-2xl font-black text-[#1B3A6B]">Billing & Shipping Information</h2>

            <div className="bg-white rounded-2xl shadow-lg border border-[#e4ebf5] p-8">
              <form className="space-y-5">
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-[#244367] mb-2">
                    <User size={16} />
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-lg border border-[#cdd8e7] focus:outline-none focus:border-[#1B3A6B] focus:ring-2 focus:ring-[#1B3A6B]/20"
                    placeholder="John Smith"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-[#244367] mb-2">Email Address *</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full px-4 py-3 rounded-lg border border-[#cdd8e7] focus:outline-none focus:border-[#1B3A6B] focus:ring-2 focus:ring-[#1B3A6B]/20"
                      placeholder="your.email@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[#244367] mb-2">Phone Number *</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      className="w-full px-4 py-3 rounded-lg border border-[#cdd8e7] focus:outline-none focus:border-[#1B3A6B] focus:ring-2 focus:ring-[#1B3A6B]/20"
                      placeholder="+27 82 123 4567"
                    />
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-[#244367] mb-2">
                    <MapPin size={16} />
                    Street Address *
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-lg border border-[#cdd8e7] focus:outline-none focus:border-[#1B3A6B] focus:ring-2 focus:ring-[#1B3A6B]/20"
                    placeholder="123 Main Street"
                  />
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-[#244367] mb-2">City *</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      required
                      className="w-full px-4 py-3 rounded-lg border border-[#cdd8e7] focus:outline-none focus:border-[#1B3A6B] focus:ring-2 focus:ring-[#1B3A6B]/20"
                      placeholder="Johannesburg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[#244367] mb-2">Province *</label>
                    <select
                      value={province}
                      onChange={(e) => setProvince(e.target.value)}
                      required
                      className="w-full px-4 py-3 rounded-lg border border-[#cdd8e7] focus:outline-none focus:border-[#1B3A6B] focus:ring-2 focus:ring-[#1B3A6B]/20"
                    >
                      <option value="">Select</option>
                      {provinces.map((prov) => (
                        <option key={prov} value={prov}>
                          {prov}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[#244367] mb-2">Postal Code *</label>
                    <input
                      type="text"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      required
                      className="w-full px-4 py-3 rounded-lg border border-[#cdd8e7] focus:outline-none focus:border-[#1B3A6B] focus:ring-2 focus:ring-[#1B3A6B]/20"
                      placeholder="2000"
                    />
                  </div>
                </div>
              </form>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setStep(1)}
                className="flex-1 text-center border-2 border-[#1B3A6B] text-[#1B3A6B] font-bold py-3 rounded-lg hover:bg-[#1B3A6B] hover:text-white transition"
              >
                Back to Cart
              </button>
              <button
                onClick={() => {
                  if (!fullName || !email || !phone || !address || !city || !province || !postalCode) {
                    setError("Please fill in all required fields");
                    return;
                  }
                  setError("");
                  setStep(3);
                }}
                className="flex-1 bg-[#2E7D32] hover:bg-[#1d5e20] text-white font-bold py-3 rounded-lg transition"
              >
                Continue to Payment
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Payment */}
        {step === 3 && (
          <div className="max-w-2xl mx-auto space-y-6">
            <h2 className="text-2xl font-black text-[#1B3A6B]">Complete Payment</h2>

            {/* Order Summary */}
            <div className="bg-white rounded-2xl shadow-lg border border-[#e4ebf5] p-6">
              <h3 className="font-bold text-[#244367] mb-4">Order Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#5d7497]">Items ({totalItems}):</span>
                  <span className="font-semibold text-[#244367]">R{(totalCents / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5d7497]">Shipping:</span>
                  <span className="font-semibold text-[#244367]">TBD</span>
                </div>
                <div className="pt-2 border-t border-[#e4ebf5] flex justify-between text-xl">
                  <span className="font-black text-[#1B3A6B]">Total:</span>
                  <span className="font-black text-[#2E7D32]">R{(totalCents / 100).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-2xl shadow-lg border border-[#e4ebf5] p-8">
              <div className="flex items-center gap-3 mb-4">
                <CreditCard size={32} className="text-[#2E7D32]" />
                <div>
                  <h3 className="font-bold text-[#244367]">Secure Payment with PayFast</h3>
                  <p className="text-sm text-[#5d7497]">Your payment information is encrypted and secure</p>
                </div>
              </div>

              <form onSubmit={handleSubmitOrder}>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#2E7D32] hover:bg-[#1d5e20] text-white font-bold uppercase tracking-wide py-4 rounded-lg shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Processing..." : `Pay R${(totalCents / 100).toFixed(2)} with PayFast`}
                </button>
              </form>

              <p className="text-xs text-[#5d7497] text-center mt-4">
                By completing this purchase, you agree to HerdFlow's Terms of Service and Privacy Policy.
              </p>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setStep(2)}
                className="flex-1 text-center border-2 border-[#1B3A6B] text-[#1B3A6B] font-bold py-3 rounded-lg hover:bg-[#1B3A6B] hover:text-white transition"
              >
                Back to Billing
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

