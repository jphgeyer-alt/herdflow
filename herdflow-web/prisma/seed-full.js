const { PrismaClient } = require("@prisma/client");
const crypto = require("crypto");
const prisma = new PrismaClient();

function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

function toSlug(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

async function seed() {
  console.log("🌱 Seeding HerdFlow test data...");

  // 1. Seed admin user
  await prisma.user.upsert({
    where: { email: "admin@herdflow.co.za" },
    update: {},
    create: {
      email: "admin@herdflow.co.za",
      fullName: "Admin User",
      role: "ADMIN",
      passwordHash: hashPassword("admin1234"),
    },
  });
  console.log("✓ Admin user created/updated");

  // 2. Seed seller users and profiles
  const sellers = [
    {
      name: "Thabo's Premium Cattle",
      region: "Gauteng",
      location: "Pretoria",
      phone: "+27101234567",
      nid: "9101015801080",
    },
    {
      name: "KwaZulu Livestock Co",
      region: "KwaZulu-Natal",
      location: "Durban",
      phone: "+27312345678",
      nid: "8905045801081",
    },
    {
      name: "Eastern Cape Farming",
      region: "Eastern Cape",
      location: "Port Elizabeth",
      phone: "+27413456789",
      nid: "9203125801082",
    },
  ];

  const sellerIds = [];
  for (const seller of sellers) {
    const user = await prisma.user.upsert({
      where: { email: `seller-${seller.name.toLowerCase().replace(/\s+/g, "-")}@herdflow.co.za` },
      update: {},
      create: {
        email: `seller-${seller.name.toLowerCase().replace(/\s+/g, "-")}@herdflow.co.za`,
        fullName: seller.name,
        role: "CUSTOMER",
        passwordHash: hashPassword("seller123"),
      },
    });

    const sellerProfile = await prisma.seller.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        farmName: seller.name,
        location: seller.location,
        region: seller.region,
        contactPhone: seller.phone,
        nationalIdNumber: seller.nid,
        idDocumentUrl: "https://example.com/id.pdf",
        status: "APPROVED",
      },
    });
    sellerIds.push(sellerProfile.id);
  }
  console.log(`✓ Created ${sellerIds.length} test sellers`);

  // 3. Seed products
  // Get first few categories to use
  const categories = await prisma.category.findMany({ take: 3 });

  const products = [
    {
      name: "Grass-Fed Beef (10kg)",
      price: 189900,
      sellerId: sellerIds[0],
      catId: categories[0].id,
    },
    { name: "Boerbok Meat (5kg)", price: 89900, sellerId: sellerIds[1], catId: categories[0].id },
    {
      name: "Free-Range Chicken (2kg)",
      price: 34900,
      sellerId: sellerIds[2],
      catId: categories[0].id,
    },
    {
      name: "Organic Sheep Meat (8kg)",
      price: 139900,
      sellerId: sellerIds[0],
      catId: categories[0].id,
    },
    { name: "Premium Milk 1L", price: 8900, sellerId: sellerIds[1], catId: categories[1].id },
    {
      name: "Livestock Feed (50kg)",
      price: 45900,
      sellerId: sellerIds[2],
      catId: categories[1].id,
    },
    { name: "Dairy Butter (500g)", price: 12900, sellerId: sellerIds[0], catId: categories[1].id },
    { name: "Eggs (30pcs)", price: 7900, sellerId: sellerIds[1], catId: categories[2].id },
    { name: "Cattle Supplements", price: 24900, sellerId: sellerIds[2], catId: categories[2].id },
    {
      name: "Veterinary Antibiotics",
      price: 19900,
      sellerId: sellerIds[0],
      catId: categories[2].id,
    },
  ];

  const productIds = [];
  for (const product of products) {
    const p = await prisma.product.create({
      data: {
        name: product.name,
        slug: `${toSlug(product.name)}-${Date.now() % 10000}`,
        description: `Premium ${product.name} from our farm`,
        priceCents: product.price,
        sellerId: product.sellerId,
        categoryId: product.catId,
        status: "ACTIVE",
      },
    });
    productIds.push(p.id);
  }
  console.log(`✓ Created ${productIds.length} test products`);

  // 4. Seed customer and orders
  const customerUser = await prisma.user.upsert({
    where: { email: "customer@herdflow.co.za" },
    update: {},
    create: {
      email: "customer@herdflow.co.za",
      fullName: "John Doe",
      phone: "+27123456789",
      role: "CUSTOMER",
      passwordHash: hashPassword("customer123"),
    },
  });

  const orders = [
    { items: [[productIds[0], 2]] }, // 2x Grass-Fed Beef
    {
      items: [
        [productIds[1], 1],
        [productIds[2], 3],
      ],
    }, // 1x Boerbok + 3x Chicken
    { items: [[productIds[3], 1]] }, // 1x Sheep Meat
    {
      items: [
        [productIds[4], 6],
        [productIds[7], 2],
      ],
    }, // 6x Milk + 2x Eggs
    {
      items: [
        [productIds[5], 1],
        [productIds[8], 1],
      ],
    }, // Feed + Supplements
  ];

  for (let i = 0; i < orders.length; i++) {
    let totalCents = 0;
    const itemsData = [];

    for (const [productId, quantity] of orders[i].items) {
      const product = await prisma.product.findUnique({ where: { id: productId } });
      const lineTotalCents = product.priceCents * quantity;
      totalCents += lineTotalCents;
      itemsData.push({
        productId,
        quantity,
        unitPriceCents: product.priceCents,
        lineTotalCents,
      });
    }

    await prisma.order.create({
      data: {
        orderNumber: `ORD-${Date.now()}-${i}`,
        user: { connect: { id: customerUser.id } },
        totalCents,
        status: i < 3 ? "PAID" : "PENDING", // First 3 are paid (for commission calcs)
        items: {
          create: itemsData,
        },
      },
    });
  }
  console.log("✓ Created 5 test orders");

  // 5. Seed site config (banner content)
  const bannerConfig = [
    { key: "banner_heading", value: "Premium South African Livestock" },
    {
      key: "banner_subheading",
      value: "Fresh, grass-fed meat and dairy products delivered to your door",
    },
    {
      key: "banner_image_url",
      value: "https://images.unsplash.com/photo-1560493676-04071c5f467b?w=1200&h=400&fit=crop",
    },
    { key: "banner_cta_label", value: "Shop Now" },
    { key: "banner_cta_url", value: "/shop" },
  ];

  for (const config of bannerConfig) {
    await prisma.siteConfig.upsert({
      where: { key: config.key },
      update: { value: config.value },
      create: { key: config.key, value: config.value },
    });
  }
  console.log("✓ Banner content configured");

  // 6. Seed logistics partner
  const logisticsUser = await prisma.user.upsert({
    where: { email: "logistics@herdflow.co.za" },
    update: {},
    create: {
      email: "logistics@herdflow.co.za",
      fullName: "Swift Delivery Co",
      role: "CUSTOMER",
      passwordHash: hashPassword("logistics123"),
    },
  });

  await prisma.logisticsPartner.upsert({
    where: { userId: logisticsUser.id },
    update: {},
    create: {
      userId: logisticsUser.id,
      companyName: "Swift Delivery Co",
      fleetSize: 12,
      routesCovered: "Gauteng, Limpopo, North West",
      vehicleDocumentsUrl: "https://example.com/vehicle-docs.pdf",
      status: "APPROVED",
    },
  });
  console.log("✓ Logistics partner seeded");

  console.log("\n✅ Seeding complete!");
  console.log("\nTest Credentials:");
  console.log("  Admin: admin@herdflow.co.za / admin1234");
  console.log("  Seller: seller-thabos-premium-cattle@herdflow.co.za / seller123");
  console.log("  Customer: customer@herdflow.co.za / customer123");
  console.log("  Logistics: logistics@herdflow.co.za / logistics123");

  await prisma.$disconnect();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
