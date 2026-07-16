import { Building2, Mail, MapPin, Phone } from "lucide-react";
import Link from "next/link";

const PRODUCT_LINKS = [
  { href: "/properties", label: "Browse properties" },
  { href: "/search", label: "AI Search" },
  { href: "/kyc", label: "KYC" },
  { href: "/lease", label: "Lease" },
];

const COMPANY_LINKS = [
  { href: "/", label: "About" },
  { href: "/", label: "Careers" },
  { href: "/", label: "Blog" },
  { href: "/", label: "Privacy policy" },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link href="/" className="flex items-center gap-2 text-[15px] font-semibold tracking-tight">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-gradient text-white shadow-glow">
                <Building2 className="h-4 w-4" strokeWidth={2.25} />
              </span>
              PropLease AI
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              AI-first commercial property leasing — find, verify, and lease space end to end.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-medium">Product</h3>
            <ul className="mt-4 flex flex-col gap-2.5">
              {PRODUCT_LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-medium">Company</h3>
            <ul className="mt-4 flex flex-col gap-2.5">
              {COMPANY_LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-medium">Contact us</h3>
            <ul className="mt-4 flex flex-col gap-3">
              <li className="flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} />
                221B Residency Road, Bengaluru, Karnataka 560025, India
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4 shrink-0" strokeWidth={2} />
                <a href="mailto:hello@proplease.ai" className="transition-colors hover:text-foreground">
                  hello@proplease.ai
                </a>
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4 shrink-0" strokeWidth={2} />
                <a href="tel:+918012345678" className="transition-colors hover:text-foreground">
                  +91 80 1234 5678
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} PropLease AI. All rights reserved.</p>
          <p>Sample contact details for demo purposes only.</p>
        </div>
      </div>
    </footer>
  );
}
