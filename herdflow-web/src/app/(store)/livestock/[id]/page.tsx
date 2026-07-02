import { redirect } from "next/navigation";

type Props = { params: Promise<{ id: string }> };

export default async function LivestockDetailRedirectPage({ params }: Props) {
  const { id } = await params;
  redirect(`/listings/${id}`);
}
