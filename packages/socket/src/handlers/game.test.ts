import { createAdaptorServer } from "@hono/node-server"
import { EVENTS, SESSION_ROLES } from "@razzia/common/constants"
import type { SessionRole } from "@razzia/common/types/auth"
import type {
  ClientToServerEvents,
  Server,
  ServerToClientEvents,
} from "@razzia/common/types/game/socket"
import { app, createSocketServer } from "@razzia/socket/app"
import { mintJoinTicket, mintToken } from "@razzia/socket/services/auth"
import Game from "@razzia/socket/services/game"
import Registry from "@razzia/socket/services/registry"
import { createQuestion, createQuizz } from "@razzia/socket/test/fixtures"
import type { AddressInfo } from "net"
import { io as connect, type Socket as ClientSocket } from "socket.io-client"
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest"

type Client = ClientSocket<ServerToClientEvents, ClientToServerEvents>

const server = createAdaptorServer({ fetch: app.fetch })
const io: Server = createSocketServer(server)
let url = ""
const clients: Client[] = []

const createClient = (token?: string): Client => {
  const client: Client = connect(url, {
    path: "/ws",
    auth: token ? { token } : {},
    transports: ["websocket"],
    forceNew: true,
  })

  clients.push(client)

  return client
}

const connectAs = async (
  clientId: string,
  role: SessionRole = SESSION_ROLES.PLAYER,
) => {
  const { token } = await mintToken(clientId, role)
  const client = createClient(token)

  await new Promise<void>((resolve) => {
    client.once("connect", resolve)
  })

  return client
}

const waitFor = <E extends keyof ServerToClientEvents>(
  client: Client,
  event: E,
) =>
  new Promise<Parameters<ServerToClientEvents[E]>[0]>((resolve) => {
    // @ts-expect-error -- Generic event names are not narrowed by socket.io types
    client.once(event, resolve)
  })

const createGame = async (managerId = "manager") => {
  const game = new Game(io, managerId, createQuizz([createQuestion()]))

  Registry.getInstance().addGame(game)

  const manager = await connectAs(managerId, SESSION_ROLES.MANAGER)
  const reconnected = waitFor(manager, EVENTS.MANAGER.SUCCESS_RECONNECT)

  manager.emit(EVENTS.MANAGER.RECONNECT, { gameId: game.gameId })
  await reconnected

  return { game, manager }
}

const joinGame = async (game: Game, clientId: string, username: string) => {
  const player = await connectAs(clientId)
  const joined = waitFor(player, EVENTS.GAME.SUCCESS_JOIN)

  player.emit(EVENTS.PLAYER.LOGIN, {
    ticket: await mintJoinTicket(clientId, game.gameId, username),
  })
  await joined

  return player
}

beforeAll(async () => {
  await new Promise<void>((resolve) => {
    server.listen(0, resolve)
  })

  url = `http://localhost:${(server.address() as AddressInfo).port}`
})

afterEach(() => {
  clients.splice(0).forEach((client) => {
    client.disconnect()
  })
  Registry.getInstance()
    .getAllGames()
    .forEach((game) => {
      Registry.getInstance().removeGame(game.gameId)
    })
})

afterAll(async () => {
  await io.close()
})

describe("socket authentication", () => {
  it.each([
    [undefined, "TOKEN_MISSING"],
    ["invalid", "TOKEN_INVALID"],
  ])("rejects the token %s", async (token, code) => {
    const client = createClient(token)
    const error = await new Promise<Error & { data?: { code: string } }>(
      (resolve) => {
        client.once("connect_error", resolve)
      },
    )

    expect(error.data?.code).toBe(code)
  })
})

describe("game socket handlers", () => {
  it("joins a player with a join ticket and notifies the manager", async () => {
    const { game, manager } = await createGame()
    const newPlayer = waitFor(manager, EVENTS.MANAGER.NEW_PLAYER)

    await joinGame(game, "alice", "Alice")

    expect(await newPlayer).toMatchObject({ username: "Alice" })
    expect(game.players).toHaveLength(1)
  })

  it("refuses a join ticket issued to another client", async () => {
    const { game } = await createGame()
    const player = await connectAs("mallory")
    const reset = waitFor(player, EVENTS.GAME.RESET)

    player.emit(EVENTS.PLAYER.LOGIN, {
      ticket: await mintJoinTicket("alice", game.gameId, "Alice"),
    })

    expect(await reset).toBe("errors:auth.unauthorized")
  })

  it("only lets the manager of the game control it", async () => {
    const { game } = await createGame()
    const player = await joinGame(game, "alice", "Alice")
    const error = waitFor(player, EVENTS.GAME.ERROR_MESSAGE)

    player.emit(EVENTS.MANAGER.SET_LOCK, { gameId: game.gameId, locked: true })

    expect(await error).toBe("errors:auth.unauthorized")
    expect(game.locked).toBe(false)
  })

  it("lets the manager kick a player", async () => {
    const { game, manager } = await createGame()
    const player = await joinGame(game, "alice", "Alice")
    const reset = waitFor(player, EVENTS.GAME.RESET)

    manager.emit(EVENTS.MANAGER.KICK_PLAYER, {
      gameId: game.gameId,
      playerId: game.players[0].id,
    })

    expect(await reset).toBe("errors:game.kickedByManager")
    expect(game.players).toHaveLength(0)
  })

  it("removes a player leaving the lobby", async () => {
    const { game, manager } = await createGame()
    const player = await joinGame(game, "alice", "Alice")
    const removed = waitFor(manager, EVENTS.MANAGER.REMOVE_PLAYER)

    player.disconnect()

    await removed

    expect(game.players).toHaveLength(0)
  })

  it("closes the lobby when the manager exits", async () => {
    const { game, manager } = await createGame()
    const player = await joinGame(game, "alice", "Alice")
    const reset = waitFor(player, EVENTS.GAME.RESET)

    manager.emit(EVENTS.MANAGER.LEAVE, { gameId: game.gameId })

    expect(await reset).toBe("errors:game.managerDisconnected")
    expect(Registry.getInstance().getGameById(game.gameId)).toBeUndefined()
  })

  it("keeps the lobby when the manager connection drops", async () => {
    const { game, manager } = await createGame()
    const player = await joinGame(game, "alice", "Alice")
    let playerReset = false

    player.on(EVENTS.GAME.RESET, () => {
      playerReset = true
    })
    manager.disconnect()

    await expect.poll(() => game.manager.connected).toBe(false)

    const newManager = await connectAs("manager", SESSION_ROLES.MANAGER)
    const success = waitFor(newManager, EVENTS.MANAGER.SUCCESS_RECONNECT)

    newManager.emit(EVENTS.MANAGER.RECONNECT, { gameId: game.gameId })

    expect(await success).toMatchObject({ players: [{ username: "Alice" }] })
    expect(Registry.getInstance().getGameById(game.gameId)).toBe(game)
    expect(playerReset).toBe(false)
  })

  it("hands the game over to a new manager tab", async () => {
    const { game, manager } = await createGame()
    const oldTabReset = waitFor(manager, EVENTS.GAME.RESET)
    const oldTabClosed = new Promise<void>((resolve) => {
      manager.once("disconnect", () => resolve())
    })
    const newTab = await connectAs("manager", SESSION_ROLES.MANAGER)
    const success = waitFor(newTab, EVENTS.MANAGER.SUCCESS_RECONNECT)

    newTab.emit(EVENTS.MANAGER.RECONNECT, { gameId: game.gameId })

    await success
    expect(await oldTabReset).toBe("errors:game.managerAlreadyConnected")
    await oldTabClosed
    expect(game.manager).toMatchObject({ id: newTab.id, connected: true })
    expect(Registry.getInstance().getGameById(game.gameId)).toBe(game)
  })

  it("rejects answers to a game the player is not in", async () => {
    const { game } = await createGame()
    const otherGame = new Game(io, "other", createQuizz([createQuestion()]))

    Registry.getInstance().addGame(otherGame)

    const player = await joinGame(game, "alice", "Alice")
    const answer = (gameId: string) => {
      const error = waitFor(player, EVENTS.GAME.ERROR_MESSAGE)

      player.emit(EVENTS.PLAYER.SELECTED_ANSWER, {
        gameId,
        data: { answerKeys: [0] },
      })

      return error
    }

    expect(await answer(otherGame.gameId)).toBe("errors:auth.unauthorized")
    expect(await answer("unknown")).toBe("errors:game.notFound")
  })

  it("lets a player reconnect to a started game", async () => {
    const { game, manager } = await createGame()
    const player = await joinGame(game, "alice", "Alice")
    const started = waitFor(player, EVENTS.GAME.STATUS)

    manager.emit(EVENTS.MANAGER.START_GAME, { gameId: game.gameId })
    await started

    const disconnected = waitFor(manager, EVENTS.GAME.TOTAL_PLAYERS)

    player.disconnect()
    await disconnected

    expect(game.players[0].connected).toBe(false)

    const reconnected = await connectAs("alice")
    const success = waitFor(reconnected, EVENTS.PLAYER.SUCCESS_RECONNECT)

    reconnected.emit(EVENTS.PLAYER.RECONNECT, { gameId: game.gameId })

    expect(await success).toMatchObject({
      gameId: game.gameId,
      player: { username: "Alice" },
    })
    expect(game.players[0]).toMatchObject({
      id: reconnected.id,
      connected: true,
    })
  })

  it("lets a player reconnect before the old connection is closed", async () => {
    const { game, manager } = await createGame()
    const player = await joinGame(game, "alice", "Alice")
    const started = waitFor(player, EVENTS.GAME.STATUS)

    manager.emit(EVENTS.MANAGER.START_GAME, { gameId: game.gameId })
    await started

    const oldConnectionClosed = new Promise<void>((resolve) => {
      player.once("disconnect", () => resolve())
    })
    const reconnected = await connectAs("alice")
    const success = waitFor(reconnected, EVENTS.PLAYER.SUCCESS_RECONNECT)

    reconnected.emit(EVENTS.PLAYER.RECONNECT, { gameId: game.gameId })

    expect(await success).toMatchObject({ player: { username: "Alice" } })

    await oldConnectionClosed

    expect(game.players).toHaveLength(1)
    expect(game.players[0]).toMatchObject({
      id: reconnected.id,
      connected: true,
    })
  })

  it("keeps two simultaneous games apart", async () => {
    const first = await createGame("first-manager")
    const second = await createGame("second-manager")
    const secondNewPlayer = waitFor(second.manager, EVENTS.MANAGER.NEW_PLAYER)

    await joinGame(first.game, "first-alice", "Alice")

    const secondAlice = await joinGame(second.game, "second-alice", "Alice")

    expect(await secondNewPlayer).toMatchObject({ id: secondAlice.id })

    let secondReset = false

    secondAlice.on(EVENTS.GAME.RESET, () => {
      secondReset = true
    })
    first.manager.emit(EVENTS.MANAGER.SET_LOCK, {
      gameId: first.game.gameId,
      locked: true,
    })
    first.manager.emit(EVENTS.MANAGER.KICK_PLAYER, {
      gameId: first.game.gameId,
      playerId: first.game.players[0].id,
    })

    await expect.poll(() => first.game.players).toHaveLength(0)
    expect(first.game.locked).toBe(true)
    expect(second.game.locked).toBe(false)
    expect(second.game.players).toHaveLength(1)
    expect(secondReset).toBe(false)
  })

  it("keeps a started game when the manager leaves", async () => {
    const { game, manager } = await createGame()
    const player = await joinGame(game, "alice", "Alice")
    const started = waitFor(player, EVENTS.GAME.STATUS)

    manager.emit(EVENTS.MANAGER.START_GAME, { gameId: game.gameId })
    await started
    manager.disconnect()

    await expect.poll(() => game.manager.connected).toBe(false)
    expect(Registry.getInstance().getGameById(game.gameId)).toBe(game)

    const newManager = await connectAs("manager", SESSION_ROLES.MANAGER)
    const success = waitFor(newManager, EVENTS.MANAGER.SUCCESS_RECONNECT)

    newManager.emit(EVENTS.MANAGER.RECONNECT, { gameId: game.gameId })

    expect(await success).toMatchObject({
      gameId: game.gameId,
      players: [{ username: "Alice" }],
    })
  })

  it.each([
    [EVENTS.PLAYER.RECONNECT, SESSION_ROLES.PLAYER, "errors:game.notFound"],
    [EVENTS.MANAGER.RECONNECT, SESSION_ROLES.MANAGER, "errors:game.expired"],
  ] as const)(
    "resets on %s to an unknown game",
    async (event, role, message) => {
      const client = await connectAs("someone", role)
      const reset = waitFor(client, EVENTS.GAME.RESET)

      client.emit(event, { gameId: "unknown" })

      expect(await reset).toBe(message)
    },
  )
})
