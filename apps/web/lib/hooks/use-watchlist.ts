"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "@/lib/api/client";
import type { ApiProperty } from "@/lib/api/types";
import { useAuthStore } from "@/lib/store/auth-store";

const WATCHLIST_KEY = ["watchlist"] as const;

export function useWatchlistQuery() {
  const user = useAuthStore((state) => state.user);
  return useQuery({
    queryKey: WATCHLIST_KEY,
    queryFn: () => apiClient.get<ApiProperty[]>("/watchlist"),
    enabled: Boolean(user),
  });
}

/** True if the given property is on the current tenant's watchlist -
 * false (not "unknown") when logged out, so call sites don't need to
 * separately branch on auth state just to render the heart's fill. */
export function useIsWatchlisted(propertyId: string): boolean {
  const watchlistQuery = useWatchlistQuery();
  return (watchlistQuery.data?.data ?? []).some((p) => p.id === propertyId);
}

export function useAddToWatchlistMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (propertyId: string) =>
      apiClient.post<ApiProperty>("/watchlist", { property_id: propertyId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: WATCHLIST_KEY }),
  });
}

export function useRemoveFromWatchlistMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (propertyId: string) => apiClient.delete<null>(`/watchlist/${propertyId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: WATCHLIST_KEY }),
  });
}
