export type DomainArea = "store" | "auction";

export type StoreProduct = {
  id: string;
  slug: string;
  name: string;
  priceCents: number;
  stockOnHand: number;
};

export type AuctionLot = {
  id: string;
  lotNumber: string;
  title: string;
  reserveCents: number;
  status: "DRAFT" | "LIVE" | "CLOSED";
};
