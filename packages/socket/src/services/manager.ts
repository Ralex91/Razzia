import { EVENTS } from "@razzia/common/constants"
import type { Socket } from "@razzia/common/types/game/socket"
import type { Permission, User } from "@razzia/common/types/user"
import type { SocketContext } from "@razzia/socket/handlers/types"
import { getQuizzMeta, getResultsMeta } from "@razzia/socket/services/config"
import { AuthzError, effectivePermission } from "@razzia/socket/services/authz"

/**
 * Emits the config scoped to the acting user:
 *  - admins see every quiz and result
 *  - managers see owned + shared quizzes and their own results
 */
export const emitConfig = (socket: Socket) => {
  const user = socket.data.user

  if (!user) {
    socket.emit(EVENTS.MANAGER.UNAUTHORIZED)

    return
  }

  socket.emit(EVENTS.MANAGER.CONFIG, {
    quizz: getQuizzMeta(user),
    results: getResultsMeta(user),
  })
}

class Manager {
  /** Resolves the authenticated user attached by the handshake middleware. */
  getUser(socket: Socket): User | null {
    return socket.data.user ?? null
  }

  isLogged(socket: Socket): boolean {
    return Boolean(socket.data.user)
  }

  /** Gate a handler on an authenticated (any-role) user. */
  withAuth<T extends unknown[]>(
    socket: Socket,
    handler: (_user: User, ..._args: T) => void,
  ) {
    return (..._args: T) => {
      const user = this.getUser(socket)

      if (!user) {
        socket.emit(EVENTS.MANAGER.UNAUTHORIZED)

        return
      }

      try {
        handler(user, ..._args)
      } catch (error) {
        this.handleError(socket, error)
      }
    }
  }

  /** Gate a handler on the admin role. */
  withAdmin<T extends unknown[]>(
    socket: Socket,
    handler: (_user: User, ..._args: T) => void,
  ) {
    return this.withAuth(socket, (user, ..._args: T) => {
      if (user.role !== "admin") {
        socket.emit(EVENTS.MANAGER.UNAUTHORIZED)

        return
      }

      handler(user, ..._args)
    })
  }

  private handleError(socket: Socket, error: unknown) {
    if (error instanceof AuthzError) {
      socket.emit(EVENTS.MANAGER.UNAUTHORIZED)

      return
    }

    console.error("Manager handler error:", error)
    socket.emit(EVENTS.MANAGER.ERROR_MESSAGE, "errors:unexpected")
  }
}

export const permissionOn = (
  user: User,
  quizId: string,
): Permission | null => effectivePermission(user, quizId)

export default new Manager()
