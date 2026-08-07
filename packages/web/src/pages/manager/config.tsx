import { EVENTS } from "@razzia/common/constants"
import { STATUS } from "@razzia/common/types/game/status"
import Background from "@razzia/web/components/Background"
import Loader from "@razzia/web/components/Loader"
import { me } from "@razzia/web/features/auth/api"
import { useAuthStore } from "@razzia/web/features/auth/store"
import {
  useEvent,
  useSocket,
} from "@razzia/web/features/game/contexts/socket-context"
import { useManagerStore } from "@razzia/web/features/game/stores/manager"
import Configurations from "@razzia/web/features/manager/components/configurations"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useEffect, useState } from "react"

const ManagerConfigPage = () => {
  const { isConnected } = useSocket()
  const { setGameId, setStatus, setConfig, config } = useManagerStore()
  const { user, setUser } = useAuthStore()
  const navigate = useNavigate()
  const [probed, setProbed] = useState(!!user)

  // Belt-and-suspenders: the auth store can still be empty here if the session
  // probe on /manager lost the race against the socket CONFIG event. Re-probe
  // so this page never renders permission-gated UI (e.g. the share button)
  // with a null user.
  useEffect(() => {
    if (user) {
      setProbed(true)
      return
    }

    let active = true

    me().then((existing) => {
      if (existing) {
        setUser(existing)
      }

      if (active) {
        setProbed(true)
      }
    })

    return () => {
      active = false
    }
  }, [user, setUser])

  useEvent(EVENTS.MANAGER.CONFIG, (data) => {
    setConfig(data)
  })

  useEvent(EVENTS.MANAGER.GAME_CREATED, ({ gameId, inviteCode }) => {
    setGameId(gameId)
    setStatus(STATUS.SHOW_ROOM, {
      text: "game:waitingForPlayers",
      inviteCode,
    })
    navigate({ to: "/party/manager/$gameId", params: { gameId } })
  })

  if (!isConnected || !probed) {
    return (
      <Background>
        <Loader className="h-23" />
      </Background>
    )
  }

  if (!config || !user) {
    return navigate({ to: "/manager" })
  }

  return (
    <Background>
      <Configurations data={config} />
    </Background>
  )
}

export const Route = createFileRoute("/manager/config")({
  component: ManagerConfigPage,
})
