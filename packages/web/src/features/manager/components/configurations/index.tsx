import Card from "@razzia/web/components/Card"
import LanguageSwitcher from "@razzia/web/components/LanguageSwitcher"
import { useManagerStore } from "@razzia/web/features/game/stores/manager"
import ConfigManageQuizz from "@razzia/web/features/manager/components/configurations/ConfigManageQuizz"
import ConfigResults from "@razzia/web/features/manager/components/configurations/ConfigResults"
import ConfigSelectQuizz from "@razzia/web/features/manager/components/configurations/ConfigSelectQuizz"
import ConfigTabButton from "@razzia/web/features/manager/components/configurations/ConfigTabButton"
import { managerLogout } from "@razzia/web/features/manager/queries"
import { setToken } from "@razzia/web/lib/session"
import { useMutation, useQueryClient } from "@tanstack/react-query"
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

const Configurations = () => {
  const [selectedTab, setSelectedTab] = useState(0)
  const { reset } = useManagerStore()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const TabComponent = tabs[selectedTab].component

  const handleSelect = (index: number) => () => {
    setSelectedTab(index)
  }

  const { mutate: logout } = useMutation({
    mutationFn: managerLogout,
    onSuccess: (session) => setToken(session.token),
    onSettled: () => {
      queryClient.clear()
      reset()
      navigate({ to: "/manager" })
    },
  })

  return (
    <Card className="max-h-[80svh] w-full max-w-md">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-lg font-semibold">
          {t("manager:configurationsTitle")}
        </p>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <button
            className="text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-sm p-1.5"
            onClick={() => logout()}
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
  )
}

export default Configurations
