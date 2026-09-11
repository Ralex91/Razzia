import { SESSION_ROLES } from "@razzia/common/constants"
import { getRole } from "@razzia/web/lib/session"
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router"

export const Route = createFileRoute("/manager/quizz")({
  beforeLoad: () => {
    if (getRole() !== SESSION_ROLES.MANAGER) {
      // oxlint-disable-next-line typescript/only-throw-error
      throw redirect({ to: "/manager" })
    }
  },
  component: RouteComponent,
})

function RouteComponent() {
  return <Outlet />
}
