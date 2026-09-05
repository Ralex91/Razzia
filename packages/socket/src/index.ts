import type { Server } from "@razzia/common/types/game/socket"
import { gameSocketHandlers } from "@razzia/socket/handlers/game"
import { managerSocketHandlers } from "@razzia/socket/handlers/manager"
import { quizzSocketHandlers } from "@razzia/socket/handlers/quizz"
import { resultsSocketHandlers } from "@razzia/socket/handlers/results"
import type { SocketHandler } from "@razzia/socket/handlers/types"
import { createApp } from "@razzia/socket/http/server"
import { initConfig } from "@razzia/socket/services/config"
import Registry from "@razzia/socket/services/registry"
import http from "http"
import { Server as ServerIO } from "socket.io"

const WS_PORT = 3001

// Express and Socket.IO share one http.Server on port 3001 (ADR-0001): non-/ws
// requests fall through to Express, WebSocket handlers are untouched.
const app = createApp()
const server = http.createServer(app)
const io: Server = new ServerIO(server, {
  path: "/ws",
})
initConfig()

console.log(`Socket server running on port ${WS_PORT}`)
server.listen(WS_PORT)

const socketHandlers: SocketHandler[] = [
  managerSocketHandlers,
  quizzSocketHandlers,
  gameSocketHandlers,
  resultsSocketHandlers,
]

io.on("connection", (socket) => {
  console.log(
    `A user connected: socketId: ${socket.id}, clientId: ${socket.handshake.auth.clientId}`,
  )

  socketHandlers.forEach((handler) => {
    handler({ io, socket })
  })
})

process.on("SIGINT", () => {
  Registry.getInstance().cleanup()
  process.exit(0)
})

process.on("SIGTERM", () => {
  Registry.getInstance().cleanup()
  process.exit(0)
})
