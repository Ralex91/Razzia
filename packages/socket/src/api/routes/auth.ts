import { zValidator } from "@hono/zod-validator"
import { SESSION_ROLES } from "@razzia/common/constants"
import type { SessionResponse } from "@razzia/common/types/auth"
import {
  managerLoginValidator,
  sessionRequestValidator,
} from "@razzia/common/validators/auth"
import { readClaims } from "@razzia/socket/api/middleware"
import { i18nHook } from "@razzia/socket/api/validation"
import { managerPassword } from "@razzia/socket/env"
import {
  mintToken,
  newClientId,
  verifyIgnoringExpiry,
  verifyToken,
} from "@razzia/socket/services/auth"
import { Hono, type Context } from "hono"
import { JwtTokenExpired } from "hono/utils/jwt/types"
import { StatusCodes } from "http-status-codes"

const readRequestToken = async (c: Context): Promise<string | undefined> => {
  try {
    const result = sessionRequestValidator.safeParse(await c.req.json())

    if (result.success && result.data.token) {
      return result.data.token
    }
  } catch {
    /* Empty */
  }

  const header = c.req.header("Authorization")

  return header?.startsWith("Bearer ")
    ? header.slice("Bearer ".length)
    : undefined
}

const freshPlayerSession = (): Promise<SessionResponse> =>
  mintToken(newClientId(), SESSION_ROLES.PLAYER)

const routes = new Hono()
  .post("/session", async (c) => {
    const token = await readRequestToken(c)

    if (!token) {
      return c.json(await freshPlayerSession())
    }

    try {
      const claims = await verifyToken(token)

      return c.json({
        token,
        clientId: claims.sub,
        role: claims.role,
        expiresAt: claims.exp,
      } satisfies SessionResponse)
    } catch (error) {
      if (error instanceof JwtTokenExpired) {
        try {
          const claims = await verifyIgnoringExpiry(token)

          return c.json(await mintToken(claims.sub, SESSION_ROLES.PLAYER))
        } catch {
          /* Empty */
        }
      }

      return c.json(await freshPlayerSession())
    }
  })
  .post(
    "/manager",
    zValidator("json", managerLoginValidator, i18nHook),
    async (c) => {
      const { password } = c.req.valid("json")

      if (!managerPassword) {
        return c.json(
          { error: "errors:manager.passwordNotConfigured" },
          StatusCodes.FORBIDDEN,
        )
      }

      if (password !== managerPassword) {
        return c.json(
          { error: "errors:manager.invalidPassword" },
          StatusCodes.UNAUTHORIZED,
        )
      }

      const claims = await readClaims(c)

      return c.json(
        await mintToken(claims?.sub ?? newClientId(), SESSION_ROLES.MANAGER),
      )
    },
  )
  .post("/logout", async (c) => {
    const claims = await readClaims(c)

    if (!claims) {
      return c.json(
        { error: "errors:auth.unauthorized" },
        StatusCodes.UNAUTHORIZED,
      )
    }

    return c.json(await mintToken(claims.sub, SESSION_ROLES.PLAYER))
  })

export const auth = routes
