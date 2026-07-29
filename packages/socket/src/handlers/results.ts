import { EVENTS } from "@razzia/common/constants"
import type { SocketContext } from "@razzia/socket/handlers/types"
import { deleteResult, getResultById } from "@razzia/socket/services/config"
import manager, { emitConfig } from "@razzia/socket/services/manager"

export const resultsSocketHandlers = ({ socket }: SocketContext) => {
  socket.on(
    EVENTS.RESULTS.GET,
    manager.withAuth(socket, (user, id: string) => {
      try {
        socket.emit(EVENTS.RESULTS.DATA, getResultById(id, user))
      } catch (error) {
        console.error("Failed to get result:", error)
      }
    }),
  )

  socket.on(
    EVENTS.RESULTS.DELETE,
    manager.withAuth(socket, (user, id: string) => {
      try {
        deleteResult(id, user)
        emitConfig(socket)
      } catch (error) {
        console.error("Failed to delete result:", error)
      }
    }),
  )
}
