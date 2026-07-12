import { formatRand } from "@/lib/marketing/format";

export function centsToRand(cents: number): number {
  return cents / 100;
}

export function randToCents(rand: number): number {
  return Math.round(rand * 100);
}

export function formatCents(cents: number): string {
  return formatRand(centsToRand(cents));
}
