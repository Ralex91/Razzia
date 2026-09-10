import { useSocket } from "@razzia/web/features/game/contexts/socket-context"
import { useEffect } from "react"

const DISCONNECT_DELAY_MS = 1000

let disconnectTimer: ReturnType<typeof setTimeout> | null = null

export const useSocketConnection = () => {
  const { connect, disconnect } = useSocket()

  useEffect(() => {
    if (disconnectTimer) {
      clearTimeout(disconnectTimer)
      disconnectTimer = null
    }

    connect()

    return () => {
      disconnectTimer = setTimeout(() => {
        disconnectTimer = null
        disconnect()
      }, DISCONNECT_DELAY_MS)
    }
  }, [connect, disconnect])
}
