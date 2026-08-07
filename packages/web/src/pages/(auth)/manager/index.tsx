import { EVENTS } from "@razzia/common/constants"
import type { PublicUser } from "@razzia/common/types/user"
import Loader from "@razzia/web/components/Loader"
import { me } from "@razzia/web/features/auth/api"
import ManagerAuth from "@razzia/web/features/auth/components/ManagerAuth"
import { useAuthStore } from "@razzia/web/features/auth/store"
import {
  useEvent,
  useSocket,
} from "@razzia/web/features/game/contexts/socket-context"
import { useManagerStore } from "@razzia/web/features/game/stores/manager"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useEffect, useState } from "react"

const ManagerAuthPage = () => {
  const { setConfig } = useManagerStore()
  const { user, setUser } = useAuthStore()
  const navigate = useNavigate()
  const { socket, isConnected, reconnect } = useSocket()
  const [probed, setProbed] = useState(false)

  // Probe an existing session so returning managers skip the prompt.
  useEffect(() => {
    let active = true

    me().then((existing) => {
      if (existing) {
        // Populate the global auth store even if this component has already
        // unmounted: the socket CONFIG event can navigate to /manager/config
        // before this probe resolves, and the user must survive that race so
        // permission-gated UI (e.g. the share button) renders correctly.
        setUser(existing)
      }

      if (active) {
        setProbed(true)
      }
    })

    return () => {
      active = false
    }
  }, [setUser])

  // Once authenticated and the socket carries the cookie, request the config.
  useEffect(() => {
    if (user && isConnected) {
      socket.emit(EVENTS.MANAGER.GET_CONFIG)
    }
    // oxlint-disable-next-line
  }, [user, isConnected])

  useEvent(EVENTS.MANAGER.CONFIG, (data) => {
    setConfig(data)
    navigate({ to: "/manager/config" })
  })

  useEvent(EVENTS.MANAGER.UNAUTHORIZED, () => {
    // Session is stale/absent — fall back to the auth screen.
    setUser(null)
  })

  const handleAuthed = (authedUser: PublicUser) => {
    setUser(authedUser)
    // Re-run the WS handshake so socket.data.user is populated from the cookie.
    reconnect()
  }

  if (!probed || user) {
    return <Loader className="h-23" />
  }

  return <ManagerAuth onAuthed={handleAuthed} />
}

export const Route = createFileRoute("/(auth)/manager/")({
  component: ManagerAuthPage,
})
