import { ApiClient, ApiError } from "@proplease/api";

import { useAuthStore } from "@/lib/store/auth-store";

export { ApiError };

export const apiClient = new ApiClient({
  baseUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1",
  getAccessToken: () => useAuthStore.getState().tokens?.access_token ?? null,
});
