type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;

  return (
    <main className="space-y-3">
      <h1 className="text-3xl font-bold">Product: {slug}</h1>
      <p className="text-neutral-700">Product details placeholder.</p>
    </main>
  );
}
