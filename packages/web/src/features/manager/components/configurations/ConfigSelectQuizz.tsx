import { STATUS } from "@razzia/common/types/game/status"
import Button from "@razzia/web/components/Button"
import Loader from "@razzia/web/components/Loader"
import { useManagerStore } from "@razzia/web/features/game/stores/manager"
import {
  createGame,
  quizzListQuery,
} from "@razzia/web/features/manager/queries"
import { ApiError } from "@razzia/web/lib/api"
import { useMutation, useQuery } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import clsx from "clsx"
import { Check } from "lucide-react"
import { useState } from "react"
import toast from "react-hot-toast"
import { useTranslation } from "react-i18next"

const ConfigSelectQuizz = () => {
  const { data, isPending } = useQuery(quizzListQuery())
  const { setGameId, setStatus } = useManagerStore()
  const [selected, setSelected] = useState<string | null>(null)
  const navigate = useNavigate()
  const { t } = useTranslation()

  const { mutate: start } = useMutation({
    mutationFn: createGame,
    onSuccess: ({ gameId, inviteCode }) => {
      setGameId(gameId)
      setStatus(STATUS.SHOW_ROOM, {
        text: "game:waitingForPlayers",
        inviteCode,
      })
      navigate({ to: "/party/manager/$gameId", params: { gameId } })
    },
    onError: (error) => {
      toast.error(
        t(error instanceof ApiError ? error.key : "errors:quizz.notFound"),
      )
    },
  })

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

    start(selected)
  }

  if (isPending) {
    return <Loader className="text-primary mx-auto my-8 max-h-16" />
  }

  const quizzList = data?.quizz ?? []

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {quizzList.length > 0 && (
        <Button className="mb-4 shrink-0" onClick={handleSubmit}>
          {t("manager:quizz.startGame")}
        </Button>
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
