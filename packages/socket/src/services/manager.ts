import { EVENTS } from "@razzia/common/constants"
import type { Socket } from "@razzia/common/types/game/socket"
import type { SocketContext } from "@razzia/socket/handlers/types"
import { getQuizzMeta, getResultsMeta } from "@razzia/socket/services/config"
import { getClientId } from "@razzia/socket/utils/socket"

export const emitConfig = (socket: SocketContext["socket"]) =>
  socket.emit(EVENTS.MANAGER.CONFIG, {
    quizz: getQuizzMeta(),
    results: getResultsMeta(),
  })

class Manager {
  private loggedClients = new Set()

  isLogged(socket: Socket) {
    return this.loggedClients.has(getClientId(socket))
  }

  login(socket: Socket) {
    this.loggedClients.add(getClientId(socket))
  }

  logout(socket: Socket) {
    this.loggedClients.delete(getClientId(socket))
  }

  withAuth<T extends unknown[]>(
    socket: Socket,
    handler: (..._args: T) => void,
  ) {
    return (..._args: T) => {
      if (!this.isLogged(socket)) {
        socket.emit(EVENTS.MANAGER.UNAUTHORIZED)

        return
      }

      handler(..._args)
    }
  }
}

export default new Manager()
