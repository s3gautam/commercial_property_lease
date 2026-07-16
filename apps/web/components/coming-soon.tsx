import { Sparkles } from "lucide-react";

export function ComingSoon({ title, phase, description }: { title: string; phase: string; description: string }) {
  return (
    <main className="bg-mesh flex min-h-[calc(100vh-65px)] items-center justify-center px-6 py-16">
      <div className="animate-fade-up max-w-md rounded-3xl border border-border bg-surface p-8 text-center shadow-card">
        <span className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-accent-gradient text-white shadow-glow">
          <Sparkles className="h-5 w-5" strokeWidth={2.25} />
        </span>
        <p className="text-xs font-medium uppercase tracking-wide text-accent">{phase}</p>
        <h1 className="mt-1.5 text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{description}</p>
      </div>
    </main>
  );
}
