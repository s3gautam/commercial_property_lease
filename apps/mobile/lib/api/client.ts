import { ApiClient, ApiError } from "@proplease/api";

import { useAuthStore } from "@/lib/store/auth-store";

export { ApiError };

// On a physical device/simulator this must point at your machine's LAN IP,
// not localhost — see EXPO_PUBLIC_API_URL in .env.example.
export const apiClient = new ApiClient({
  baseUrl: process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8000/api/v1",
  getAccessToken: () => useAuthStore.getState().tokens?.access_token ?? null,
});
