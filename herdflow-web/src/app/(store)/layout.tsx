import type { ReactNode } from "react";

export default function StoreLayout({ children }: { children: ReactNode }) {
  return <section className="mx-auto w-full max-w-6xl px-4 py-8">{children}</section>;
}
