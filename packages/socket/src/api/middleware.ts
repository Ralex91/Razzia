import { SESSION_ROLES } from "@razzia/common/constants"
import type { SessionClaims } from "@razzia/common/types/auth"
import { type ApiEnv } from "@razzia/socket/api/factory"
import { verifyToken } from "@razzia/socket/services/auth"
import type { Context } from "hono"
import { createMiddleware } from "hono/factory"
import { StatusCodes } from "http-status-codes"

const UNAUTHORIZED = { error: "errors:auth.unauthorized" } as const

const getBearerToken = (c: Context): string | undefined => {
  const header = c.req.header("Authorization")

  if (!header?.startsWith("Bearer ")) {
    return undefined
  }

  return header.slice("Bearer ".length)
}

export const readClaims = async (
  c: Context,
): Promise<SessionClaims | undefined> => {
  const token = getBearerToken(c)

  if (!token) {
    return undefined
  }

  try {
    return await verifyToken(token)
  } catch {
    return undefined
  }
}

export const requireSession = createMiddleware<ApiEnv>(async (c, next) => {
  const claims = await readClaims(c)

  if (!claims) {
    return c.json(UNAUTHORIZED, StatusCodes.UNAUTHORIZED)
  }

  c.set("claims", claims)

  await next()
})

export const requireManager = createMiddleware<ApiEnv>(async (c, next) => {
  const claims = await readClaims(c)

  if (!claims || claims.role !== SESSION_ROLES.MANAGER) {
    return c.json(UNAUTHORIZED, StatusCodes.UNAUTHORIZED)
  }

  c.set("claims", claims)

  await next()
})
