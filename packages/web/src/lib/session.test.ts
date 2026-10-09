import { SESSION_ROLES } from "@razzia/common/constants"
import type { SessionResponse } from "@razzia/common/types/auth"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const now = () => Math.floor(Date.now() / 1000)

const createToken = (claims: Record<string, unknown>) =>
  `header.${Buffer.from(JSON.stringify(claims)).toString("base64url")}.signature`

const validToken = (role: string = SESSION_ROLES.MANAGER) =>
  createToken({ sub: "client", role, exp: now() + 3600 })

const expiredToken = () =>
  createToken({ sub: "client", role: SESSION_ROLES.MANAGER, exp: now() - 1 })

const storage = new Map<string, string>()

const fetchMock = vi.fn<typeof fetch>()

const loadSession = () => import("@razzia/web/lib/session")

const mockSessionResponse = (session: SessionResponse) =>
  fetchMock.mockResolvedValue(Response.json(session))

beforeEach(() => {
  vi.resetModules()
  storage.clear()
  fetchMock.mockReset()
  vi.stubGlobal("fetch", fetchMock)
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
    removeItem: (key: string) => storage.delete(key),
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("session", () => {
  it("reads the role from a valid stored token", async () => {
    storage.set("token", validToken())

    const { getClientId, getRole } = await loadSession()

    expect(getClientId()).toBe("client")
    expect(getRole()).toBe(SESSION_ROLES.MANAGER)
  })

  it("falls back to the player role once the token expired", async () => {
    storage.set("token", expiredToken())

    const { getRole, isExpired } = await loadSession()

    expect(isExpired()).toBe(true)
    expect(getRole()).toBe(SESSION_ROLES.PLAYER)
  })

  it("reuses a valid token without calling the server", async () => {
    storage.set("token", validToken())

    const { ensureSession } = await loadSession()

    await expect(ensureSession()).resolves.toMatchObject({ clientId: "client" })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("renews an expired token once for concurrent callers", async () => {
    const token = expiredToken()
    const renewed = validToken(SESSION_ROLES.PLAYER)

    storage.set("token", token)
    mockSessionResponse({
      token: renewed,
      clientId: "client",
      role: SESSION_ROLES.PLAYER,
      expiresAt: now() + 3600,
    })

    const { ensureSession, getToken } = await loadSession()

    await Promise.all([ensureSession(), ensureSession()])

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0][1]?.body).toBe(JSON.stringify({ token }))
    expect(getToken()).toBe(renewed)
    expect(storage.get("token")).toBe(renewed)
  })

  it("fails when the server refuses to create a session", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 500 }))

    const { ensureSession } = await loadSession()

    await expect(ensureSession()).rejects.toThrow("errors:auth.sessionFailed")
  })
})
