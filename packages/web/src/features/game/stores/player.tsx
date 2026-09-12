import type { StatusDataMap } from "@razzia/common/types/game/status"
import type { Status } from "@razzia/web/features/game/utils/createStatus"
import { create } from "zustand"

interface PlayerInfo {
  username?: string
  points?: number
}

interface PlayerState<T> {
  gameId: string | null
  inviteCode: string | null
  joinTicket: string | null
  player: PlayerInfo | null
  status: Status<T> | null
}

type PlayerStore<T> = PlayerState<T> & {
  updatePlayer: (
    _state:
      | Partial<PlayerState<T>>
      | ((_state: PlayerState<T>) => Partial<PlayerState<T>>),
  ) => void
  resetPlayer: () => void
}

const initialState: PlayerState<StatusDataMap> = {
  gameId: null,
  inviteCode: null,
  joinTicket: null,
  player: null,
  status: null,
}

export const usePlayerStore = create<PlayerStore<StatusDataMap>>((set) => ({
  ...initialState,

  updatePlayer: (state) => set(state),

  resetPlayer: () => set(initialState),
}))
