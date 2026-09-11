import { SESSION_ROLES } from "@razzia/common/constants"
import type {
  SessionClaims,
  SessionResponse,
  SessionRole,
} from "@razzia/common/types/auth"

const TOKEN_KEY = "token"

const EXPIRY_SKEW_SECONDS = 30

const withStorage = <T>(action: () => T): T | null => {
  try {
    return action()
  } catch {
    return null
  }
}

const readStorage = (key: string) =>
  withStorage(() => localStorage.getItem(key))

const writeStorage = (key: string, value: string) =>
  withStorage(() => localStorage.setItem(key, value))

const removeStorage = (key: string) =>
  withStorage(() => localStorage.removeItem(key))

removeStorage("client_id")

let memoryToken: string | null = null

const decodeClaims = (token: string): SessionClaims | null => {
  try {
    const [, payload] = token.split(".")

    if (!payload) {
      return null
    }

    const json = atob(payload.replace(/-/gu, "+").replace(/_/gu, "/"))
    const claims = JSON.parse(json) as SessionClaims

    if (typeof claims.sub !== "string" || typeof claims.exp !== "number") {
      return null
    }

    return claims
  } catch {
    return null
  }
}

export const getToken = (): string | null =>
  memoryToken ?? readStorage(TOKEN_KEY)

export const setToken = (token: string) => {
  memoryToken = token
  writeStorage(TOKEN_KEY, token)
}

export const clearToken = () => {
  memoryToken = null
  removeStorage(TOKEN_KEY)
}

const getClaims = (): SessionClaims | null => {
  const token = getToken()

  return token ? decodeClaims(token) : null
}

export const getClientId = (): string => getClaims()?.sub ?? ""

export const isExpired = (skew = EXPIRY_SKEW_SECONDS): boolean => {
  const claims = getClaims()

  if (!claims) {
    return true
  }

  return claims.exp - skew <= Math.floor(Date.now() / 1000)
}

export const getRole = (): SessionRole => {
  if (isExpired()) {
    return SESSION_ROLES.PLAYER
  }

  return getClaims()?.role ?? SESSION_ROLES.PLAYER
}

const requestSession = async (token: string | null) => {
  const response = await fetch("/api/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(token ? { token } : {}),
  })

  if (!response.ok) {
    throw new Error("errors:auth.sessionFailed")
  }

  const session = (await response.json()) as SessionResponse

  setToken(session.token)

  return session
}

let inFlight: Promise<SessionResponse> | null = null

export const ensureSession = (): Promise<SessionResponse> => {
  const token = getToken()
  const claims = token ? decodeClaims(token) : null

  if (token && claims && !isExpired()) {
    return Promise.resolve({
      token,
      clientId: claims.sub,
      role: claims.role,
      expiresAt: claims.exp,
    })
  }

  inFlight ??= requestSession(token).finally(() => {
    inFlight = null
  })

  return inFlight
}
