import { createAdaptorServer } from "@hono/node-server"
import type { Server } from "@razzia/common/types/game/socket"
import { api } from "@razzia/socket/api"
import { gameSocketHandlers } from "@razzia/socket/handlers/game"
import type { SocketHandler } from "@razzia/socket/handlers/types"
import { verifyToken } from "@razzia/socket/services/auth"
import { initConfig } from "@razzia/socket/services/config"
import { DomainError } from "@razzia/socket/services/errors"
import { setIo } from "@razzia/socket/services/io"
import Registry from "@razzia/socket/services/registry"
import { Hono } from "hono"
import { HTTPException } from "hono/http-exception"
import { JwtTokenExpired } from "hono/utils/jwt/types"
import { StatusCodes } from "http-status-codes"
import { Server as ServerIO } from "socket.io"

const WS_PORT = 3001

initConfig()

const app = new Hono()

app.route("/api", api)

app.notFound((c) =>
  c.json({ error: "errors:api.notFound" }, StatusCodes.NOT_FOUND),
)

const HTTP_ERROR_KEYS: Partial<Record<number, string>> = {
  [StatusCodes.BAD_REQUEST]: "errors:invalidRequest",
  [StatusCodes.UNAUTHORIZED]: "errors:auth.unauthorized",
  [StatusCodes.FORBIDDEN]: "errors:auth.unauthorized",
  [StatusCodes.NOT_FOUND]: "errors:api.notFound",
}

app.onError((error, c) => {
  if (error instanceof DomainError) {
    if (error.status >= StatusCodes.INTERNAL_SERVER_ERROR) {
      console.error("API error:", error)
    }

    return c.json({ error: error.key }, error.status)
  }

  if (error instanceof HTTPException) {
    return c.json(
      { error: HTTP_ERROR_KEYS[error.status] ?? "errors:api.serverError" },
      error.status,
    )
  }

  console.error("Unhandled API error:", error)

  return c.json(
    { error: "errors:api.serverError" },
    StatusCodes.INTERNAL_SERVER_ERROR,
  )
})

const server = createAdaptorServer({ fetch: app.fetch })

const io: Server = new ServerIO(server, {
  path: "/ws",
})

setIo(io)

const socketHandlers: SocketHandler[] = [gameSocketHandlers]

const authError = (code: string, message: string) => {
  const error = new Error(message) as Error & { data: { code: string } }
  error.data = { code }

  return error
}

io.use((socket, next) => {
  const token = socket.handshake.auth.token as string | undefined

  if (!token) {
    next(authError("TOKEN_MISSING", "errors:auth.tokenMissing"))

    return
  }

  verifyToken(token)
    .then((claims) => {
      socket.data = {
        clientId: claims.sub,
        role: claims.role,
      }

      next()
    })
    .catch((error: unknown) => {
      const code =
        error instanceof JwtTokenExpired ? "TOKEN_EXPIRED" : "TOKEN_INVALID"

      next(authError(code, "errors:auth.tokenInvalid"))
    })
})

io.on("connection", (socket) => {
  console.log(
    `A user connected: socketId: ${socket.id}, clientId: ${socket.data.clientId}`,
  )

  socketHandlers.forEach((handler) => {
    handler({ io, socket })
  })
})

server.listen(WS_PORT, () => {
  console.log(`Server running on port ${WS_PORT}`)
})

process.on("SIGINT", () => {
  Registry.getInstance().cleanup()
  process.exit(0)
})

process.on("SIGTERM", () => {
  Registry.getInstance().cleanup()
  process.exit(0)
})
