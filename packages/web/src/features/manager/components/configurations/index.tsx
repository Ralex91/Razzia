import type { ManagerConfig } from "@razzia/common/types/manager"
import Card from "@razzia/web/components/Card"
import LanguageSwitcher from "@razzia/web/components/LanguageSwitcher"
import { logout } from "@razzia/web/features/auth/api"
import { useAuthStore } from "@razzia/web/features/auth/store"
import { useSocket } from "@razzia/web/features/game/contexts/socket-context"
import { useManagerStore } from "@razzia/web/features/game/stores/manager"
import ConfigManageQuizz from "@razzia/web/features/manager/components/configurations/ConfigManageQuizz"
import ConfigResults from "@razzia/web/features/manager/components/configurations/ConfigResults"
import ConfigSelectQuizz from "@razzia/web/features/manager/components/configurations/ConfigSelectQuizz"
import ConfigTabButton from "@razzia/web/features/manager/components/configurations/ConfigTabButton"
import { ConfigProvider } from "@razzia/web/features/manager/contexts/config-context"
import { useNavigate } from "@tanstack/react-router"
import { LogOut } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"

const tabs = [
  {
    nameKey: "manager:tabs.play",
    component: ConfigSelectQuizz,
  },
  {
    nameKey: "manager:tabs.quizz",
    component: ConfigManageQuizz,
  },
  {
    nameKey: "manager:tabs.results",
    component: ConfigResults,
  },
]

interface Props {
  data: ManagerConfig
}

const Configurations = ({ data }: Props) => {
  const [selectedTab, setSelectedTab] = useState(0)
  const { reset } = useManagerStore()
  const { setUser } = useAuthStore()
  const { reconnect } = useSocket()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const TabComponent = tabs[selectedTab].component

  const handleSelect = (index: number) => () => {
    setSelectedTab(index)
  }

  const handleLogout = async () => {
    try {
      // Revoke the server-side session and clear the HttpOnly cookie.
      await logout()
    } catch {
      // Even if the request fails, tear down local state below.
    } finally {
      reset()
      setUser(null)
      // Re-run the WS handshake so socket.data.user is reset to null.
      reconnect()
      navigate({ to: "/manager" })
    }
  }

  return (
    <ConfigProvider data={data}>
      <Card className="max-h-[80svh] w-full max-w-md">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-lg font-semibold">
            {t("manager:configurationsTitle")}
          </p>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <button
              className="text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-sm p-1.5"
              onClick={handleLogout}
              title={t("manager:logout")}
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
        <div className="bg-muted flex shrink-0 overflow-hidden rounded-lg">
          {tabs.map((tab, index) => (
            <ConfigTabButton
              key={tab.nameKey}
              active={index === selectedTab}
              onClick={handleSelect(index)}
            >
              {t(tab.nameKey)}
            </ConfigTabButton>
          ))}
        </div>
        <hr className="text-muted my-4 border" />
        <div className="flex min-h-0 flex-1 flex-col">
          <TabComponent />
        </div>
      </Card>
    </ConfigProvider>
  )
}

export default Configurations
