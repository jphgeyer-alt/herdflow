// Shared types for the consolidated Listings + Products admin manager.
// One `Item` shape represents either a livestock Listing or a shop Product —
// the two models overlap ~90% (price, region, photos, status, feature flag,
// soft-delete) so the UI treats them uniformly and only branches on `kind`
// for the handful of fields that differ (breed/weight/age vs stock).

export type Kind = "listing" | "product";

export type SellerRef = {
  id: string;
  farmName: string;
  location: string;
  status: string;
  user: { email: string; phone: string | null };
};

export type Item = {
  id: string;
  kind: Kind;
  title: string;
  slug: string;
  breed?: string | null;
  weightKg?: number | null;
  ageMonths?: number | null;
  stockOnHand?: number | null;
  region: string | null;
  priceCents: number;
  photos: string[];
  status: string;
  isFeatured: boolean;
  isDeleted: boolean;
  deletedAt: string | null;
  deleteReason: string | null;
  createdAt: string;
  category: { id: string; name: string };
  seller: SellerRef | null;
};

export type ViewMode = "category" | "seller" | "all";
export type SortKey = "newest" | "oldest" | "priceHigh" | "priceLow" | "seller";

export type Filters = {
  kind: Kind;
  q: string;
  categoryId: string;
  status: string;
  region: string;
  sellerId: string;
  sort: SortKey;
  removed: boolean;
  view: ViewMode;
  page: number;
};
