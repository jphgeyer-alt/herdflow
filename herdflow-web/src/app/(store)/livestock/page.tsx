import { redirect } from "next/navigation";

export default async function LivestockRedirectPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string>>;
}) {
  const params = searchParams ? await searchParams : {};
  const query = new URLSearchParams(params).toString();
  redirect(query ? `/listings?${query}` : "/listings");
}
