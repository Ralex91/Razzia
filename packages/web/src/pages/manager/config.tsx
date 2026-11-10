import { createFileRoute, redirect } from "@tanstack/react-router"
import { SESSION_ROLES } from "@razzia/common/constants"
import Background from "@razzia/web/components/Background"
import Configurations from "@razzia/web/features/manager/components/configurations"
import { getRole } from "@razzia/web/lib/session"

const ManagerConfigPage = () => (
  <Background>
    <Configurations />
  </Background>
)

export const Route = createFileRoute("/manager/config")({
  beforeLoad: () => {
    if (getRole() !== SESSION_ROLES.MANAGER) {
      // oxlint-disable-next-line typescript/only-throw-error
      throw redirect({ to: "/manager" })
    }
  },
  component: ManagerConfigPage,
})
