export type ListingCategory = "Cattle" | "Sheep" | "Goats" | "Pigs" | "Farm Products" | "Equipment";

export type MarketplaceListing = {
  slug: string;
  title: string;
  kind: "Livestock" | "Product";
  category: ListingCategory;
  region: string;
  price: string;
  seller: string;
  sellerPhone: string;
  sellerEmail: string;
  photos: string[];
  description: string;
  breed?: string;
  weight?: string;
};

export const listingData: MarketplaceListing[] = [
  {
    slug: "bonsmara-heifers-nw",
    title: "Bonsmara Heifers",
    kind: "Livestock",
    category: "Cattle",
    region: "North West",
    price: "R 18,500",
    breed: "Bonsmara",
    weight: "420kg",
    seller: "Molapo Farms",
    sellerPhone: "+27 82 100 2200",
    sellerEmail: "sales@molapofarms.co.za",
    photos: ["photo-1", "photo-2", "photo-3"],
    description:
      "Strong, vaccinated Bonsmara heifers raised on mixed pasture. Seller can assist with loading and local coordination.",
  },
  {
    slug: "dorper-ewes-fs",
    title: "Dorper Ewes",
    kind: "Livestock",
    category: "Sheep",
    region: "Free State",
    price: "R 2,800",
    breed: "Dorper",
    weight: "68kg",
    seller: "Kopano Agri",
    sellerPhone: "+27 79 444 1001",
    sellerEmail: "hello@kopanoagri.co.za",
    photos: ["photo-1", "photo-2"],
    description:
      "Healthy ewes from rotational grazing system. Bulk pricing available for larger herd purchases.",
  },
  {
    slug: "boer-goat-pair-lp",
    title: "Boer Goat Breeding Pair",
    kind: "Livestock",
    category: "Goats",
    region: "Limpopo",
    price: "R 6,900",
    breed: "Boer Goat",
    weight: "95kg pair",
    seller: "Pitse Holdings",
    sellerPhone: "+27 83 300 5600",
    sellerEmail: "trade@pitseholdings.co.za",
    photos: ["photo-1", "photo-2"],
    description:
      "Breeding pair from disease-monitored line. Veterinary records available on request.",
  },
  {
    slug: "large-white-pigs-nw",
    title: "Large White Growers",
    kind: "Livestock",
    category: "Pigs",
    region: "North West",
    price: "R 3,400",
    breed: "Large White",
    weight: "90kg",
    seller: "Tholo Piggery",
    sellerPhone: "+27 66 422 1200",
    sellerEmail: "orders@tholopiggery.co.za",
    photos: ["photo-1", "photo-2"],
    description: "Consistent feed conversion animals from controlled environment units.",
  },
  {
    slug: "premium-cattle-feed-50kg",
    title: "Premium Cattle Feed 50kg",
    kind: "Product",
    category: "Farm Products",
    region: "North West",
    price: "R 465",
    seller: "HerdFlow Supply",
    sellerPhone: "+27 87 100 4550",
    sellerEmail: "supply@herdflow.co.za",
    photos: ["photo-1", "photo-2", "photo-3", "photo-4"],
    description: "Balanced protein and mineral feed blend for cattle growth and recovery.",
  },
  {
    slug: "solar-trough-pump",
    title: "Solar Trough Pump",
    kind: "Product",
    category: "Equipment",
    region: "Gauteng",
    price: "R 2,990",
    seller: "AgriTech SA",
    sellerPhone: "+27 12 555 2201",
    sellerEmail: "sales@agritechsa.co.za",
    photos: ["photo-1", "photo-2", "photo-3"],
    description: "Low-maintenance solar pump for remote livestock watering points.",
  },
  {
    slug: "dipping-chemical-kit",
    title: "Dipping Chemical Kit",
    kind: "Product",
    category: "Farm Products",
    region: "Mpumalanga",
    price: "R 780",
    seller: "FieldGuard",
    sellerPhone: "+27 13 444 7780",
    sellerEmail: "support@fieldguard.co.za",
    photos: ["photo-1", "photo-2"],
    description: "Ready-to-use livestock dipping treatment kit with clear dosage instructions.",
  },
  {
    slug: "portable-loading-ramp",
    title: "Portable Loading Ramp",
    kind: "Product",
    category: "Equipment",
    region: "Northern Cape",
    price: "R 6,250",
    seller: "StockMove Engineering",
    sellerPhone: "+27 53 100 9888",
    sellerEmail: "team@stockmove.co.za",
    photos: ["photo-1", "photo-2", "photo-3"],
    description: "Heavy-duty galvanized loading ramp suitable for cattle and sheep movement.",
  },
];
