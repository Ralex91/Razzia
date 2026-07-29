import type { User } from "@razzia/common/types/user"
import { sessionsRepo, usersRepo } from "@razzia/socket/db/repositories"
import crypto from "crypto"

export const SESSION_COOKIE = "razzia_session"
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30 // 30 days

const hash = (token: string) =>
  crypto.createHash("sha256").update(token).digest("hex")

/** Issues a new session and returns the raw token to set as a cookie. */
export const issueSession = (userId: string): string => {
  const token = crypto.randomBytes(32).toString("base64url")
  sessionsRepo.create(hash(token), userId, SESSION_TTL_MS)

  return token
}

export const resolveSession = (token: string | undefined): User | null => {
  if (!token) {
    return null
  }

  const session = sessionsRepo.resolve(hash(token))

  if (!session) {
    return null
  }

  const user = usersRepo.byId(session.userId)

  if (!user || user.disabled) {
    return null
  }

  return user
}

export const revokeSession = (token: string | undefined): void => {
  if (token) {
    sessionsRepo.delete(hash(token))
  }
}

/** Parses a Cookie header into a plain map. */
export const parseCookies = (header: string | undefined): Record<string, string> => {
  if (!header) {
    return {}
  }

  return Object.fromEntries(
    header.split(";").map((part) => {
      const [k, ...v] = part.trim().split("=")

      return [k, decodeURIComponent(v.join("="))]
    }),
  )
}

export const buildSessionCookie = (token: string): string => {
  const secure = process.env.NODE_ENV === "production" ? " Secure;" : ""

  return (
    `${SESSION_COOKIE}=${token}; HttpOnly;${secure} SameSite=Strict; Path=/; ` +
    `Max-Age=${SESSION_TTL_MS / 1000}`
  )
}

export const clearSessionCookie = (): string =>
  `${SESSION_COOKIE}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0`
