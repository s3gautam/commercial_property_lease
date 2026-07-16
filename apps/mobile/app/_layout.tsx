import { ApiError } from "@proplease/api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { useState } from "react";

import "../global.css";

function shouldRetry(failureCount: number, error: unknown): boolean {
  // 4xx client errors (not found, forbidden, validation, etc.) are never
  // transient — retrying just delays the error state for no benefit.
  if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
    return false;
  }
  return failureCount < 3;
}

export default function RootLayout() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: shouldRetry },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="login"
          options={{ headerShown: true, title: "Log in", presentation: "modal" }}
        />
        <Stack.Screen
          name="onboarding"
          options={{ headerShown: true, title: "Create profile", presentation: "modal" }}
        />
        <Stack.Screen
          name="property/[id]"
          options={{ headerShown: true, title: "Property" }}
        />
      </Stack>
    </QueryClientProvider>
  );
}
