import { EVENTS } from "@razzia/common/constants"
import type { Player, Quizz } from "@razzia/common/types/game"
import type { Server, Socket } from "@razzia/common/types/game/socket"
import {
  STATUS,
  type Status,
  type StatusDataMap,
} from "@razzia/common/types/game/status"
import { saveResult } from "@razzia/socket/services/config"
import { CooldownTimer } from "@razzia/socket/services/game/cooldown-timer"
import { PlayerManager } from "@razzia/socket/services/game/player-manager"
import { RoundManager } from "@razzia/socket/services/game/round-manager"
import Registry from "@razzia/socket/services/registry"
import { createInviteCode } from "@razzia/socket/utils/game"
import { getClientId } from "@razzia/socket/utils/socket"
import { v7 as uuid } from "uuid"

const registry = Registry.getInstance()

class Game {
  readonly gameId: string
  readonly inviteCode: string

  private readonly io: Server
  private readonly _manager: {
    id: string
    clientId: string
    connected: boolean
  }
  private readonly playerManager: PlayerManager
  private readonly round: RoundManager
  private readonly cooldown: CooldownTimer

  private lastBroadcastStatus: {
    name: Status
    data: StatusDataMap[Status]
  } | null = null
  private managerStatus: {
    name: Status
    data: StatusDataMap[Status]
  } | null = null
  private playerStatus = new Map<
    string,
    { name: Status; data: StatusDataMap[Status] }
  >()

  constructor(io: Server, socket: Socket, quizz: Quizz) {
    const clientId = getClientId(socket)

    this.io = io
    this.gameId = uuid()
    this.inviteCode = createInviteCode()
    this._manager = {
      id: socket.id,
      clientId,
      connected: true,
    }

    this.cooldown = new CooldownTimer(io, this.gameId)

    this.playerManager = new PlayerManager(
      io,
      this.gameId,
      () => this._manager.id,
    )

    this.round = new RoundManager({
      quizz,
      players: this.playerManager,
      cooldown: this.cooldown,
      io,
      gameId: this.gameId,
      getManagerId: () => this._manager.id,
      broadcast: this.broadcastStatus.bind(this),
      send: this.sendStatus.bind(this),
      onNewQuestion: () => {
        this.playerStatus.clear()
        this.managerStatus = null
      },
      onGameFinished: saveResult,
    })

    socket.join(this.gameId)
    socket.emit(EVENTS.MANAGER.GAME_CREATED, {
      gameId: this.gameId,
      inviteCode: this.inviteCode,
    })

    console.log(
      `New game created: ${this.inviteCode} subject: ${quizz.subject}`,
    )
  }

  get manager() {
    return this._manager
  }

  get players(): Player[] {
    return this.playerManager.getAll()
  }

  get started(): boolean {
    return this.round.isStarted()
  }

  // ── Status broadcasting ──────────────────────────────────────────────────

  private broadcastStatus<T extends Status>(status: T, data: StatusDataMap[T]) {
    const statusData = { name: status, data }
    this.lastBroadcastStatus = statusData
    this.io.to(this.gameId).emit(EVENTS.GAME.STATUS, statusData)
  }

  private sendStatus<T extends Status>(
    target: string,
    status: T,
    data: StatusDataMap[T],
  ) {
    const statusData = { name: status, data }

    if (this._manager.id === target) {
      this.managerStatus = statusData
    } else {
      this.playerStatus.set(target, statusData)
    }

    this.io.to(target).emit(EVENTS.GAME.STATUS, statusData)
  }

  // Player actions

  join(socket: Socket, username: string) {
    this.playerManager.join(socket, username)
  }

  kickPlayer(socket: Socket, playerId: string) {
    if (this.playerManager.kick(socket, playerId)) {
      this.playerStatus.delete(playerId)
    }
  }

  // Reconnect

  reconnect(socket: Socket) {
    const { clientId } = socket.handshake.auth

    if (this._manager.clientId === clientId) {
      this.reconnectManager(socket)

      return
    }

    this.reconnectPlayer(socket)
  }

  private reconnectManager(socket: Socket) {
    if (this._manager.connected) {
      socket.emit(EVENTS.GAME.RESET, "errors:game.managerAlreadyConnected")

      return
    }

    socket.join(this.gameId)
    this._manager.id = socket.id
    this._manager.connected = true

    const status = this.managerStatus ??
      this.lastBroadcastStatus ?? {
        name: STATUS.WAIT,
        data: { text: "game:waitingForPlayers" },
      }

    socket.emit(EVENTS.MANAGER.SUCCESS_RECONNECT, {
      gameId: this.gameId,
      currentQuestion: this.round.getReconnectInfo(),
      status,
      players: this.playerManager.getAll(),
    })
    socket.emit(EVENTS.GAME.TOTAL_PLAYERS, this.playerManager.count())

    registry.reactivateGame(this.gameId)
    console.log(`Manager reconnected to game ${this.inviteCode}`)
  }

  private reconnectPlayer(socket: Socket) {
    const clientId = getClientId(socket)
    const player = this.playerManager.findByClientId(clientId)

    if (!player) {
      return
    }

    if (player.connected) {
      socket.emit(EVENTS.GAME.RESET, "errors:game.playerAlreadyConnected")

      return
    }

    socket.join(this.gameId)

    const oldSocketId = player.id
    this.playerManager.updateSocketId(oldSocketId, socket.id)
    player.connected = true

    const status = this.playerStatus.get(oldSocketId) ??
      this.lastBroadcastStatus ?? {
        name: STATUS.WAIT,
        data: { text: "game:waitingForPlayers" },
      }

    const oldStatus = this.playerStatus.get(oldSocketId)

    if (oldStatus) {
      this.playerStatus.delete(oldSocketId)
      this.playerStatus.set(socket.id, oldStatus)
    }

    socket.emit(EVENTS.PLAYER.SUCCESS_RECONNECT, {
      gameId: this.gameId,
      currentQuestion: this.round.getReconnectInfo(),
      status,
      player: { username: player.username, points: player.points },
    })
    socket.emit(EVENTS.GAME.TOTAL_PLAYERS, this.playerManager.count())

    console.log(
      `Player ${player.username} reconnected to game ${this.inviteCode}`,
    )
  }

  // Disconnect helpers

  setManagerDisconnected() {
    this._manager.connected = false
  }

  removePlayer(socketId: string): Player | undefined {
    const player = this.playerManager.remove(socketId)

    if (player) {
      this.io.to(this._manager.id).emit(EVENTS.MANAGER.REMOVE_PLAYER, player.id)
      this.playerManager.broadcastCount()
    }

    return player
  }

  setPlayerDisconnected(socketId: string) {
    this.playerManager.setDisconnected(socketId)
    this.playerManager.broadcastCount()
  }

  // Game flow

  abortCooldown() {
    this.cooldown.abort()
  }

  async start(socket: Socket) {
    await this.round.start(socket)
  }

  selectAnswer(socket: Socket, answerIds: number[]) {
    this.round.selectAnswer(socket, answerIds)
  }

  nextRound(socket: Socket) {
    this.round.nextQuestion(socket)
  }

  abortRound(socket: Socket) {
    this.round.abortQuestion(socket)
  }

  showLeaderboard() {
    this.round.showLeaderboard()
  }
}

export default Game
