import { EVENTS } from "@razzia/common/constants"
import Button from "@razzia/web/components/Button"
import Switch from "@razzia/web/components/Switch"
import { useSocket } from "@razzia/web/features/game/contexts/socket-context"
import { useConfig } from "@razzia/web/features/manager/contexts/config-context"
import clsx from "clsx"
import { Check, FastForward, Shuffle } from "lucide-react"
import { useState } from "react"
import toast from "react-hot-toast"
import { useTranslation } from "react-i18next"

const ConfigSelectQuizz = () => {
  const { socket } = useSocket()
  const { quizz: quizzList } = useConfig()
  const [selected, setSelected] = useState<string | null>(null)
  const [autoAdvance, setAutoAdvance] = useState(false)
  const [autoAdvanceDelay, setAutoAdvanceDelay] = useState(4)
  const [shuffle, setShuffle] = useState(false)
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

    socket.emit(EVENTS.GAME.CREATE, {
      quizzId: selected,
      autoAdvance,
      ...(autoAdvance ? { autoAdvanceDelay } : {}),
      shuffle,
    })
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {quizzList.length > 0 && (
        <Button className="mb-2 shrink-0" onClick={handleSubmit}>
          {t("manager:quizz.startGame")}
        </Button>
      )}
      {quizzList.length > 0 && (
        <div className="mb-4 flex flex-col gap-2 rounded-lg px-2 py-1.5 text-sm">
          <label className="flex shrink-0 cursor-pointer items-center justify-between">
            <span className="text-muted-foreground flex items-center gap-2">
              <FastForward className="size-4" />
              {t("manager:autoAdvance")}
            </span>
            <Switch
              checked={autoAdvance}
              onCheckedChange={setAutoAdvance}
            />
          </label>
          {autoAdvance && (
            <div className="text-muted-foreground flex items-center gap-2 pl-6">
              <span className="text-xs">{t("manager:autoAdvanceDelay")}</span>
              <input
                type="number"
                min={2}
                max={15}
                value={autoAdvanceDelay}
                onChange={(e) =>
                  setAutoAdvanceDelay(Math.max(2, Math.min(15, Number(e.target.value))))
                }
                className="bg-muted text-foreground w-14 rounded-md px-2 py-1 text-center text-xs outline-none"
              />
              <span className="text-xs">sec</span>
            </div>
          )}
          <label className="flex shrink-0 cursor-pointer items-center justify-between">
            <span className="text-muted-foreground flex items-center gap-2">
              <Shuffle className="size-4" />
              {t("manager:shuffle")}
            </span>
            <Switch
              checked={shuffle}
              onCheckedChange={setShuffle}
            />
          </label>
        </div>
      )}
      <div className="min-h-0 flex-1 space-y-2 overflow-auto p-0.5">
        {quizzList.map((quizz) => (
          <button
            key={quizz.id}
            className="border-accent flex h-12 w-full items-center justify-between rounded-md border-2 p-3"
            onClick={handleSelect(quizz.id)}
          >
            <p className="text-foreground truncate font-medium">
              {quizz.subject}
            </p>

            <div
              className={clsx(
                "bg-muted size-6 rounded",
                selected === quizz.id && "bg-primary border-primary/80",
              )}
            >
              {selected === quizz.id && (
                <Check className="size-full stroke-4 p-1 text-white" />
              )}
            </div>
          </button>
        ))}
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
