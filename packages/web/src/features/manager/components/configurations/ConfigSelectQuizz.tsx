import { EVENTS } from "@razzia/common/constants"
import Button from "@razzia/web/components/Button"
import { can } from "@razzia/web/features/auth/permissions"
import { useSocket } from "@razzia/web/features/game/contexts/socket-context"
import QuizzBadge from "@razzia/web/features/manager/components/configurations/QuizzBadge"
import { useConfig } from "@razzia/web/features/manager/contexts/config-context"
import clsx from "clsx"
import { Check } from "lucide-react"
import { useState } from "react"
import toast from "react-hot-toast"
import { useTranslation } from "react-i18next"

const ConfigSelectQuizz = () => {
  const { socket } = useSocket()
  const { quizz: quizzList } = useConfig()
  const [selected, setSelected] = useState<string | null>(null)
  const { t } = useTranslation()

  const handleSelect = (id: string) => () => {
    if (selected === id) {
      setSelected(null)
    } else {
      setSelected(id)
    }
  }

  const handleSubmit = () => {
    if (!selected) {
      toast.error(t("manager:quizz.pleaseSelect"))

      return
    }

    socket.emit(EVENTS.GAME.CREATE, selected)
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {quizzList.length > 0 && (
        <Button className="mb-4 shrink-0" onClick={handleSubmit}>
          {t("manager:quizz.startGame")}
        </Button>
      )}
      <div className="min-h-0 flex-1 space-y-2 overflow-auto p-0.5">
        {quizzList.map((quizz) => {
          const runnable = can(quizz, "run")

          return (
            <button
              key={quizz.id}
              disabled={!runnable}
              title={!runnable ? t("manager:quizz.runNotAllowed") : undefined}
              className={clsx(
                "border-accent flex h-12 w-full items-center justify-between rounded-md border-2 p-3",
                !runnable && "cursor-not-allowed opacity-50",
              )}
              onClick={runnable ? handleSelect(quizz.id) : undefined}
            >
              <span className="flex min-w-0 items-center gap-2">
                <span className="text-foreground truncate font-medium">
                  {quizz.subject}
                </span>
                <QuizzBadge quizz={quizz} />
              </span>

              <div
                className={clsx(
                  "bg-muted size-6 shrink-0 rounded",
                  selected === quizz.id && "bg-primary border-primary/80",
                )}
              >
                {selected === quizz.id && (
                  <Check className="size-full stroke-4 p-1 text-white" />
                )}
              </div>
            </button>
          )
        })}
        {!quizzList.length && (
          <div className="text-muted-foreground my-8 text-center">
            <p>{t("manager:quizz.notFound")}</p>
            <p className="text-sm">{t("manager:quizz.pleaseCreate")}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default ConfigSelectQuizz
