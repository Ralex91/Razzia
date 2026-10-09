import { EVENTS } from "@razzia/common/constants"
import type { Server, Socket } from "@razzia/common/types/game/socket"
import type { Status } from "@razzia/common/types/game/status"

export interface Emitted {
  room: string
  event: string
  data: unknown
}

export interface EmittedStatus {
  name: Status
  data: Record<string, unknown>
}

export const createFakeIo = () => {
  const emitted: Emitted[] = []
  const disconnected: string[] = []

  const emitter = (room: string) => ({
    emit: (event: string, data?: unknown) => {
      emitted.push({ room, event, data })

      return true
    },
  })

  const io = {
    to: emitter,
    in: (room: string) => ({
      socketsLeave: () => undefined,
      disconnectSockets: () => {
        disconnected.push(room)
      },
    }),
  } as unknown as Server

  const createSocket = (id: string, clientId = id) =>
    ({
      id,
      data: { clientId },
      join: () => undefined,
      to: emitter,
      ...emitter(id),
    }) as unknown as Socket

  const events = (room: string, event: string) =>
    emitted.filter((e) => e.room === room && e.event === event)

  const lastEvent = (room: string, event: string) => events(room, event).at(-1)

  const lastStatus = (room: string) =>
    lastEvent(room, EVENTS.GAME.STATUS)?.data as EmittedStatus | undefined

  return {
    io,
    emitted,
    disconnected,
    createSocket,
    events,
    lastEvent,
    lastStatus,
  }
}
