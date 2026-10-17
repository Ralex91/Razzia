import { EVENTS } from "@razzia/common/constants"
import type { SessionRole } from "@razzia/common/types/auth"
import type {
  GameSettings,
  GameUpdateQuestion,
  Player,
  QuizzMode,
} from "@razzia/common/types/game"
import type { Status, StatusDataMap } from "@razzia/common/types/game/status"
import type { clientEventValidators } from "@razzia/common/validators/socket"
import {
  Server as ServerIO,
  Socket as SocketIO,
  type DefaultEventsMap,
} from "socket.io"
import type { z } from "zod"

export interface SocketData {
  clientId: string
  role: SessionRole
}

export type Server = ServerIO<
  ClientToServerEvents,
  ServerToClientEvents,
  DefaultEventsMap,
  SocketData
>

export type Socket = SocketIO<
  ClientToServerEvents,
  ServerToClientEvents,
  DefaultEventsMap,
  SocketData
>

export interface ServerToClientEvents {
  connect: () => void

  // Game events
  [EVENTS.GAME.STATUS]: (_data: {
    name: Status
    data: StatusDataMap[Status]
  }) => void
  [EVENTS.GAME.SUCCESS_JOIN]: (_data: {
    gameId: string
    username: string
    gameMode: QuizzMode
  }) => void
  [EVENTS.GAME.TOTAL_PLAYERS]: (_count: number) => void
  [EVENTS.GAME.ERROR_MESSAGE]: (_message: string) => void
  [EVENTS.GAME.START_COOLDOWN]: () => void
  [EVENTS.GAME.COOLDOWN]: (_count: number) => void
  [EVENTS.GAME.RESET]: (_message: string) => void
  [EVENTS.GAME.UPDATE_QUESTION]: (_data: {
    current: number
    total: number
  }) => void
  [EVENTS.GAME.PLAYER_ANSWER]: (_count: number) => void

  // Player events
  [EVENTS.PLAYER.SUCCESS_RECONNECT]: (_data: {
    gameId: string
    gameMode: QuizzMode
    status: { name: Status; data: StatusDataMap[Status] }
    player: { username: string; points: number }
    currentQuestion: GameUpdateQuestion | null
  }) => void
  [EVENTS.PLAYER.UPDATE_LEADERBOARD]: (_data: { leaderboard: Player[] }) => void

  // Manager events
  [EVENTS.MANAGER.SUCCESS_RECONNECT]: (_data: {
    gameId: string
    inviteCode: string
    settings: GameSettings
    locked: boolean
    status: { name: Status; data: StatusDataMap[Status] }
    players: Player[]
    currentQuestion: GameUpdateQuestion | null
  }) => void
  [EVENTS.MANAGER.STATUS_UPDATE]: (_data: {
    status: Status
    data: StatusDataMap[Status]
  }) => void
  [EVENTS.MANAGER.AUTO_ADVANCE]: (
    _state: { seconds: number; total: number } | null,
  ) => void
  [EVENTS.MANAGER.NEW_PLAYER]: (_player: Player) => void
  [EVENTS.MANAGER.REMOVE_PLAYER]: (_playerId: string) => void
  [EVENTS.MANAGER.PLAYER_KICKED]: (_playerId: string) => void
  [EVENTS.MANAGER.PLAYER_UPDATED]: (_update: {
    previousId: string
    player: Player
    timedOut: boolean
  }) => void
  [EVENTS.MANAGER.LOCK_UPDATED]: (_locked: boolean) => void
}

type ClientEventValidators = typeof clientEventValidators

export type ClientToServerEvents = {
  [E in keyof ClientEventValidators]: (
    _message: z.infer<ClientEventValidators[E]>,
  ) => void
} & {
  disconnect: () => void
}
