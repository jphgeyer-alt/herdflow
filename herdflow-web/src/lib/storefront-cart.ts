import { listingData, type MarketplaceListing } from "@/lib/marketplace-data";

export type CartLine = {
  slug: string;
  quantity: number;
};

export type CartItem = {
  product: MarketplaceListing;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

function parseIntSafe(value: string) {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function parsePriceToNumber(price: string) {
  const normalized = price.replace(/[^\d.]/g, "");
  const parsed = Number.parseFloat(normalized);
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

export function addToCart(lines: CartLine[], slug: string) {
  const product = listingData.find((entry) => entry.slug === slug && entry.kind === "Product");
  if (!product) {
    return lines;
  }

  const next = [...lines];
  const index = next.findIndex((line) => line.slug === slug);
  if (index === -1) {
    next.push({ slug, quantity: 1 });
  } else {
    next[index] = { slug, quantity: next[index].quantity + 1 };
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

export function buildCartItems(lines: CartLine[]) {
  const items: CartItem[] = [];

  for (const line of lines) {
    const product = listingData.find((entry) => entry.slug === line.slug && entry.kind === "Product");
    if (!product) {
      continue;
    }

    const unitPrice = parsePriceToNumber(product.price);
    items.push({
      product,
      quantity: line.quantity,
      unitPrice,
      lineTotal: unitPrice * line.quantity,
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
