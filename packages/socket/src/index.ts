import type { Server } from "@razzia/common/types/game/socket"
import { authSocketHandlers } from "@razzia/socket/handlers/auth"
import { gameSocketHandlers } from "@razzia/socket/handlers/game"
import { managerSocketHandlers } from "@razzia/socket/handlers/manager"
import { quizzSocketHandlers } from "@razzia/socket/handlers/quizz"
import { resultsSocketHandlers } from "@razzia/socket/handlers/results"
import type { SocketHandler } from "@razzia/socket/handlers/types"
import { initConfig } from "@razzia/socket/services/config"
import { initDatabase, closeDatabase } from "@razzia/socket/services/database"
import Registry from "@razzia/socket/services/registry"
import { Server as ServerIO } from "socket.io"

const WS_PORT = 3001

const io: Server = new ServerIO({
  path: "/ws",
})

const startServer = async () => {
  try {
    await initDatabase()
    initConfig()

    console.log(`Socket server running on port ${WS_PORT}`)
    io.listen(WS_PORT)

    const socketHandlers: SocketHandler[] = [
      authSocketHandlers,
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

    process.on("SIGINT", async () => {
      Registry.getInstance().cleanup()
      await closeDatabase()
      process.exit(0)
    })

    process.on("SIGTERM", async () => {
      Registry.getInstance().cleanup()
      await closeDatabase()
      process.exit(0)
    })
  } catch (error) {
    console.error("Failed to start server:", error)
    process.exit(1)
  }
}

startServer()
