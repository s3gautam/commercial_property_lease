import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { ApiTokens, ApiUser } from "@/lib/api/types";

interface AuthState {
  user: ApiUser | null;
  tokens: ApiTokens | null;
  hasHydrated: boolean;
  setSession: (user: ApiUser, tokens: ApiTokens) => void;
  clearSession: () => void;
  setHasHydrated: (value: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      tokens: null,
      hasHydrated: false,
      setSession: (user, tokens) => set({ user, tokens }),
      clearSession: () => set({ user: null, tokens: null }),
      setHasHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: "proplease-auth",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ user: state.user, tokens: state.tokens }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
