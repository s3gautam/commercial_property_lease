import type { Metadata } from "next";
import { Inter } from "next/font/google";

import { Nav } from "@/components/nav";

import { Providers } from "./providers";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PropLease AI",
  description: "AI-first commercial property leasing platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <body className="bg-background font-sans text-foreground antialiased">
        <Providers>
          <Nav />
          {children}
        </Providers>
      </body>
    </html>
  );
}
