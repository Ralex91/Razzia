import { QUIZZ_MODES, SESSION_ROLES } from "@razzia/common/constants"
import type { SessionResponse } from "@razzia/common/types/auth"
import { app } from "@razzia/socket/app"
import { mintToken, verifyJoinTicket } from "@razzia/socket/services/auth"
import {
  getPath,
  initConfig,
  saveQuizz,
  saveResult,
} from "@razzia/socket/services/config"
import { setIo } from "@razzia/socket/services/io"
import Registry from "@razzia/socket/services/registry"
import { createFakeIo } from "@razzia/socket/test/fake-io"
import { createQuestion, createQuizz } from "@razzia/socket/test/fixtures"
import fs from "fs"
import { StatusCodes } from "http-status-codes"
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest"

interface RequestOptions {
  method?: string
  token?: string
  body?: unknown
}

const request = (
  path: string,
  { method = "GET", token, body }: RequestOptions = {},
) =>
  app.request(`/api${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })

const PNG_BYTES = Buffer.from(
  "89504e470d0a1a0a0000000d4948445200000001000000010806000000",
  "hex",
)

const upload = (file: File) => {
  const form = new FormData()

  form.append("file", file)

  return app.request("/api/media", {
    method: "POST",
    headers: { Authorization: `Bearer ${managerToken}` },
    body: form,
  })
}

const json = async <T = Record<string, unknown>>(response: Response) =>
  (await response.json()) as T

let managerToken = ""
let playerToken = ""

const createGame = async () => {
  const { id: quizzId } = saveQuizz(createQuizz([createQuestion()]))
  const response = await request("/games", {
    method: "POST",
    token: managerToken,
    body: { quizzId },
  })

  return json<{ gameId: string; inviteCode: string }>(response)
}

beforeAll(async () => {
  setIo(createFakeIo().io)
  managerToken = (await mintToken("manager", SESSION_ROLES.MANAGER)).token
  playerToken = (await mintToken("player", SESSION_ROLES.PLAYER)).token
})

beforeEach(() => {
  fs.rmSync(getPath(), { recursive: true, force: true })
  initConfig()
})

afterEach(() => {
  vi.useRealTimers()
  Registry.getInstance()
    .getAllGames()
    .forEach((game) => {
      Registry.getInstance().removeGame(game.gameId)
    })
})

describe("auth", () => {
  it("creates a player session and keeps a valid one", async () => {
    const created = await json<SessionResponse>(
      await request("/auth/session", { method: "POST", body: {} }),
    )

    expect(created.role).toBe(SESSION_ROLES.PLAYER)

    const kept = await json<SessionResponse>(
      await request("/auth/session", {
        method: "POST",
        body: { token: created.token },
      }),
    )

    expect(kept.token).toBe(created.token)
  })

  it("renews an expired session as a player with the same client id", async () => {
    vi.useFakeTimers()

    const { token } = await mintToken("client", SESSION_ROLES.MANAGER)

    vi.advanceTimersByTime(13 * 60 * 60 * 1000)

    const renewed = await json<SessionResponse>(
      await request("/auth/session", { method: "POST", body: { token } }),
    )

    expect(renewed).toMatchObject({
      clientId: "client",
      role: SESSION_ROLES.PLAYER,
    })
  })

  it("logs in the manager with the right password only", async () => {
    const wrong = await request("/auth/manager", {
      method: "POST",
      body: { password: "wrong" },
    })

    expect(wrong.status).toBe(StatusCodes.FORBIDDEN)
    expect(await json(wrong)).toEqual({
      error: "errors:manager.invalidPassword",
    })

    const right = await request("/auth/manager", {
      method: "POST",
      token: playerToken,
      body: { password: "test-password" },
    })

    expect(await json(right)).toMatchObject({
      clientId: "player",
      role: SESSION_ROLES.MANAGER,
    })
  })

  it("blocks the manager login until a password is configured", async () => {
    vi.resetModules()
    vi.stubEnv("MANAGER_PASSWORD", "")

    const { app: unconfiguredApp } = await import("@razzia/socket/app")
    const response = await unconfiguredApp.request("/api/auth/manager", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: "anything" }),
    })

    vi.unstubAllEnvs()

    expect(response.status).toBe(StatusCodes.FORBIDDEN)
    expect(await json(response)).toEqual({
      error: "errors:manager.passwordNotConfigured",
    })
  })

  it("downgrades the session to a player on logout", async () => {
    const response = await request("/auth/logout", {
      method: "POST",
      token: managerToken,
    })

    expect(await json(response)).toMatchObject({
      clientId: "manager",
      role: SESSION_ROLES.PLAYER,
    })
  })
})

describe("manager routes", () => {
  it.each(["/quizz", "/results", "/media"])(
    "%s rejects players and anonymous users",
    async (path) => {
      expect((await request(path)).status).toBe(StatusCodes.UNAUTHORIZED)
      expect((await request(path, { token: playerToken })).status).toBe(
        StatusCodes.UNAUTHORIZED,
      )
    },
  )

  it("manages quizz", async () => {
    const created = await request("/quizz", {
      method: "POST",
      token: managerToken,
      body: createQuizz([createQuestion()]),
    })

    expect(created.status).toBe(StatusCodes.CREATED)

    const { id } = await json<{ id: string }>(created)
    const fetched = await request(`/quizz/${id}`, { token: managerToken })

    expect(await json(fetched)).toMatchObject({ id, subject: "Test quizz" })

    const deleted = await request(`/quizz/${id}`, {
      method: "DELETE",
      token: managerToken,
    })

    expect(deleted.status).toBe(StatusCodes.NO_CONTENT)

    const missing = await request(`/quizz/${id}`, { token: managerToken })

    expect(missing.status).toBe(StatusCodes.NOT_FOUND)
    expect(await json(missing)).toEqual({ error: "errors:quizz.notFound" })
  })

  it("returns the translated validation error", async () => {
    const response = await request("/quizz", {
      method: "POST",
      token: managerToken,
      body: createQuizz([]),
    })

    expect(response.status).toBe(StatusCodes.BAD_REQUEST)
    expect(await json(response)).toEqual({ error: "errors:quizz.noQuestions" })
  })
})

describe("games", () => {
  it("creates a game from an existing quizz", async () => {
    const missing = await request("/games", {
      method: "POST",
      token: managerToken,
      body: { quizzId: "missing" },
    })

    expect(missing.status).toBe(StatusCodes.NOT_FOUND)

    const { gameId, inviteCode } = await createGame()

    expect(inviteCode).toMatch(/^\d{6}$/u)
    expect(Registry.getInstance().getGameById(gameId)).toBeDefined()
  })

  it("only lets the game manager update the settings", async () => {
    const { gameId } = await createGame()
    const otherManager = (await mintToken("other", SESSION_ROLES.MANAGER)).token
    const body = { answersOnly: true }

    const forbidden = await request(`/games/${gameId}/settings`, {
      method: "PATCH",
      token: otherManager,
      body,
    })

    expect(forbidden.status).toBe(StatusCodes.NOT_FOUND)

    const updated = await request(`/games/${gameId}/settings`, {
      method: "PATCH",
      token: managerToken,
      body,
    })

    expect(await json(updated)).toMatchObject({ settings: body })
  })

  it("checks an invite code", async () => {
    const { gameId, inviteCode } = await createGame()
    const check = () =>
      request("/games/check", { method: "POST", body: { inviteCode } })

    expect(await json(await check())).toEqual({ generatedUsernames: false })

    Registry.getInstance().getGameById(gameId)?.setLocked(true)

    expect((await check()).status).toBe(StatusCodes.FORBIDDEN)
    expect(
      (
        await request("/games/check", {
          method: "POST",
          body: { inviteCode: "000000" },
        })
      ).status,
    ).toBe(StatusCodes.NOT_FOUND)
  })

  it("gives a join ticket to players", async () => {
    const { gameId, inviteCode } = await createGame()
    const join = (token: string, username?: string) =>
      request("/games/join", {
        method: "POST",
        token,
        body: { inviteCode, username },
      })

    expect((await join(managerToken, "Boss")).status).toBe(
      StatusCodes.FORBIDDEN,
    )
    expect(await json(await join(playerToken))).toEqual({
      error: "errors:auth.usernameTooShort",
    })

    const { ticket } = await json<{ ticket: string }>(
      await join(playerToken, "Alice"),
    )

    await expect(verifyJoinTicket(ticket)).resolves.toMatchObject({
      sub: "player",
      gameId,
      username: "Alice",
    })
  })

  it("only lets managers create a game", async () => {
    const { id: quizzId } = saveQuizz(createQuizz([createQuestion()]))
    const create = (token?: string) =>
      request("/games", { method: "POST", token, body: { quizzId } })

    expect((await create()).status).toBe(StatusCodes.UNAUTHORIZED)
    expect((await create(playerToken)).status).toBe(StatusCodes.UNAUTHORIZED)
    expect(Registry.getInstance().getGameCount()).toBe(0)
  })

  it.each(["A", "Al", "Ali"])(
    "accepts the short username %s",
    async (username) => {
      const { inviteCode } = await createGame()
      const response = await request("/games/join", {
        method: "POST",
        token: playerToken,
        body: { inviteCode, username },
      })

      expect(await json(response)).toMatchObject({ username })
    },
  )
})

describe("results", () => {
  it("lists, reads and deletes a result", async () => {
    saveResult({
      id: "result",
      gameMode: QUIZZ_MODES.QUIZ,
      subject: "Subject",
      date: "2026-01-01T00:00:00.000Z",
      players: [{ username: "Alice", points: 1000, rank: 1 }],
      questions: [],
    })

    const list = await request("/results", { token: managerToken })

    expect(await json(list)).toMatchObject({
      results: [{ id: "result", playerCount: 1 }],
    })

    const result = await request("/results/result", { token: managerToken })

    expect(await json(result)).toMatchObject({ subject: "Subject" })

    const deleted = await request("/results/result", {
      method: "DELETE",
      token: managerToken,
    })

    expect(deleted.status).toBe(StatusCodes.NO_CONTENT)

    const missing = await request("/results/result", { token: managerToken })

    expect(missing.status).toBe(StatusCodes.NOT_FOUND)
    expect(await json(missing)).toEqual({ error: "errors:result.notFound" })
  })
})

describe("media", () => {
  it("uploads, lists and deletes a media", async () => {
    const uploaded = await upload(new File([PNG_BYTES], "picture.png"))

    expect(uploaded.status).toBe(StatusCodes.CREATED)

    const { name } = await json<{ name: string }>(uploaded)
    const list = await request("/media", { token: managerToken })

    expect(await json(list)).toMatchObject({ media: [{ name, type: "image" }] })

    const deleted = await request(`/media/${name}`, {
      method: "DELETE",
      token: managerToken,
    })

    expect(deleted.status).toBe(StatusCodes.NO_CONTENT)
  })

  it("rejects files that are not media", async () => {
    const response = await upload(new File(["text"], "notes.png"))

    expect(response.status).toBe(StatusCodes.UNSUPPORTED_MEDIA_TYPE)
    expect(await json(response)).toEqual({ error: "errors:media.invalidType" })
  })

  it.each([
    ["bad name.png", StatusCodes.BAD_REQUEST, "errors:media.invalidName"],
    ["missing.png", StatusCodes.NOT_FOUND, "errors:media.notFound"],
  ])("refuses to delete %s", async (name, status, error) => {
    const response = await request(`/media/${encodeURIComponent(name)}`, {
      method: "DELETE",
      token: managerToken,
    })

    expect(response.status).toBe(status)
    expect(await json(response)).toEqual({ error })
  })
})
