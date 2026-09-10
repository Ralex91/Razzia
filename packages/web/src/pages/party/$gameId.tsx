import { EVENTS } from "@razzia/common/constants"
import { STATUS } from "@razzia/common/types/game/status"
import GameWrapper from "@razzia/web/features/game/components/GameWrapper"
import {
  socketClient,
  useEvent,
  useSocket,
} from "@razzia/web/features/game/contexts/socket-context"
import { useSocketConnection } from "@razzia/web/features/game/hooks/useSocketConnection"
import { usePlayerStore } from "@razzia/web/features/game/stores/player"
import { useQuestionStore } from "@razzia/web/features/game/stores/question"
import {
  GAME_STATE_COMPONENTS,
  isKeyOf,
} from "@razzia/web/features/game/utils/constants"
import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router"
import { useEffect, useRef } from "react"
import toast from "react-hot-toast"
import { useTranslation } from "react-i18next"

const PlayerGamePage = () => {
  const navigate = useNavigate()
  const { socket, isConnected } = useSocket()
  const { gameId: gameIdParam } = useParams({ from: "/party/$gameId" })
  const { status, setPlayer, setGameId, setStatus, setJoinTicket, reset } =
    usePlayerStore()
  const { setQuestionStates } = useQuestionStore()
  const { t } = useTranslation()
  const syncedRef = useRef(false)

  useSocketConnection()

  useEffect(() => {
    if (!isConnected) {
      syncedRef.current = false

      return
    }

    if (syncedRef.current) {
      return
    }

    syncedRef.current = true

    const { joinTicket } = usePlayerStore.getState()

    if (joinTicket) {
      socket.emit(EVENTS.PLAYER.LOGIN, { ticket: joinTicket })

      return
    }

    socket.emit(EVENTS.PLAYER.RECONNECT, { gameId: gameIdParam })
  }, [isConnected, gameIdParam, socket])

  useEvent(EVENTS.GAME.SUCCESS_JOIN, (joinedGameId) => {
    setGameId(joinedGameId)
    setJoinTicket(null)
    setStatus(STATUS.WAIT, { text: "game:waitingForPlayers" })
  })

  useEvent(
    EVENTS.PLAYER.SUCCESS_RECONNECT,
    ({
      gameId: reconnectGameId,
      status: reconnectStatus,
      player,
      currentQuestion,
    }) => {
      setGameId(reconnectGameId)
      setStatus(reconnectStatus.name, reconnectStatus.data)
      setPlayer(player)
      setQuestionStates(currentQuestion)
    },
  )

  useEvent(EVENTS.GAME.STATUS, ({ name, data }) => {
    if (name in GAME_STATE_COMPONENTS) {
      setStatus(name, data)
    }
  })

  useEvent(EVENTS.GAME.RESET, (message) => {
    localStorage.removeItem("game_pin")
    localStorage.removeItem("game_id")
    navigate({ to: "/" })
    reset()
    setQuestionStates(null)
    toast.error(t(message))
  })

  if (!gameIdParam) {
    return null
  }

  const CurrentComponent =
    status && isKeyOf(GAME_STATE_COMPONENTS, status.name)
      ? GAME_STATE_COMPONENTS[status.name]
      : null

  if (!status) {
    return null
  }

  return (
    <GameWrapper statusName={status.name}>
      {CurrentComponent && <CurrentComponent data={status.data as never} />}
    </GameWrapper>
  )
}

export const Route = createFileRoute("/party/$gameId")({
  component: PlayerGamePage,
  onLeave: ({ params: { gameId } }) => {
    socketClient.emit(EVENTS.PLAYER.LEAVE, { gameId })
  },
})
