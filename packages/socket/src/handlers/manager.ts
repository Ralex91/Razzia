import { EVENTS } from "@razzia/common/constants"
import type { SocketContext } from "@razzia/socket/handlers/types"
import manager, { emitConfig } from "@razzia/socket/services/manager"

/**
 * Manager auth now happens over HTTP via passkeys (see services/auth/http.ts).
 * By the time the socket connects, the session cookie has been resolved by the
 * handshake middleware into socket.data.user. These handlers only surface the
 * authenticated state and scoped config; they never handle credentials.
 */
export const managerSocketHandlers = ({ socket }: SocketContext) => {
  // Announce auth state immediately on connect so the client can route.
  if (manager.isLogged(socket)) {
    emitConfig(socket)
  }

  socket.on(
    EVENTS.MANAGER.GET_CONFIG,
    manager.withAuth(socket, () => {
      emitConfig(socket)
    }),
  )

  // Re-check the session (e.g. after the client completes an HTTP login and
  // reconnects the socket carrying the new cookie).
  socket.on(EVENTS.MANAGER.AUTH, () => {
    if (manager.isLogged(socket)) {
      emitConfig(socket)

      return
    }

    socket.emit(EVENTS.MANAGER.UNAUTHORIZED)
  })
}
