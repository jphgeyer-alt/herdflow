const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const PLANS = [
  {
    key: "STARTER",
    displayName: "Starter",
    monthlyPrice: 0,
    annualPrice: 0,
    maxAnimals: 10,
    maxUsers: 1,
    maxFarms: 1,
    features: ["Herd tracking (10 animals)", "1 user", "Offline sync", "Community support"],
    isPopular: false,
    sortOrder: 1,
  },
  {
    key: "ESSENTIAL",
    displayName: "Essential",
    monthlyPrice: 149,
    annualPrice: 1490,
    maxAnimals: 100,
    maxUsers: 3,
    maxFarms: 1,
    features: ["Herd tracking (100 animals)", "3 users", "Health records", "Camp management"],
    isPopular: false,
    sortOrder: 2,
  },
  {
    key: "PROFESSIONAL",
    displayName: "Professional",
    monthlyPrice: 299,
    annualPrice: 2990,
    maxAnimals: null,
    maxUsers: 10,
    maxFarms: 1,
    features: [
      "Unlimited animals",
      "10 users",
      "Full health & breeding records",
      "Finance & reports",
      "Priority support",
    ],
    isPopular: true,
    sortOrder: 3,
  },
  {
    key: "ENTERPRISE",
    displayName: "Enterprise",
    monthlyPrice: 499,
    annualPrice: 4990,
    maxAnimals: null,
    maxUsers: null,
    maxFarms: 5,
    features: ["Unlimited animals & users", "Up to 5 farms", "Advanced reporting", "Dedicated support"],
    isPopular: false,
    sortOrder: 4,
  },
  {
    key: "COOP",
    displayName: "Co-op",
    monthlyPrice: 2500,
    annualPrice: 25000,
    maxAnimals: null,
    maxUsers: null,
    maxFarms: 20,
    features: ["Unlimited animals & users", "Up to 20 farms", "Co-op billing", "Onboarding support"],
    isPopular: false,
    sortOrder: 5,
  },
];

const FEES = [
  { feeKey: "listing_basic", name: "Basic Listing Fee", amount: 49, feeType: "FLAT" },
  { feeKey: "listing_featured", name: "Featured Listing Fee", amount: 149, feeType: "FLAT" },
  { feeKey: "verified_seller", name: "Verified Seller Fee", amount: 299, feeType: "FLAT" },
  { feeKey: "vendor_registration", name: "Vendor Registration Fee", amount: 500, feeType: "FLAT" },
  { feeKey: "vendor_plan_basic", name: "Vendor Storefront — Basic", amount: 299, feeType: "FLAT" },
  { feeKey: "vendor_plan_unlimited", name: "Vendor Storefront — Unlimited", amount: 499, feeType: "FLAT" },
  { feeKey: "vendor_commission", name: "Vendor Sale Commission", amount: 5, feeType: "PERCENT" },
  { feeKey: "transport_booking", name: "Transport Booking Fee", amount: 195, feeType: "FLAT" },
  { feeKey: "transport_partner_fee", name: "Transport Partner Commission", amount: 4, feeType: "PERCENT" },
  { feeKey: "sponsor_founding", name: "Founding Sponsor", amount: 1950, feeType: "FLAT" },
  { feeKey: "sponsor_starter", name: "Starter Sponsor Package", amount: 2500, feeType: "FLAT" },
  { feeKey: "sponsor_growth", name: "Growth Sponsor Package", amount: 5500, feeType: "FLAT" },
  { feeKey: "sponsor_premium", name: "Premium Sponsor Package", amount: 12000, feeType: "FLAT" },
];

async function seed() {
  for (const plan of PLANS) {
    await prisma.subscriptionPlan.upsert({
      where: { key: plan.key },
      update: { ...plan, features: plan.features },
      create: { ...plan, features: plan.features },
    });
  }
  console.log("Seeded", PLANS.length, "subscription plans");

  for (const fee of FEES) {
    await prisma.platformFee.upsert({
      where: { feeKey: fee.feeKey },
      update: fee,
      create: fee,
    });
  }
  console.log("Seeded", FEES.length, "platform fees");

  await prisma.$disconnect();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
