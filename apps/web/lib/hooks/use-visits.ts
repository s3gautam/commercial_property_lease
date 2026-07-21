"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { ApiError } from "@proplease/api";

import { apiClient } from "@/lib/api/client";
import type { ApiVisit } from "@/lib/api/types";
import { useAuthStore } from "@/lib/store/auth-store";

const VISITS_KEY = ["visits"] as const;

/** Every visit-mutating call site needs the same "extract a readable message
 * from a 409 conflict / 422 slot-unavailable response" behavior, so it's
 * centralized here rather than repeated at each call site. */
export async function toVisitErrorMessage(error: unknown): Promise<string> {
  if (error instanceof ApiError) return error.message;
  return "Something went wrong. Please try again.";
}

export function useVisitsQuery() {
  const user = useAuthStore((state) => state.user);
  return useQuery({
    queryKey: VISITS_KEY,
    queryFn: () => apiClient.get<ApiVisit[]>("/visits"),
    enabled: Boolean(user),
  });
}

export function useBookVisitMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { property_id: string; visit_date: string; visit_time: string }) =>
      apiClient.post<ApiVisit>("/visits", payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: VISITS_KEY }),
  });
}

export function useRescheduleVisitMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { visitId: string; visit_date: string; visit_time: string }) =>
      apiClient.patch<ApiVisit>(`/visits/${payload.visitId}/reschedule`, {
        visit_date: payload.visit_date,
        visit_time: payload.visit_time,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: VISITS_KEY }),
  });
}

export function useCancelVisitMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (visitId: string) => apiClient.post<ApiVisit>(`/visits/${visitId}/cancel`, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: VISITS_KEY }),
  });
}
