import { ApiClient, ApiError } from "@proplease/api";
import type { ApiResponse } from "@proplease/types";

import type { ApiTokens } from "@/lib/api/types";
import { useAuthStore } from "@/lib/store/auth-store";

export { ApiError };

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

// Access tokens are short-lived (15 min by default); this refreshes them
// transparently on a 401 instead of surfacing "please log in again" for
// every logged-in user whose session just outlasted the token. Dedupes
// concurrent 401s (e.g. several requests failing around the same time)
// behind a single in-flight refresh call.
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;

  const refreshToken = useAuthStore.getState().tokens?.refresh_token;
  if (!refreshToken) return null;

  refreshPromise = (async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
      const body = (await response.json()) as ApiResponse<ApiTokens>;

      if (!response.ok || !body.success || !body.data) {
        useAuthStore.getState().clearSession();
        return null;
      }

      useAuthStore.getState().updateTokens(body.data);
      return body.data.access_token;
    } catch {
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export const apiClient = new ApiClient({
  baseUrl: API_BASE_URL,
  getAccessToken: () => useAuthStore.getState().tokens?.access_token ?? null,
  onUnauthorized: refreshAccessToken,
});
