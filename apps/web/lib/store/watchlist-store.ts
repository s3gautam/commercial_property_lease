import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { ApiProperty } from "@/lib/api/types";

interface WatchlistState {
  properties: ApiProperty[];
  isWatchlisted: (propertyId: string) => boolean;
  toggle: (property: ApiProperty) => void;
  remove: (propertyId: string) => void;
}

export const useWatchlistStore = create<WatchlistState>()(
  persist(
    (set, get) => ({
      properties: [],
      isWatchlisted: (propertyId) => get().properties.some((p) => p.id === propertyId),
      toggle: (property) =>
        set((state) => {
          const exists = state.properties.some((p) => p.id === property.id);
          return {
            properties: exists
              ? state.properties.filter((p) => p.id !== property.id)
              : [...state.properties, property],
          };
        }),
      remove: (propertyId) =>
        set((state) => ({
          properties: state.properties.filter((p) => p.id !== propertyId),
        })),
    }),
    { name: "proplease-watchlist" },
  ),
);
