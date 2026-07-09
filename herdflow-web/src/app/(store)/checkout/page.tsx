"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { ShoppingBag, ChevronRight, CreditCard, MapPin, Truck, User, Check } from "lucide-react";

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
  const [deliveryMethod, setDeliveryMethod] = useState<"PICKUP" | "DELIVERY">("DELIVERY");
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
          customerInfo: {
            fullName,
            email,
            phone,
            deliveryMethod,
            address,
            city,
            province,
            postalCode,
          },
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
      <div className="flex min-h-screen items-center justify-center bg-[#f5f4ef] px-4">
        <div className="max-w-md rounded-2xl border border-[#e4ebf5] bg-white p-12 text-center shadow-xl">
          <ShoppingBag size={64} className="mx-auto mb-4 text-[#cdd8e7]" />
          <h1 className="mb-4 text-2xl font-black text-[#1B3A6B]">Your Cart is Empty</h1>
          <p className="mb-6 text-[#5d7497]">Add some products before checking out.</p>
          <Link
            href="/shop"
            className="inline-block rounded-lg bg-[#2E7D32] px-8 py-3 font-bold text-white transition hover:bg-[#1d5e20]"
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
      <div className="bg-[#1B3A6B] px-4 py-12 text-white md:px-8">
        <div className="mx-auto max-w-7xl">
          <h1 className="mb-2 text-4xl font-black">Checkout</h1>
          <p className="text-lg text-white/80">Complete your purchase in 3 easy steps</p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="border-b border-[#e4ebf5] bg-white py-8">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="mx-auto flex max-w-2xl items-center justify-between">
            <div className="flex flex-1 flex-col items-center">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-full font-bold ${
                  step >= 1 ? "bg-[#2E7D32] text-white" : "bg-[#e4ebf5] text-[#5d7497]"
                }`}
              >
                {step > 1 ? <Check size={24} /> : "1"}
              </div>
              <span className="mt-2 text-sm font-semibold text-[#244367]">Review Cart</span>
            </div>

            <ChevronRight className="mx-4 text-[#cdd8e7]" />

            <div className="flex flex-1 flex-col items-center">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-full font-bold ${
                  step >= 2 ? "bg-[#2E7D32] text-white" : "bg-[#e4ebf5] text-[#5d7497]"
                }`}
              >
                {step > 2 ? <Check size={24} /> : "2"}
              </div>
              <span className="mt-2 text-sm font-semibold text-[#244367]">Billing Info</span>
            </div>

            <ChevronRight className="mx-4 text-[#cdd8e7]" />

            <div className="flex flex-1 flex-col items-center">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-full font-bold ${
                  step >= 3 ? "bg-[#2E7D32] text-white" : "bg-[#e4ebf5] text-[#5d7497]"
                }`}
              >
                3
              </div>
              <span className="mt-2 text-sm font-semibold text-[#244367]">Payment</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-8">
        {error && (
          <div className="mx-auto mb-8 max-w-2xl rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {error}
          </div>
        )}

        {/* Step 1: Review Cart */}
        {step === 1 && (
          <div className="mx-auto max-w-2xl space-y-6">
            <h2 className="text-2xl font-black text-[#1B3A6B]">Review Your Order</h2>

            <div className="space-y-4 rounded-2xl border border-[#e4ebf5] bg-white p-6 shadow-lg">
              {items.map((item) => (
                <div
                  key={item.productId}
                  className="flex items-center justify-between border-b border-[#e4ebf5] pb-4 last:border-0"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-gradient-to-br from-[#e8eef9] to-[#dce6f6]">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.productName}
                          className="h-full w-full rounded-lg object-cover"
                        />
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
                    <p className="text-lg font-black text-[#2E7D32]">
                      R{((item.priceCents * item.quantity) / 100).toFixed(2)}
                    </p>
                    <p className="text-xs text-[#5d7497]">
                      R{(item.priceCents / 100).toFixed(2)} each
                    </p>
                  </div>
                </div>
              ))}

              <div className="border-t border-[#e4ebf5] pt-4">
                <div className="mb-2 flex justify-between">
                  <span className="text-[#5d7497]">Total Items:</span>
                  <span className="font-semibold text-[#244367]">{totalItems}</span>
                </div>
                <div className="flex justify-between text-2xl">
                  <span className="font-black text-[#1B3A6B]">Order Total:</span>
                  <span className="font-black text-[#2E7D32]">
                    R{(totalCents / 100).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <Link
                href="/shop"
                className="flex-1 rounded-lg border-2 border-[#1B3A6B] py-3 text-center font-bold text-[#1B3A6B] transition hover:bg-[#1B3A6B] hover:text-white"
              >
                Continue Shopping
              </Link>
              <button
                onClick={() => setStep(2)}
                className="flex-1 rounded-lg bg-[#2E7D32] py-3 font-bold text-white transition hover:bg-[#1d5e20]"
              >
                Continue to Billing
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Billing Information */}
        {step === 2 && (
          <div className="mx-auto max-w-2xl space-y-6">
            <h2 className="text-2xl font-black text-[#1B3A6B]">Billing & Shipping Information</h2>

            <div className="rounded-2xl border border-[#e4ebf5] bg-white p-8 shadow-lg">
              <form className="space-y-5">
                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#244367]">
                    <User size={16} />
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="w-full rounded-lg border border-[#cdd8e7] px-4 py-3 focus:border-[#1B3A6B] focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/20"
                    placeholder="John Smith"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-[#244367]">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full rounded-lg border border-[#cdd8e7] px-4 py-3 focus:border-[#1B3A6B] focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/20"
                      placeholder="your.email@example.com"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-[#244367]">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      className="w-full rounded-lg border border-[#cdd8e7] px-4 py-3 focus:border-[#1B3A6B] focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/20"
                      placeholder="+27 82 123 4567"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#244367]">
                    <Truck size={16} />
                    Delivery Method *
                  </label>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label
                      className={`flex cursor-pointer items-center gap-3 rounded-lg border-2 px-4 py-3 transition ${
                        deliveryMethod === "DELIVERY"
                          ? "border-[#2E7D32] bg-[#eef8f0]"
                          : "border-[#cdd8e7]"
                      }`}
                    >
                      <input
                        type="radio"
                        name="deliveryMethod"
                        value="DELIVERY"
                        checked={deliveryMethod === "DELIVERY"}
                        onChange={() => setDeliveryMethod("DELIVERY")}
                        className="h-4 w-4"
                      />
                      <div>
                        <p className="font-semibold text-[#244367]">Delivery</p>
                        <p className="text-xs text-[#5d7497]">
                          Shipped to your address by a logistics partner
                        </p>
                      </div>
                    </label>

                    <label
                      className={`flex cursor-pointer items-center gap-3 rounded-lg border-2 px-4 py-3 transition ${
                        deliveryMethod === "PICKUP"
                          ? "border-[#2E7D32] bg-[#eef8f0]"
                          : "border-[#cdd8e7]"
                      }`}
                    >
                      <input
                        type="radio"
                        name="deliveryMethod"
                        value="PICKUP"
                        checked={deliveryMethod === "PICKUP"}
                        onChange={() => setDeliveryMethod("PICKUP")}
                        className="h-4 w-4"
                      />
                      <div>
                        <p className="font-semibold text-[#244367]">Pickup</p>
                        <p className="text-xs text-[#5d7497]">Collect directly from the seller</p>
                      </div>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#244367]">
                    <MapPin size={16} />
                    Street Address {deliveryMethod === "DELIVERY" ? "*" : ""}
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required={deliveryMethod === "DELIVERY"}
                    className="w-full rounded-lg border border-[#cdd8e7] px-4 py-3 focus:border-[#1B3A6B] focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/20"
                    placeholder="123 Main Street"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-[#244367]">
                      City {deliveryMethod === "DELIVERY" ? "*" : ""}
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      required={deliveryMethod === "DELIVERY"}
                      className="w-full rounded-lg border border-[#cdd8e7] px-4 py-3 focus:border-[#1B3A6B] focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/20"
                      placeholder="Johannesburg"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-[#244367]">
                      Province {deliveryMethod === "DELIVERY" ? "*" : ""}
                    </label>
                    <select
                      aria-label="Province"
                      value={province}
                      onChange={(e) => setProvince(e.target.value)}
                      required={deliveryMethod === "DELIVERY"}
                      className="w-full rounded-lg border border-[#cdd8e7] px-4 py-3 focus:border-[#1B3A6B] focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/20"
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
                    <label className="mb-2 block text-sm font-semibold text-[#244367]">
                      Postal Code {deliveryMethod === "DELIVERY" ? "*" : ""}
                    </label>
                    <input
                      type="text"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      required={deliveryMethod === "DELIVERY"}
                      className="w-full rounded-lg border border-[#cdd8e7] px-4 py-3 focus:border-[#1B3A6B] focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/20"
                      placeholder="2000"
                    />
                  </div>
                </div>
              </form>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setStep(1)}
                className="flex-1 rounded-lg border-2 border-[#1B3A6B] py-3 text-center font-bold text-[#1B3A6B] transition hover:bg-[#1B3A6B] hover:text-white"
              >
                Back to Cart
              </button>
              <button
                onClick={() => {
                  if (
                    !fullName ||
                    !email ||
                    !phone ||
                    (deliveryMethod === "DELIVERY" &&
                      (!address || !city || !province || !postalCode))
                  ) {
                    setError("Please fill in all required fields");
                    return;
                  }
                  setError("");
                  setStep(3);
                }}
                className="flex-1 rounded-lg bg-[#2E7D32] py-3 font-bold text-white transition hover:bg-[#1d5e20]"
              >
                Continue to Payment
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Payment */}
        {step === 3 && (
          <div className="mx-auto max-w-2xl space-y-6">
            <h2 className="text-2xl font-black text-[#1B3A6B]">Complete Payment</h2>

            {/* Order Summary */}
            <div className="rounded-2xl border border-[#e4ebf5] bg-white p-6 shadow-lg">
              <h3 className="mb-4 font-bold text-[#244367]">Order Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#5d7497]">Items ({totalItems}):</span>
                  <span className="font-semibold text-[#244367]">
                    R{(totalCents / 100).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5d7497]">Shipping:</span>
                  <span className="font-semibold text-[#244367]">TBD</span>
                </div>
                <div className="flex justify-between border-t border-[#e4ebf5] pt-2 text-xl">
                  <span className="font-black text-[#1B3A6B]">Total:</span>
                  <span className="font-black text-[#2E7D32]">
                    R{(totalCents / 100).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="rounded-2xl border border-[#e4ebf5] bg-white p-8 shadow-lg">
              <div className="mb-4 flex items-center gap-3">
                <CreditCard size={32} className="text-[#2E7D32]" />
                <div>
                  <h3 className="font-bold text-[#244367]">Secure Payment with PayFast</h3>
                  <p className="text-sm text-[#5d7497]">
                    Your payment information is encrypted and secure
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmitOrder}>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-lg bg-[#2E7D32] py-4 font-bold uppercase tracking-wide text-white shadow-lg transition hover:bg-[#1d5e20] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? "Processing..." : `Pay R${(totalCents / 100).toFixed(2)} with PayFast`}
                </button>
              </form>

              <p className="mt-4 text-center text-xs text-[#5d7497]">
                By completing this purchase, you agree to HerdFlow's Terms of Service and Privacy
                Policy.
              </p>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setStep(2)}
                className="flex-1 rounded-lg border-2 border-[#1B3A6B] py-3 text-center font-bold text-[#1B3A6B] transition hover:bg-[#1B3A6B] hover:text-white"
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
