import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { ApiTokens, ApiUser } from "@/lib/api/types";

interface AuthState {
  user: ApiUser | null;
  tokens: ApiTokens | null;
  setSession: (user: ApiUser, tokens: ApiTokens) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      tokens: null,
      setSession: (user, tokens) => set({ user, tokens }),
      clearSession: () => set({ user: null, tokens: null }),
    }),
    { name: "proplease-auth" },
  ),
);
