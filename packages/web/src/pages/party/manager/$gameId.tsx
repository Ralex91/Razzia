import { EVENTS } from "@razzia/common/constants"
import { STATUS } from "@razzia/common/types/game/status"
import GameWrapper from "@razzia/web/features/game/components/GameWrapper"
import {
  socketClient,
  useEvent,
  useSocket,
} from "@razzia/web/features/game/contexts/socket-context"
import { useSocketConnection } from "@razzia/web/features/game/hooks/useSocketConnection"
import { useManagerStore } from "@razzia/web/features/game/stores/manager"
import { useQuestionStore } from "@razzia/web/features/game/stores/question"
import {
  GAME_STATE_COMPONENTS_MANAGER,
  MANAGER_SKIP_EVENTS,
  isKeyOf,
} from "@razzia/web/features/game/utils/constants"
import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router"
import { useEffect } from "react"
import toast from "react-hot-toast"
import { useTranslation } from "react-i18next"

const ManagerGamePage = () => {
  const navigate = useNavigate()
  const { gameId: gameIdParam } = useParams({ from: "/party/manager/$gameId" })
  const { socket, isConnected } = useSocket()
  const { gameId, status, setGameId, setStatus, setPlayers, reset } =
    useManagerStore()
  const { setQuestionStates } = useQuestionStore()
  const { t } = useTranslation()

  useSocketConnection()

  useEvent(EVENTS.GAME.STATUS, ({ name, data }) => {
    if (name in GAME_STATE_COMPONENTS_MANAGER) {
      setStatus(name, data)
    }
  })

  useEffect(() => {
    if (isConnected && gameIdParam) {
      socket.emit(EVENTS.MANAGER.RECONNECT, { gameId: gameIdParam })
    }
  }, [isConnected, gameIdParam, socket])

  useEvent(
    EVENTS.MANAGER.SUCCESS_RECONNECT,
    ({
      gameId: reconnectGameId,
      status: reconnectStatus,
      players,
      currentQuestion,
    }) => {
      setGameId(reconnectGameId)
      setStatus(reconnectStatus.name, reconnectStatus.data)
      setPlayers(players)
      setQuestionStates(currentQuestion)
    },
  )

  useEvent(EVENTS.GAME.RESET, (message) => {
    navigate({ to: "/manager/config" })
    reset()
    setQuestionStates(null)
    toast.error(t(message))
  })

  const handleSkip = () => {
    if (!status) {
      return
    }

    if (status.name === STATUS.FINISHED) {
      navigate({ to: "/manager/config" })
      reset()
      setQuestionStates(null)

      return
    }

    if (!gameId) {
      return
    }

    if (isKeyOf(MANAGER_SKIP_EVENTS, status.name)) {
      socket.emit(MANAGER_SKIP_EVENTS[status.name], { gameId })
    }
  }

  const handleBack = () => {
    navigate({ to: "/manager/config" })
    reset()
    setQuestionStates(null)
  }

  const CurrentComponent =
    status && isKeyOf(GAME_STATE_COMPONENTS_MANAGER, status.name)
      ? GAME_STATE_COMPONENTS_MANAGER[status.name]
      : null

  if (!status) {
    return null
  }

  return (
    <GameWrapper
      statusName={status.name}
      onNext={handleSkip}
      onBack={status.name === STATUS.SHOW_ROOM ? handleBack : undefined}
      manager
    >
      {CurrentComponent && <CurrentComponent data={status.data as never} />}
    </GameWrapper>
  )
}

export const Route = createFileRoute("/party/manager/$gameId")({
  component: ManagerGamePage,
  onLeave: ({ params: { gameId } }) => {
    socketClient.emit(EVENTS.MANAGER.LEAVE, { gameId })
  },
})
