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
import Fastify from "fastify"
import { Server as ServerIO } from "socket.io"

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

  // Surface real errors instead of an opaque 500 — logs the full stack to the
  // socket console and returns the message/name so the client network tab shows it.
  app.setErrorHandler((err, _req, reply) => {
    console.error("[api] unhandled error:", err)
    const status = (err as { statusCode?: number }).statusCode ?? 500
    reply.code(status).send({ error: err.message, name: err.name })
  })

  registerHttpRoutes(app)

  await app.ready()

  const io: Server = new ServerIO(app.server, {
    path: "/ws",
    // Cookies must ride the WS upgrade for session auth.
    cookie: true,
  })

  // Handshake middleware: resolve the session cookie -> authenticated user.
  io.use((socket, next) => {
    const cookies = parseCookies(socket.handshake.headers.cookie)
    socket.data.user = resolveSession(cookies[SESSION_COOKIE])
    socket.data.clientId = (socket.handshake.auth.clientId as string) ?? ""
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
