import { MAX_POINTS } from "@razzia/common/constants"
import type { Question } from "@razzia/common/types/game"
import type { Socket } from "@razzia/common/types/game/socket"
import Game from "@razzia/socket/services/game"
import Registry from "@razzia/socket/services/registry"
import { nanoid } from "nanoid"

export const withGame = (
  gameId: string | undefined,
  socket: Socket,
  callback: (_game: Game) => void | Promise<void>,
): void => {
  if (!gameId) {
    socket.emit("game:errorMessage", "errors:game.notFound")

    return
  }

  const registry = Registry.getInstance()
  const game = registry.getGameById(gameId)

  if (!game) {
    socket.emit("game:errorMessage", "errors:game.notFound")

    return
  }

  callback(game)
}

export const createInviteCode = (length = 6) => {
  let result = ""
  const characters = "0123456789"
  const charactersLength = characters.length

  for (let i = 0; i < length; i += 1) {
    const randomIndex = Math.floor(Math.random() * charactersLength)
    result += characters.charAt(randomIndex)
  }

  return result
}

export const normalizeFilename = (subject: string) => {
  const slug = subject
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/gu, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/gu, "-")
    .replace(/[^a-z0-9-]/gu, "")
    .slice(0, 10)

  const shortId = nanoid(8)

  return `${slug}-${shortId}`
}

export const orderToPoint = (
  index: number,
  totalPlayers: number,
  maxPoints = MAX_POINTS,
): number => {
  if (totalPlayers <= 1) {
    return maxPoints
  }

  return Math.round(maxPoints - (index / (totalPlayers - 1)) * (maxPoints / 2))
}

export const timeToPoint = (startTime: number, question: Question): number => {
  const maxPoints = question.maxPoints ?? MAX_POINTS
  let points = maxPoints

  const actualTime = Date.now()
  const tempsPasseEnSecondes = (actualTime - startTime) / 1000

  points -= (maxPoints / question.time) * tempsPasseEnSecondes
  points = Math.max(0, points)

  return points
}
