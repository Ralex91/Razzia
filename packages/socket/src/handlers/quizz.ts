import { EVENTS } from "@razzia/common/constants"
import type { SocketContext } from "@razzia/socket/handlers/types"
import {
  cloneQuizz,
  deleteQuizz,
  getQuizzById,
  saveQuizz,
  updateQuizz,
} from "@razzia/socket/services/config"
import manager, { emitConfig } from "@razzia/socket/services/manager"

export const quizzSocketHandlers = ({ socket }: SocketContext) => {
  socket.on(
    EVENTS.QUIZZ.GET,
    manager.withAuth(socket, (user, id: string) => {
      try {
        socket.emit(EVENTS.QUIZZ.DATA, getQuizzById(id, user))
      } catch (error) {
        console.error("Failed to get quizz:", error)
        socket.emit(EVENTS.QUIZZ.ERROR, "errors:quizz.notFound")
      }
    }),
  )

  socket.on(
    EVENTS.QUIZZ.SAVE,
    manager.withAuth(socket, (user, data: unknown) => {
      try {
        const { id } = saveQuizz(data, user.id)

        socket.emit(EVENTS.QUIZZ.SAVE_SUCCESS, { id })
        emitConfig(socket)
      } catch (error) {
        console.error("Failed to save quizz:", error)
        const message =
          error instanceof Error ? error.message : "errors:quizz.failedToSave"
        socket.emit(EVENTS.QUIZZ.ERROR, message)
      }
    }),
  )

  socket.on(
    EVENTS.QUIZZ.DELETE,
    manager.withAuth(socket, (user, id: string) => {
      try {
        deleteQuizz(id, user)
        socket.emit(EVENTS.QUIZZ.DELETE_SUCCESS, { id })
        emitConfig(socket)
      } catch (error) {
        console.error("Failed to delete quizz:", error)
        socket.emit(EVENTS.QUIZZ.ERROR, "errors:quizz.failedToDelete")
      }
    }),
  )

  socket.on(
    EVENTS.QUIZZ.UPDATE,
    manager.withAuth(socket, (user, { id, ...data }: { id: string }) => {
      try {
        const { id: newId } = updateQuizz(id, data, user)

        socket.emit(EVENTS.QUIZZ.UPDATE_SUCCESS, { id: newId })
        emitConfig(socket)
      } catch (error) {
        console.error("Failed to update quizz:", error)
        const message =
          error instanceof Error ? error.message : "errors:quizz.failedToUpdate"
        socket.emit(EVENTS.QUIZZ.ERROR, message)
      }
    }),
  )

  socket.on(
    EVENTS.QUIZZ.CLONE,
    manager.withAuth(socket, (user, id: string) => {
      try {
        const { id: newId } = cloneQuizz(id, user)

        socket.emit(EVENTS.QUIZZ.SAVE_SUCCESS, { id: newId })
        emitConfig(socket)
      } catch (error) {
        console.error("Failed to clone quizz:", error)
        socket.emit(EVENTS.QUIZZ.ERROR, "errors:quizz.failedToClone")
      }
    }),
  )
}
