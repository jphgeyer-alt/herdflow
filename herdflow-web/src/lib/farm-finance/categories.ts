// herdflow-web/src/lib/farm-finance/categories.ts
// Kept in exact sync with the mobile app's INCOME_CATS/EXPENSE_CATS
// (herdflow-app/src/screens/finance/AddTransactionScreen.tsx) -- same ids
// and labels, since both platforms write into the same `category` column
// and a transaction added on one platform must show a sensible category
// label on the other.
export const INCOME_CATS = [
  { id: "livestock_sale", label: "Livestock Sale" },
  { id: "auction_sale", label: "Auction Sale" },
  { id: "breeding_fee", label: "Breeding Fee" },
  { id: "insurance", label: "Insurance Claim" },
  { id: "grant", label: "Gov. Grant" },
  { id: "other_income", label: "Other Income" },
];

export const EXPENSE_CATS = [
  { id: "livestock_purchase", label: "Livestock Purchase" },
  { id: "feed", label: "Feed" },
  { id: "veterinary", label: "Veterinary" },
  { id: "medication", label: "Medication" },
  { id: "breeding", label: "Breeding" },
  { id: "equipment", label: "Equipment" },
  { id: "fuel", label: "Fuel" },
  { id: "labour", label: "Labour" },
  { id: "transport", label: "Transport" },
  { id: "maintenance", label: "Maintenance" },
  { id: "insurance", label: "Insurance" },
  { id: "levy", label: "Levy / Tax" },
  { id: "other", label: "Other" },
];

export function categoryLabel(id: string): string {
  return [...INCOME_CATS, ...EXPENSE_CATS].find((c) => c.id === id)?.label ?? id;
}

// G3: translation-key lookup for the same ids above -- category ids are
// stored in the database and shared with the mobile app, so only the
// display label is localized (finance.category_<id> in each locale file).
export function categoryLabelKey(id: string): string {
  return `category_${id}`;
}
