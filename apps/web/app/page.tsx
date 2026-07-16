import { FileCheck2, MessagesSquare, Search, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { FaqSection } from "@/components/faq-section";

const FEATURES = [
  {
    icon: Search,
    title: "AI-powered search",
    description: "Describe the space you need in plain English — our agent turns it into precise filters.",
  },
  {
    icon: ShieldCheck,
    title: "Instant verification",
    description: "Every listing gets an AI-generated risk summary before you ever schedule a visit.",
  },
  {
    icon: FileCheck2,
    title: "AI lease drafting",
    description: "Generate and summarize lease documents in seconds, not weeks of back-and-forth.",
  },
  {
    icon: MessagesSquare,
    title: "Direct messaging",
    description: "Talk to landlords and brokers in one thread, tied to the listing itself.",
  },
];

export default function HomePage() {
  return (
    <main>
      <section className="bg-mesh relative overflow-hidden">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-6 px-6 py-28 text-center sm:py-36">
          <div className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3.5 py-1.5 text-xs font-medium text-muted-foreground shadow-soft">
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
            AI-first commercial leasing
          </div>

          <h1
            className="animate-fade-up text-balance text-5xl font-semibold tracking-tight sm:text-6xl"
            style={{ animationDelay: "60ms" }}
          >
            Lease commercial space<br />
            <span className="text-gradient">without the guesswork</span>
          </h1>

          <p
            className="animate-fade-up max-w-xl text-balance text-lg text-muted-foreground"
            style={{ animationDelay: "120ms" }}
          >
            Find, verify, and lease commercial space end to end — backed by AI at every
            step, from search to signature.
          </p>

          <div
            className="animate-fade-up flex flex-col gap-3 pt-2 sm:flex-row"
            style={{ animationDelay: "180ms" }}
          >
            <Link
              href="/properties"
              className="rounded-full bg-accent-gradient px-6 py-3 text-sm font-medium text-white shadow-glow transition-transform hover:scale-[1.03] active:scale-[0.98]"
            >
              Browse properties
            </Link>
            <Link
              href="/login"
              className="rounded-full border border-border bg-surface px-6 py-3 text-sm font-medium shadow-soft transition-colors hover:bg-surface-2"
            >
              Log in
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-2xl border border-border bg-surface p-6 shadow-soft transition-shadow hover:shadow-card"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-accent-gradient text-white shadow-glow transition-transform group-hover:scale-110">
                <feature.icon className="h-5 w-5" strokeWidth={2} />
              </div>
              <h3 className="font-medium tracking-tight">{feature.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <FaqSection />
    </main>
  );
}
