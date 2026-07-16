"use client";

import { Building2, LogOut, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuthStore } from "@/lib/store/auth-store";

const NAV_LINKS = [
  { href: "/properties", label: "Browse" },
  { href: "/search", label: "AI Search" },
  { href: "/kyc", label: "KYC" },
  { href: "/lease", label: "Lease" },
];

export function Nav() {
  const user = useAuthStore((state) => state.user);
  const clearSession = useAuthStore((state) => state.clearSession);
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = user ? [...NAV_LINKS, { href: "/profile", label: "Profile" }] : NAV_LINKS;

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-20 border-b border-border/80 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
        <Link href="/" className="flex items-center gap-2 text-[15px] font-semibold tracking-tight">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-gradient text-white shadow-glow">
            <Building2 className="h-4 w-4" strokeWidth={2.25} />
          </span>
          PropLease AI
        </Link>

        <nav className="hidden items-center gap-1 text-sm sm:flex">
          {links.map((link) => {
            const active = pathname?.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-full px-3.5 py-1.5 transition-colors ${
                  active
                    ? "bg-surface-2 font-medium text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {link.label}
              </Link>
            );
          })}

          <div className="ml-2 flex items-center gap-2 border-l border-border pl-3">
            {user ? (
              <button
                type="button"
                onClick={clearSession}
                className="flex items-center gap-1.5 rounded-full border border-border px-3.5 py-1.5 text-sm font-medium transition-colors hover:bg-surface-2"
              >
                <LogOut className="h-3.5 w-3.5" strokeWidth={2} />
                Log out
              </button>
            ) : (
              <Link
                href="/login"
                className="rounded-full bg-accent-gradient px-4 py-1.5 text-sm font-medium text-white shadow-glow transition-transform hover:scale-[1.03] active:scale-[0.98]"
              >
                Log in
              </Link>
            )}
          </div>
        </nav>

        <button
          type="button"
          onClick={() => setMobileOpen((open) => !open)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border transition-colors hover:bg-surface-2 sm:hidden"
        >
          {mobileOpen ? <X className="h-[18px] w-[18px]" strokeWidth={2} /> : <Menu className="h-[18px] w-[18px]" strokeWidth={2} />}
        </button>
      </div>

      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out sm:hidden ${
          mobileOpen ? "max-h-80" : "max-h-0"
        }`}
      >
        <nav className="flex flex-col gap-1 border-t border-border px-6 py-4 text-sm">
          {links.map((link) => {
            const active = pathname?.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-3 py-2.5 transition-colors ${
                  active
                    ? "bg-surface-2 font-medium text-foreground"
                    : "text-muted-foreground hover:bg-surface-2 hover:text-foreground"
                }`}
              >
                {link.label}
              </Link>
            );
          })}

          <div className="mt-2 border-t border-border pt-3">
            {user ? (
              <button
                type="button"
                onClick={clearSession}
                className="flex w-full items-center justify-center gap-1.5 rounded-full border border-border px-3.5 py-2 text-sm font-medium transition-colors hover:bg-surface-2"
              >
                <LogOut className="h-3.5 w-3.5" strokeWidth={2} />
                Log out
              </button>
            ) : (
              <Link
                href="/login"
                className="flex w-full items-center justify-center rounded-full bg-accent-gradient px-4 py-2 text-sm font-medium text-white shadow-glow"
              >
                Log in
              </Link>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
