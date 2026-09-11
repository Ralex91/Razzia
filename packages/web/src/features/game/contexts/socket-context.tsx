import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@razzia/common/types/game/socket"
import { clearToken, ensureSession } from "@razzia/web/lib/session"
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react"
import toast from "react-hot-toast"
import { useTranslation } from "react-i18next"
import { io, Socket } from "socket.io-client"

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>

interface SocketContextValue {
  socket: TypedSocket
  isConnected: boolean
  clientId: string
  connect: () => void
  disconnect: () => void
  reconnect: () => void
}

const MAX_AUTH_RETRIES = 2

export const socketClient: TypedSocket = io("/", {
  path: "/ws",
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  auth: (cb) => {
    ensureSession()
      .then((session) => cb({ token: session.token }))
      .catch(() => cb({ token: "" }))
  },
})

const SocketContext = createContext<SocketContextValue>({
  socket: socketClient,
  isConnected: false,
  clientId: "",
  connect: () => {
    /* Empty */
  },
  disconnect: () => {
    /* Empty */
  },
  reconnect: () => {
    /* Empty */
  },
})

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [isConnected, setIsConnected] = useState(false)
  const [clientId, setClientId] = useState("")
  const { t } = useTranslation()

  useEffect(() => {
    ensureSession().then((session) => setClientId(session.clientId))
  }, [])

  useEffect(() => {
    let authRetries = 0

    const handleConnect = () => {
      authRetries = 0
      setIsConnected(true)
    }

    const handleDisconnect = () => setIsConnected(false)

    const handleError = (err: Error & { data?: { code?: string } }) => {
      console.error("Connection error:", err.message)

      const code = err.data?.code

      if (!code?.startsWith("TOKEN_")) {
        return
      }

      if (authRetries >= MAX_AUTH_RETRIES) {
        toast.error(t("errors:auth.sessionFailed"))

        return
      }

      authRetries += 1
      clearToken()

      ensureSession()
        .then((session) => {
          setClientId(session.clientId)
          socketClient.connect()
        })
        .catch(() => toast.error(t("errors:auth.sessionFailed")))
    }

    socketClient.on("connect", handleConnect)
    socketClient.on("disconnect", handleDisconnect)
    socketClient.on("connect_error", handleError)

    return () => {
      socketClient.off("connect", handleConnect)
      socketClient.off("disconnect", handleDisconnect)
      socketClient.off("connect_error", handleError)
      socketClient.disconnect()
    }
  }, [t])

  const connect = useCallback(() => {
    if (!socketClient.connected) {
      socketClient.connect()
    }
  }, [])

  const disconnect = useCallback(() => {
    if (socketClient.connected) {
      socketClient.disconnect()
    }
  }, [])

  const reconnect = useCallback(() => {
    socketClient.disconnect()
    socketClient.connect()
  }, [])

  return (
    <SocketContext.Provider
      value={{
        socket: socketClient,
        isConnected,
        clientId,
        connect,
        disconnect,
        reconnect,
      }}
    >
      {children}
    </SocketContext.Provider>
  )
}

export const useSocket = () => useContext(SocketContext)

export const useEvent = <E extends keyof ServerToClientEvents>(
  event: E,
  callback: ServerToClientEvents[E],
) => {
  const { socket } = useSocket()

  useEffect(() => {
    // oxlint-disable-next-line no-explicit-any, no-unsafe-argument
    socket.on(event, callback as any)

    return () => {
      // oxlint-disable-next-line no-explicit-any, no-unsafe-argument
      socket.off(event, callback as any)
    }
  }, [socket, event, callback])
}
