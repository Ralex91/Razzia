import { DEFAULT_GAME_SETTINGS } from "@razzia/common/constants"
import type { GameSettings, Player } from "@razzia/common/types/game"
import type { StatusDataMap } from "@razzia/common/types/game/status"
import type { Status } from "@razzia/web/features/game/utils/createStatus"
import { create } from "zustand"

interface ManagerState<T> {
  gameId: string | null
  inviteCode: string | null
  settings: GameSettings
  status: Status<T> | null
  players: Player[]
}

type ManagerStore<T> = ManagerState<T> & {
  updateManager: (_state: Partial<ManagerState<T>>) => void
  resetManager: () => void
}

const initialState: ManagerState<StatusDataMap> = {
  gameId: null,
  inviteCode: null,
  settings: { ...DEFAULT_GAME_SETTINGS },
  status: null,
  players: [],
}

export const useManagerStore = create<ManagerStore<StatusDataMap>>((set) => ({
  ...initialState,

  updateManager: (state) => set(state),

  resetManager: () => set(initialState),
}))
