import { SESSION_ROLES } from "@razzia/common/constants"
import {
  mintJoinTicket,
  mintToken,
  verifyIgnoringExpiry,
  verifyJoinTicket,
  verifyToken,
} from "@razzia/socket/services/auth"
import { afterEach, describe, expect, it, vi } from "vitest"

const PLAYER_TTL = 60 * 60 * 24 * 30
const MANAGER_TTL = 60 * 60 * 12

afterEach(() => {
  vi.useRealTimers()
})

describe("session tokens", () => {
  it("round-trips the client id and role", async () => {
    const { token } = await mintToken("client", SESSION_ROLES.MANAGER)

    await expect(verifyToken(token)).resolves.toMatchObject({
      sub: "client",
      role: SESSION_ROLES.MANAGER,
    })
  })

  it("expires manager sessions sooner than player sessions", async () => {
    const now = Math.floor(Date.now() / 1000)
    const player = await mintToken("client", SESSION_ROLES.PLAYER)
    const manager = await mintToken("client", SESSION_ROLES.MANAGER)

    expect(player.expiresAt - now).toBeGreaterThanOrEqual(PLAYER_TTL)
    expect(manager.expiresAt - now).toBeLessThanOrEqual(MANAGER_TTL + 1)
  })

  it("rejects expired tokens unless expiry is ignored", async () => {
    vi.useFakeTimers()

    const { token } = await mintToken("client", SESSION_ROLES.MANAGER)

    vi.advanceTimersByTime((MANAGER_TTL + 1) * 1000)

    await expect(verifyToken(token)).rejects.toThrow()
    await expect(verifyIgnoringExpiry(token)).resolves.toMatchObject({
      sub: "client",
    })
  })

  it("rejects a tampered token", async () => {
    const { token } = await mintToken("client", SESSION_ROLES.PLAYER)
    const [header, , signature] = token.split(".")
    const payload = Buffer.from(
      JSON.stringify({ sub: "client", role: SESSION_ROLES.MANAGER }),
    ).toString("base64url")

    await expect(
      verifyToken(`${header}.${payload}.${signature}`),
    ).rejects.toThrow()
  })
})

describe("join tickets", () => {
  it("round-trips the game and username", async () => {
    const ticket = await mintJoinTicket("client", "game", "Alice")

    await expect(verifyJoinTicket(ticket)).resolves.toMatchObject({
      sub: "client",
      gameId: "game",
      username: "Alice",
    })
  })

  it("cannot be used as a session token", async () => {
    const ticket = await mintJoinTicket("client", "game")

    await expect(verifyToken(ticket)).rejects.toThrow()
  })
})
