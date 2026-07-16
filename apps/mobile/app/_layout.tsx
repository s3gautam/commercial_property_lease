import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { useState } from "react";

import "../global.css";

export default function RootLayout() {
  const [queryClient] = useState(() => new QueryClient());

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
