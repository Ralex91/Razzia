import type { StatusDataMap } from "@razzia/common/types/game/status"
import {
  createStatus,
  type Status,
} from "@razzia/web/features/game/utils/createStatus"
import { create } from "zustand"

interface PlayerState {
  username?: string
  points?: number
}

interface JoinPayload {
  gameId: string
  ticket: string | null
  username: string
}

interface PlayerStore<T> {
  gameId: string | null
  inviteCode: string | null
  joinTicket: string | null
  player: PlayerState | null
  status: Status<T> | null

  setGameId: (_gameId: string | null) => void
  setInviteCode: (_inviteCode: string | null) => void
  setJoinTicket: (_ticket: string | null) => void

  setPlayer: (_state: PlayerState) => void
  startJoin: (_payload: JoinPayload) => void
  updatePoints: (_points: number) => void

  setStatus: <K extends keyof T>(_name: K, _data: T[K]) => void

  reset: () => void
}

const initialState = {
  gameId: null,
  inviteCode: null,
  joinTicket: null,
  player: null,
  status: null,
}

export const usePlayerStore = create<PlayerStore<StatusDataMap>>((set) => ({
  ...initialState,

  setGameId: (gameId) => set({ gameId }),
  setInviteCode: (inviteCode) => set({ inviteCode }),
  setJoinTicket: (joinTicket) => set({ joinTicket }),

  setPlayer: (player: PlayerState) => set({ player }),

  startJoin: ({ gameId, ticket, username }) =>
    set({
      gameId,
      joinTicket: ticket,
      player: { username, points: 0 },
    }),

  updatePoints: (points) =>
    set((state) => ({
      player: { ...state.player, points },
    })),

  setStatus: (name, data) => set({ status: createStatus(name, data) }),

  reset: () => set(initialState),
}))
