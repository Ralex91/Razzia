import type { Server } from "@razzia/common/types/game/socket"
import { gameSocketHandlers } from "@razzia/socket/handlers/game"
import { managerSocketHandlers } from "@razzia/socket/handlers/manager"
import { quizzSocketHandlers } from "@razzia/socket/handlers/quizz"
import { resultsSocketHandlers } from "@razzia/socket/handlers/results"
import type { SocketHandler } from "@razzia/socket/handlers/types"
import { getDb } from "@razzia/socket/db"
import { initConfig } from "@razzia/socket/services/config"
import { registerHttpRoutes } from "@razzia/socket/services/auth/http"
import {
  parseCookies,
  resolveSession,
  SESSION_COOKIE,
} from "@razzia/socket/services/auth/session"
import Registry from "@razzia/socket/services/registry"
import rateLimit from "@fastify/rate-limit"
import Fastify from "fastify"
import { Server as ServerIO } from "socket.io"

const isProduction = process.env.NODE_ENV === "production"

const PORT = 3001

const start = async () => {
  // Open + migrate SQLite, seed bootstrap invite / legacy import.
  getDb()
  initConfig()

  const app = Fastify({ logger: false })

  // Tolerate empty bodies on JSON POSTs (e.g. /api/auth/login/options),
  // which Fastify's default parser otherwise rejects with 400.
  app.addContentTypeParser(
    "application/json",
    { parseAs: "string" },
    (_req, body, done) => {
      if (!body || (body as string).length === 0) {
        done(null, {})

        return
      }
      try {
        done(null, JSON.parse(body as string))
      } catch (err) {
        done(err as Error, undefined)
      }
    },
  )

  // Always log the full error server-side. In development, surface the raw
  // message/name too (handy for the network tab); in production, return only
  // a generic message so internal details (DB schema, stack traces, library
  // internals) are never leaked to a client. Fastify-native errors (4xx from
  // validation, rate-limit, etc.) already carry a safe, client-appropriate
  // message, so those are passed through as-is regardless of environment.
  app.setErrorHandler((err, _req, reply) => {
    console.error("[api] unhandled error:", err)

    const status = (err as { statusCode?: number }).statusCode ?? 500
    const isClientError = status >= 400 && status < 500
    const safeToExpose = !isProduction || isClientError

    reply.code(status).send({
      error: safeToExpose ? err.message : "errors:unexpected",
      name: safeToExpose ? err.name : "InternalServerError",
    })
  })

  // Global baseline throttle (defense-in-depth against blunt abuse/DoS);
  // the auth routes in registerHttpRoutes() additionally set tighter,
  // route-specific limits via the `config.rateLimit` route option.
  await app.register(rateLimit, {
    global: true,
    max: 300,
    timeWindow: "1 minute",
  })

  registerHttpRoutes(app)

  await app.ready()

  const io: Server = new ServerIO(app.server, {
    path: "/ws",
    // Cookies must ride the WS upgrade for session auth.
    cookie: true,
  })

  // Handshake middleware: resolve the session cookie -> authenticated user.
  // socket.io does NOT wrap middleware in try/catch, so any throw here would
  // crash the whole process (taking down every live game). Treat an
  // unparseable handshake as an anonymous, unauthenticated connection rather
  // than letting it bring the server down.
  io.use((socket, next) => {
    try {
      const cookies = parseCookies(socket.handshake.headers.cookie)
      socket.data.user = resolveSession(cookies[SESSION_COOKIE])
      socket.data.clientId = (socket.handshake.auth.clientId as string) ?? ""
    } catch (error) {
      console.error("Handshake middleware error:", error)
      socket.data.user = null
      socket.data.clientId = ""
    }

    next()
  })

  const socketHandlers: SocketHandler[] = [
    managerSocketHandlers,
    quizzSocketHandlers,
    gameSocketHandlers,
    resultsSocketHandlers,
  ]

  io.on("connection", (socket) => {
    console.log(
      `Connected: socketId=${socket.id}, user=${socket.data.user?.username ?? "anon"}`,
    )

    socketHandlers.forEach((handler) => handler({ io, socket }))
  })

  await app.listen({ port: PORT, host: "0.0.0.0" })
  console.log(`Razzia server (HTTP + WS) running on port ${PORT}`)

  const shutdown = () => {
    Registry.getInstance().cleanup()
    io.close()
    app.close().finally(() => process.exit(0))
  }

  process.on("SIGINT", shutdown)
  process.on("SIGTERM", shutdown)
}

start().catch((error) => {
  console.error("Fatal startup error:", error)
  process.exit(1)
})
