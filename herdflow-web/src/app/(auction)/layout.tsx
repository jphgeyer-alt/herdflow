import type { ReactNode } from "react";
import { StoreHeader } from "@/components/store-header";

export default function AuctionLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <StoreHeader />
      <section className="mx-auto w-full max-w-6xl px-4 py-8">{children}</section>
    </>
  );
}
