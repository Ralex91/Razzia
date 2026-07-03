import {
  ANSWERS_COLORS,
  ANSWERS_LABELS,
} from "@razzia/web/features/game/utils/constants"
import { useResultModal } from "@razzia/web/features/manager/contexts/result-modal-context"
import clsx from "clsx"
import { Check, X } from "lucide-react"
import { useTranslation } from "react-i18next"

const ResultModalTable = () => {
  const { questionResult, getPlayerPoints } = useResultModal()
  const { t } = useTranslation()

  return (
    <table className="w-full text-sm">
      <thead className="sticky top-0">
        <tr className="border-b-2 border-gray-200 bg-gray-50 text-left text-xs font-semibold tracking-wide text-gray-500 uppercase">
          <th className="px-5 py-2.5">{t("manager:result.table.player")}</th>
          <th className="px-4 py-2.5">{t("manager:result.table.answered")}</th>
          <th className="px-4 py-2.5">
            {t("manager:result.table.correctIncorrect")}
          </th>
          <th className="px-4 py-2.5 text-right">
            {t("manager:result.table.points")}
          </th>
        </tr>
      </thead>
      <tbody className="divide-y-2 divide-gray-100">
        {questionResult.playerAnswers.map((pa, i) => {
          const hasAnswer = pa.answerIds !== null && pa.answerIds.length > 0
          const isCorrect =
            pa.answerIds?.some((id) => questionResult.solutions.includes(id)) ??
            false

          return (
            <tr key={i}>
              <td className="px-5 py-2.5 font-medium">{pa.playerName}</td>
              <td className="px-4 py-2.5">
                {hasAnswer ? (
                  <div className="flex flex-wrap gap-1">
                    {pa.answerIds?.map((id) => (
                      <span
                        key={id}
                        className={clsx(
                          "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-white",
                          ANSWERS_COLORS[id % 4],
                        )}
                      >
                        <span className="font-bold">
                          {ANSWERS_LABELS[id % 4]}
                        </span>
                        <span className="max-w-30 truncate">
                          {questionResult.answers[id]}
                        </span>
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-gray-400">-</span>
                )}
              </td>
              <td className="px-4 py-2.5">
                {isCorrect ? (
                  <span className="flex items-center gap-1 text-green-600">
                    <Check className="size-4 stroke-4" />{" "}
                    {t("manager:result.table.correct")}
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-red-500">
                    <X className="size-4 stroke-4" />{" "}
                    {t("manager:result.table.incorrect")}
                  </span>
                )}
              </td>
              <td className="px-4 py-2.5 text-right font-semibold text-gray-700">
                {getPlayerPoints(pa.playerName)}
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

export default ResultModalTable
