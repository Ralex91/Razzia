import { EVENTS } from "@razzia/common/constants"
import Button from "@razzia/web/components/Button"
import Card from "@razzia/web/components/Card"
import {
  useEvent,
  useSocket,
} from "@razzia/web/features/game/contexts/socket-context"
import { usePlayerStore } from "@razzia/web/features/game/stores/player"
import { useQuestionStore } from "@razzia/web/features/game/stores/question"
import { useNavigate } from "@tanstack/react-router"
import { X } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import toast from "react-hot-toast"
import { useTranslation } from "react-i18next"

const Reconnect = () => {
  const { isConnected, socket } = useSocket()
  const { setGameId, setPlayer, setStatus } = usePlayerStore()
  const { setQuestionStates } = useQuestionStore()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [savedPin, setSavedPin] = useState(() =>
    localStorage.getItem("game_pin"),
  )
  const [isChecking, setIsChecking] = useState(
    Boolean(localStorage.getItem("game_pin")),
  )
  const hasCheckedRef = useRef(false)

  useEffect(() => {
    if (!isConnected || hasCheckedRef.current || !savedPin) {
      return
    }

    hasCheckedRef.current = true
    socket.emit(EVENTS.PLAYER.CHECK_PIN, savedPin)
  }, [isConnected, savedPin, socket])

  useEvent(EVENTS.PLAYER.CHECK_PIN_RESULT, ({ valid }) => {
    setIsChecking(false)

    if (!valid) {
      localStorage.removeItem("game_pin")
      setSavedPin(null)
    }
  })

  const handleReconnect = () => {
    if (savedPin) {
      socket.emit(EVENTS.PLAYER.JOIN, savedPin)
    }
  }

  const handleDismiss = () => {
    localStorage.removeItem("game_pin")
    setSavedPin(null)
  }

  useEvent(EVENTS.GAME.RESET, (message) => {
    toast.error(t(message))
  })

  useEvent(
    EVENTS.PLAYER.SUCCESS_RECONNECT,
    ({ gameId, status, player, currentQuestion }) => {
      setGameId(gameId)
      setStatus(status.name, status.data)
      setPlayer(player)
      setQuestionStates(currentQuestion)
      navigate({ to: "/party/$gameId", params: { gameId } })
    },
  )

  if (!savedPin || isChecking) {
    return null
  }

  return (
    <Card className="relative mt-4 gap-3">
      <button
        className="absolute top-3 right-3 opacity-40 hover:opacity-100"
        onClick={handleDismiss}
      >
        <X className="size-6" />
      </button>
      <p className="font-semibold">{t("game:reconnectTitle")}</p>
      <Button onClick={handleReconnect}>{t("game:reconnect")}</Button>
    </Card>
  )
}

export default Reconnect
