import { prisma } from "@/lib/prisma";

export type CartLine = {
  slug: string;
  quantity: number;
};

export type CartItem = {
  product: {
    id: string;
    slug: string;
    title: string;
    category: string;
  };
  quantity: number;
  unitPriceCents: number;
  unitPrice: number;
  lineTotal: number;
  lineTotalCents: number;
};

function parseIntSafe(value: string) {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function parseCartParam(value?: string | null): CartLine[] {
  if (!value) {
    return [];
  }

  const merged = new Map<string, number>();

  for (const token of value.split(",")) {
    const [rawSlug, rawQty] = token.split(":");
    const slug = (rawSlug || "").trim();
    const quantity = Math.max(0, parseIntSafe((rawQty || "1").trim()) || 1);
    if (!slug || quantity === 0) {
      continue;
    }

    const current = merged.get(slug) || 0;
    merged.set(slug, current + quantity);
  }

  return Array.from(merged.entries()).map(([slug, quantity]) => ({ slug, quantity }));
}

export function serializeCartParam(lines: CartLine[]) {
  return lines
    .filter((line) => line.quantity > 0)
    .map((line) => `${line.slug}:${line.quantity}`)
    .join(",");
}

export function addToCart(lines: CartLine[], slug: string, quantity = 1) {
  const qty = Number.isFinite(quantity) ? Math.max(1, Math.floor(quantity)) : 1;

  const next = [...lines];
  const index = next.findIndex((line) => line.slug === slug);
  if (index === -1) {
    next.push({ slug, quantity: qty });
  } else {
    next[index] = { slug, quantity: next[index].quantity + qty };
  }
  return next;
}

export function updateCartQuantity(lines: CartLine[], slug: string, delta: number) {
  const next = lines
    .map((line) => {
      if (line.slug !== slug) {
        return line;
      }

      return {
        ...line,
        quantity: line.quantity + delta,
      };
    })
    .filter((line) => line.quantity > 0);

  return next;
}

export function removeFromCart(lines: CartLine[], slug: string) {
  return lines.filter((line) => line.slug !== slug);
}

export async function buildCartItems(lines: CartLine[]) {
  const items: CartItem[] = [];

  const slugs = lines.map((line) => line.slug);
  if (slugs.length === 0) {
    return items;
  }

  const products = await prisma.product.findMany({
    where: {
      slug: { in: slugs },
      status: { in: ["ACTIVE", "OUT_OF_STOCK"] },
    },
    include: {
      category: { select: { name: true } },
    },
  });

  const productMap = new Map(products.map((product) => [product.slug, product]));

  for (const line of lines) {
    const product = productMap.get(line.slug);
    if (!product) {
      continue;
    }

    const unitPriceCents = product.priceCents;
    const lineTotalCents = unitPriceCents * line.quantity;
    items.push({
      product: {
        id: product.id,
        slug: product.slug,
        title: product.name,
        category: product.category.name,
      },
      quantity: line.quantity,
      unitPriceCents,
      unitPrice: unitPriceCents / 100,
      lineTotal: lineTotalCents / 100,
      lineTotalCents,
    });
  }

  return items;
}

export function calculateCartTotals(items: CartItem[]) {
  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  return {
    subtotal,
    totalItems: items.reduce((sum, item) => sum + item.quantity, 0),
  };
}
