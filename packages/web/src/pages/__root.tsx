import ErrorPage from "@razzia/web/components/ErrorPage"
import NotFound from "@razzia/web/components/NotFound"
import {
  SocketProvider,
  useSocket,
} from "@razzia/web/features/game/contexts/socket-context"
import { AuthProvider } from "@razzia/web/features/auth/contexts/auth-context"
import { createRootRoute, Outlet } from "@tanstack/react-router"
import { useEffect } from "react"

const GameLayout = () => {
  const { isConnected, connect } = useSocket()

  useEffect(() => {
    if (!isConnected) {
      connect()
    }
  }, [connect, isConnected])

  useEffect(() => {
    document.body.classList.add("bg-secondary")

    return () => {
      document.body.classList.remove("bg-secondary")
    }
  }, [])

  return (
    <div className="bg-secondary antialiased">
      <Outlet />
    </div>
  )
}

export const Route = createRootRoute({
  component: () => (
    <SocketProvider>
      <AuthProvider>
        <GameLayout />
      </AuthProvider>
    </SocketProvider>
  ),
  errorComponent: ({ error }) => (
    <div className="bg-secondary antialiased">
      <ErrorPage error={error} />
    </div>
  ),
  notFoundComponent: () => (
    <div className="bg-secondary antialiased">
      <NotFound />
    </div>
  ),
})
