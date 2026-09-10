import type { Player } from "@razzia/common/types/game"
import type { StatusDataMap } from "@razzia/common/types/game/status"
import {
  createStatus,
  type Status,
} from "@razzia/web/features/game/utils/createStatus"
import { create } from "zustand"

interface ManagerStore<T> {
  gameId: string | null
  status: Status<T> | null
  players: Player[]

  setGameId: (_gameId: string | null) => void
  setStatus: <K extends keyof T>(_name: K, _data: T[K]) => void
  resetStatus: () => void
  setPlayers: (_players: Player[]) => void

  reset: () => void
}

const initialState = {
  gameId: null,
  status: null,
  players: [],
}

export const useManagerStore = create<ManagerStore<StatusDataMap>>((set) => ({
  ...initialState,

  setGameId: (gameId) => set({ gameId }),

  setStatus: (name, data) => set({ status: createStatus(name, data) }),
  resetStatus: () => set({ status: null }),

  setPlayers: (players) => set({ players }),

  reset: () => set(initialState),
}))
