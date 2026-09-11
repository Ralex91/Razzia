import type { Server } from "@razzia/common/types/game/socket"

let instance: Server | null = null

export const setIo = (io: Server): void => {
  instance = io
}

export const getIo = (): Server => {
  if (!instance) {
    throw new Error("Socket server not initialised")
  }

  return instance
}
