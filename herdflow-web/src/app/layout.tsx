// WEBSITE CODE — herdflow.co.za
// Do not add mobile app code here
// For website changes start prompt with: WEBSITE —

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/lib/cart-context";
import { CartDrawer } from "@/components/cart-drawer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HerdFlow Web",
  description: "HerdFlow ecommerce storefront and live auction platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full overflow-x-hidden antialiased`}
    >
      <body className="flex min-h-full w-full max-w-[100vw] flex-col overflow-x-hidden">
        <CartProvider>
          {children}
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  );
}
