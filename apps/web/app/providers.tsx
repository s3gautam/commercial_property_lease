"use client";

import { ApiError } from "@proplease/api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

function shouldRetry(failureCount: number, error: unknown): boolean {
  // 4xx client errors (not found, forbidden, validation, etc.) are never
  // transient — retrying just delays the error state for no benefit.
  if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
    return false;
  }
  return failureCount < 3;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: shouldRetry },
        },
      }),
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
