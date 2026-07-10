export const PAGE_SIZE = 25;

// Cap for the grouped (category/seller) views, which render every matching
// row unpaginated — the "All" flat view is the one with real skip/take
// pagination. This just guards against a pathological all-time unfiltered
// load; CSV export uses a separate, higher cap since it's an explicit
// admin-triggered action rather than a page render.
export const GROUPED_VIEW_CAP = 500;
export const EXPORT_CAP = 10000;

export const REGIONS = [
  "North West",
  "Free State",
  "Limpopo",
  "Gauteng",
  "Mpumalanga",
  "Northern Cape",
  "KwaZulu-Natal",
  "Western Cape",
  "Eastern Cape",
];

export const PROVINCE_FILTER_OPTIONS: [string, string][] = [
  ["all", "All Provinces"],
  ...REGIONS.map((r): [string, string] => [r, r]),
];

export const REMOVE_REASONS = [
  "Seller requested removal",
  "Listing rules violation",
  "Sold outside platform",
  "Duplicate listing",
  "Fraudulent listing",
  "Other",
];

export const STATIC_CATEGORIES = [
  "Cattle",
  "Sheep",
  "Goats",
  "Pigs",
  "Horses",
  "Poultry",
  "Livestock Feed",
  "Equipment",
  "Supplements",
  "Veterinary Supplies",
  "Other",
];

export const LISTING_STATUSES = ["ACTIVE", "DRAFT", "SOLD", "ARCHIVED"];
export const PRODUCT_STATUSES = ["ACTIVE", "DRAFT", "OUT_OF_STOCK", "ARCHIVED"];

export const SORT_OPTIONS: [string, string][] = [
  ["newest", "Newest First"],
  ["oldest", "Oldest First"],
  ["priceHigh", "Price High–Low"],
  ["priceLow", "Price Low–High"],
  ["seller", "Seller A–Z"],
];
