import Link from "next/link";
import { CheckCircle2, Package, ArrowRight } from "lucide-react";

type OrderPageProps = {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<{ status?: string }>;
};

export default async function OrderPage({ params, searchParams }: OrderPageProps) {
  const { orderId } = await params;
  const { status } = await searchParams;

  return (
    <div className="min-h-screen bg-[#f5f4ef] flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-2xl shadow-2xl border border-[#e4ebf5] p-12 text-center max-w-2xl">
        {status === "pending" ? (
          <>
            <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 size={48} className="text-[#2E7D32]" />
            </div>
            <h1 className="text-3xl font-black text-[#1B3A6B] mb-4">Order Placed Successfully!</h1>
            <p className="text-[#5d7497] mb-2">Thank you for your order.</p>
            <p className="text-sm text-[#5d7497] mb-8">Order ID: <span className="font-mono font-semibold">{orderId}</span></p>

            <div className="bg-[#f5f8fd] rounded-xl p-6 mb-8">
              <div className="flex items-start gap-4 text-left">
                <Package size={32} className="text-[#1B3A6B] flex-shrink-0 mt-1" />
                <div>
                  <h2 className="font-bold text-[#244367] mb-2">What happens next?</h2>
                  <ul className="text-sm text-[#5d7497] space-y-2">
                    <li className="flex items-start gap-2">
                      <ArrowRight size={16} className="mt-1 flex-shrink-0" />
                      You'll receive an email confirmation shortly
                    </li>
                    <li className="flex items-start gap-2">
                      <ArrowRight size={16} className="mt-1 flex-shrink-0" />
                      Our team will prepare your order for shipment
                    </li>
                    <li className="flex items-start gap-2">
                      <ArrowRight size={16} className="mt-1 flex-shrink-0" />
                      You'll be notified when your order ships
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/dashboard/buyer"
                className="px-8 py-3 bg-[#2E7D32] hover:bg-[#1d5e20] text-white font-bold rounded-lg transition"
              >
                View My Orders
              </Link>
              <Link
                href="/shop"
                className="px-8 py-3 border-2 border-[#1B3A6B] text-[#1B3A6B] hover:bg-[#1B3A6B] hover:text-white font-bold rounded-lg transition"
              >
                Continue Shopping
              </Link>
            </div>
          </>
        ) : (
          <>
            <div className="w-20 h-20 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-6">
              <Package size={48} className="text-[#1B3A6B]" />
            </div>
            <h1 className="text-3xl font-black text-[#1B3A6B] mb-4">Order Details</h1>
            <p className="text-sm text-[#5d7497] mb-8">Order ID: <span className="font-mono font-semibold">{orderId}</span></p>
            <Link
              href="/shop"
              className="inline-block px-8 py-3 bg-[#2E7D32] hover:bg-[#1d5e20] text-white font-bold rounded-lg transition"
            >
              Back to Shop
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
