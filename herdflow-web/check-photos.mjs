import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

const listings = await p.listing.findMany({ select: { title: true, photos: true }, take: 5, orderBy: { createdAt: 'desc' } });
const products = await p.product.findMany({ select: { name: true, photos: true }, take: 5, orderBy: { createdAt: 'desc' } });

console.log('=== LIVESTOCK ===');
listings.forEach(x => {
  const ph = Array.isArray(x.photos) ? x.photos : [];
  const first = ph[0] ? String(ph[0]).substring(0, 100) : 'NO PHOTOS';
  console.log(x.title, '->', first);
});

console.log('\n=== PRODUCTS ===');
products.forEach(x => {
  const ph = Array.isArray(x.photos) ? x.photos : [];
  const first = ph[0] ? String(ph[0]).substring(0, 100) : 'NO PHOTOS';
  console.log(x.name, '->', first);
});

await p.$disconnect();
