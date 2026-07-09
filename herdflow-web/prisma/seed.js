const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

function toSlug(name) {
  return name.toLowerCase().replace(/\s+/g, "-");
}

async function seed() {
  const cats = [
    "Cattle",
    "Sheep",
    "Goats",
    "Pigs",
    "Horses",
    "Poultry",
    "Livestock Feed",
    "Equipment",
    "Supplements",
    "Other",
  ];
  for (const name of cats) {
    const slug = toSlug(name);
    await prisma.category.upsert({
      where: { slug },
      update: {},
      create: { name, slug, kind: "BOTH" },
    });
  }
  console.log("Seeded", cats.length, "categories");
  await prisma.$disconnect();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
