import type { Metadata } from "next";

import { Nav } from "@/components/nav";

import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "PropLease AI",
  description: "AI-first commercial property leasing platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <Providers>
          <Nav />
          {children}
        </Providers>
      </body>
    </html>
  );
}
