import clsx from "clsx"
import { Check, X } from "lucide-react"
import { useTranslation } from "react-i18next"
import type { PlayerAnswerRecord } from "@razzia/common/types/game"
import { QUIZZ_MODES } from "@razzia/common/constants"
import { isEstimationOptions } from "@razzia/common/questions/options"
import {
  ANSWERS_COLORS,
  ANSWERS_LABELS,
} from "@razzia/web/features/game/utils/constants"
import { useResultModal } from "@razzia/web/features/manager/contexts/result-modal-context"
import { formatValue } from "@razzia/web/features/questions/estimation/utils"
import { isAnswerCorrect } from "@razzia/web/features/questions/utils"

interface RowProps {
  playerAnswer: PlayerAnswerRecord
}

const ResultModalTableRow = ({ playerAnswer }: RowProps) => {
  const { result, questionResult, getPlayerPoints } = useResultModal()
  const { t } = useTranslation()

  const { playerName, answerIds, correct, points } = playerAnswer
  const hasAnswer = answerIds !== null && answerIds.length > 0

  const isCorrect = correct ?? isAnswerCorrect(questionResult, answerIds)
  const isEstimation = isEstimationOptions(questionResult.options)

  return (
    <tr>
      <td className="px-5 py-2.5 font-medium">{playerName}</td>
      <td className="px-4 py-2.5">
        {hasAnswer && isEstimation && (
          <span className="inline-flex rounded-md bg-accent px-2 py-1 text-xs font-bold text-accent-foreground">
            {formatValue(answerIds[0])}
          </span>
        )}
        {hasAnswer && !isEstimation && (
          <div className="flex flex-wrap gap-1">
            {answerIds.map((id) => (
              <span
                key={id}
                className={clsx(
                  "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-white",
                  ANSWERS_COLORS[id % 4],
                )}
              >
                <span className="font-bold">{ANSWERS_LABELS[id % 4]}</span>
                <span className="max-w-30 truncate">
                  {questionResult.answers[id]}
                </span>
              </span>
            ))}
          </div>
        )}
        {!hasAnswer && <span className="text-xs text-muted-foreground">-</span>}
      </td>
      {result.gameMode !== QUIZZ_MODES.SURVEY && (
        <td className="px-4 py-2.5">
          {isCorrect ? (
            <span className="flex items-center gap-1 text-correct">
              <Check className="size-4 stroke-4" />
              {t("manager:result.table.correct")}
            </span>
          ) : (
            <span className="flex items-center gap-1 text-red-500">
              <X className="size-4 stroke-4" />
              {t("manager:result.table.incorrect")}
            </span>
          )}
        </td>
      )}
      <td className="px-4 py-2.5 text-right font-semibold text-foreground">
        {points ?? getPlayerPoints(playerName)}
      </td>
    </tr>
  )
}

const ResultModalTable = () => {
  const { result, questionResult } = useResultModal()
  const { t } = useTranslation()

  return (
    <table className="w-full text-sm">
      <thead className="sticky top-0">
        <tr className="border-b-2 border-accent bg-muted text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          <th className="px-5 py-2.5">{t("manager:result.table.player")}</th>
          <th className="px-4 py-2.5">{t("manager:result.table.answered")}</th>
          {result.gameMode !== QUIZZ_MODES.SURVEY && (
            <th className="px-4 py-2.5">
              {t("manager:result.table.correctIncorrect")}
            </th>
          )}
          <th className="px-4 py-2.5 text-right">
            {t("manager:result.table.points")}
          </th>
        </tr>
      </thead>
      <tbody className="divide-y-2 divide-muted">
        {questionResult.playerAnswers.map((playerAnswer, i) => (
          <ResultModalTableRow key={i} playerAnswer={playerAnswer} />
        ))}
      </tbody>
    </table>
  )
}

export default ResultModalTable
