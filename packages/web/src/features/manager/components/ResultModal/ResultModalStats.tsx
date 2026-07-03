import { useResultModal } from "@razzia/web/features/manager/contexts/result-modal-context"
import { Users } from "lucide-react"
import { useTranslation } from "react-i18next"

const ResultModalStats = () => {
  const { correctPct, answeredCount, totalPlayers } = useResultModal()
  const { t } = useTranslation()

  return (
    <div className="divide-accent border-accent bg-muted/30 flex shrink-0 divide-x-2 border-b-2">
      <div className="flex flex-1 items-center justify-between px-5 py-3">
        <p className="text-muted-foreground text-xs">
          {t("manager:result.stats.correctAnswers")}
        </p>
        <div className="flex items-center gap-2">
          <div className="relative size-6">
            <svg className="size-6 -rotate-90" viewBox="0 0 36 36">
              <circle
                cx="18"
                cy="18"
                r="15"
                fill="none"
                className="stroke-accent"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={`${94 - correctPct * 0.94 - 2} 94`}
                strokeDashoffset={`${-(correctPct * 0.94 + 1)}`}
              />
              <circle
                cx="18"
                cy="18"
                r="15"
                fill="none"
                className="stroke-green-500"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={`${correctPct * 0.94} 94`}
              />
            </svg>
          </div>
          <span className="text-foreground text-sm font-semibold">
            {correctPct}%
          </span>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-between px-5 py-3">
        <p className="text-muted-foreground text-xs">
          {t("manager:result.stats.playersAnswered")}
        </p>
        <div className="flex items-center gap-2">
          <Users className="size-4 text-blue-500" />
          <span className="text-foreground text-sm font-semibold">
            {answeredCount}/{totalPlayers}
          </span>
        </div>
      </div>
    </div>
  )
}

export default ResultModalStats
