import ErrorPage from "@razzia/web/components/ErrorPage"
import NotFound from "@razzia/web/components/NotFound"
import { SocketProvider } from "@razzia/web/features/game/contexts/socket-context"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { createRootRoute, Outlet } from "@tanstack/react-router"
import { useEffect } from "react"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
})

const GameLayout = () => {
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
    <QueryClientProvider client={queryClient}>
      <SocketProvider>
        <GameLayout />
      </SocketProvider>
    </QueryClientProvider>
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
