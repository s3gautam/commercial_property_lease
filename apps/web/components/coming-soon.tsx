export function ComingSoon({ title, phase, description }: { title: string; phase: string; description: string }) {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <p className="text-sm font-medium text-muted-foreground">{phase}</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-4 text-muted-foreground">{description}</p>
    </main>
  );
}
