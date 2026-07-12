const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const LEAD_CATEGORIES = [
  {
    key: "AGRI_FINANCE",
    displayName: "Agri Finance",
    description: "Working capital, production loans, and asset finance for your farming operation.",
    partnerName: "FundingHub",
    partnerEmail: "leads@fundinghub.co.za",
    externalUrl: "https://fundinghub.co.za/apply?ref=herdflow",
    useExternalRedirect: true,
    commissionNote: "2% of approved loan amount",
  },
  {
    key: "EQUIPMENT_FINANCE",
    displayName: "Equipment Finance",
    description: "Finance tractors, implements, and farm machinery over flexible terms.",
    partnerName: "FundingHub",
    partnerEmail: "leads@fundinghub.co.za",
    externalUrl: "https://fundinghub.co.za/equipment?ref=herdflow",
    useExternalRedirect: true,
    commissionNote: "2% of approved loan amount",
  },
  {
    key: "LIVESTOCK_INSURANCE",
    displayName: "Livestock Insurance",
    description: "Cover your herd against disease, theft, and death — get quotes from licensed insurers.",
    partnerName: "broker TBC",
    partnerEmail: "leads@herdflow.co.za",
    externalUrl: null,
    useExternalRedirect: false,
    commissionNote: "Commission TBC once broker is onboarded",
  },
  {
    key: "ASSET_INSURANCE",
    displayName: "Farm Asset Insurance",
    description: "Protect vehicles, equipment, and structures on your farm.",
    partnerName: "broker TBC",
    partnerEmail: "leads@herdflow.co.za",
    externalUrl: null,
    useExternalRedirect: false,
    commissionNote: "Commission TBC once broker is onboarded",
  },
];

const FEES = [
  { feeKey: "classified_equipment", name: "Classifieds — Equipment", amount: 99, feeType: "FLAT" },
  { feeKey: "classified_equipment_featured", name: "Classifieds — Equipment (Featured)", amount: 199, feeType: "FLAT" },
  { feeKey: "classified_job", name: "Classifieds — Farm Job", amount: 149, feeType: "FLAT" },
  { feeKey: "classified_grazing", name: "Classifieds — Grazing & Land", amount: 199, feeType: "FLAT" },
  { feeKey: "classified_wanted", name: "Classifieds — Wanted", amount: 49, feeType: "FLAT" },
  { feeKey: "directory_standard", name: "Services Directory — Standard", amount: 149, feeType: "FLAT" },
  { feeKey: "directory_premium", name: "Services Directory — Premium", amount: 299, feeType: "FLAT" },
  { feeKey: "email_sponsor_slot", name: "Weekly Email/Push Sponsor Slot", amount: 4500, feeType: "FLAT" },
];

const DIGITAL_PRODUCTS = [
  {
    title: "Livestock Record Book Template",
    slug: "livestock-record-book-template",
    description: "A ready-to-print record book for tracking animal health, breeding, and weight history.",
    price: 149,
    fileKey: "placeholder/livestock-record-book.pdf",
    fileName: "livestock-record-book.pdf",
    fileType: "application/pdf",
    category: "Record Books",
  },
  {
    title: "Farm Labour Contract Template",
    slug: "farm-labour-contract-template",
    description: "A South African labour law-aligned seasonal/permanent farm worker contract template.",
    price: 199,
    fileKey: "placeholder/farm-labour-contract.pdf",
    fileName: "farm-labour-contract.pdf",
    fileType: "application/pdf",
    category: "Contracts",
  },
  {
    title: "Camp Rotation Planning Guide",
    slug: "camp-rotation-planning-guide",
    description: "A practical guide to planning rotational grazing across your camps for the season.",
    price: 99,
    fileKey: "placeholder/camp-rotation-guide.pdf",
    fileName: "camp-rotation-guide.pdf",
    fileType: "application/pdf",
    category: "Guides",
  },
];

async function seed() {
  for (const cat of LEAD_CATEGORIES) {
    await prisma.leadCategory.upsert({
      where: { key: cat.key },
      update: cat,
      create: cat,
    });
  }
  console.log("Seeded", LEAD_CATEGORIES.length, "lead categories");

  for (const fee of FEES) {
    await prisma.platformFee.upsert({
      where: { feeKey: fee.feeKey },
      update: fee,
      create: fee,
    });
  }
  console.log("Seeded", FEES.length, "platform fees");

  for (const product of DIGITAL_PRODUCTS) {
    await prisma.digitalProduct.upsert({
      where: { slug: product.slug },
      update: { ...product, isActive: false },
      create: { ...product, isActive: false },
    });
  }
  console.log("Seeded", DIGITAL_PRODUCTS.length, "digital products (inactive placeholders)");

  await prisma.$disconnect();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
