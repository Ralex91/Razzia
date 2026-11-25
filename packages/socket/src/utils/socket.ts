import type { Socket } from "@razzia/common/types/game/socket"
import { SESSION_ROLES } from "@razzia/common/constants"

export const getClientId = (socket: Socket): string => socket.data.clientId

export const isManagerSocket = (socket: Socket): boolean =>
  socket.data.role === SESSION_ROLES.MANAGER
