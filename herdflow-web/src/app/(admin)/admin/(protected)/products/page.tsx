import { redirect } from "next/navigation";

// Listings and Products were two separate ~1500-line admin implementations
// managing overlapping data; they're now consolidated onto one manager at
// /admin/listings (?kind=product switches views). This route stays as a
// redirect so any existing bookmarks/links keep working.
export default function AdminProductsRedirectPage() {
  redirect("/admin/listings?kind=product");
}
