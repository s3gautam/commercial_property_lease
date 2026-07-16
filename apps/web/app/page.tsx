import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-[calc(100vh-73px)] flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">PropLease AI</h1>
      <p className="max-w-md text-muted-foreground">
        Find, verify, and lease commercial space — end to end, backed by AI at every step.
      </p>

      <div className="flex gap-3">
        <Link
          href="/properties"
          className="rounded-md bg-foreground px-5 py-2.5 text-sm font-medium text-background"
        >
          Browse properties
        </Link>
        <Link
          href="/login"
          className="rounded-md border border-border px-5 py-2.5 text-sm font-medium"
        >
          Log in
        </Link>
      </div>
    </main>
  );
}
