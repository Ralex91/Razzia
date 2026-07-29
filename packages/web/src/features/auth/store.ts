import type { PublicUser } from "@razzia/common/types/user"
import { create } from "zustand"

interface AuthStore {
  user: PublicUser | null
  setUser: (_user: PublicUser | null) => void
  isAdmin: () => boolean
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  setUser: (user) => set({ user }),
  isAdmin: () => get().user?.role === "admin",
}))
