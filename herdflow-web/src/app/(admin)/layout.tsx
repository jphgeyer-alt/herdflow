import type { ReactNode } from "react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <section className="mx-auto w-full max-w-7xl px-4 py-8">{children}</section>;
}
