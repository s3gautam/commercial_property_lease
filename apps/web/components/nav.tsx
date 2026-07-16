"use client";

import Link from "next/link";

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

  return (
    <header className="sticky top-0 z-10 border-b border-black/10 bg-white/80 backdrop-blur dark:border-white/10 dark:bg-black/80">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          PropLease AI
        </Link>

        <nav className="flex items-center gap-6 text-sm">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}

          {user ? (
            <button
              type="button"
              onClick={clearSession}
              className="rounded-md border border-black/10 px-3 py-1.5 transition-colors hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/5"
            >
              Log out
            </button>
          ) : (
            <Link
              href="/login"
              className="rounded-md border border-black/10 px-3 py-1.5 transition-colors hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/5"
            >
              Log in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
