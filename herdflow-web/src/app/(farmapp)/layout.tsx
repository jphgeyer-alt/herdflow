// WEBSITE — herdflow-web/src/app/(farmapp)/layout.tsx
// Group-level wrapper for every route under (farmapp) -- purely
// presentational (font + design-token scope), no auth logic here; each
// section's own layout.tsx (finance/, camps/, herd/, etc.) still handles
// its own getFarmWebUser() redirect. Deliberately does NOT touch the root
// layout (src/app/layout.tsx) or its Geist font -- (store)/(admin) keep
// their existing look untouched; .farmapp-theme (globals.css) scopes the
// retinted --navy-*/--status-* tokens to only what's nested here.
import type { ReactNode } from "react";
import { Inter } from "next/font/google";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export default function FarmAppGroupLayout({ children }: { children: ReactNode }) {
  return <div className={`${inter.variable} farmapp-theme`}>{children}</div>;
}
