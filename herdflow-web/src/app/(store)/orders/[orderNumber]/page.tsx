type OrderPageProps = {
  params: Promise<{ orderNumber: string }>;
};

export default async function OrderPage({ params }: OrderPageProps) {
  const { orderNumber } = await params;

  return (
    <main className="space-y-3">
      <h1 className="text-3xl font-bold">Order: {orderNumber}</h1>
      <p className="text-neutral-700">Customer order tracking placeholder.</p>
    </main>
  );
}
