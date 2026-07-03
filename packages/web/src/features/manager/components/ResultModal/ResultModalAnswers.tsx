import { MEDIA_TYPES, NO_TIME_LIMIT } from "@razzia/common/constants"
import type { QuestionMedia } from "@razzia/common/types/game"
import {
  ANSWERS_COLORS,
  ANSWERS_LABELS,
} from "@razzia/web/features/game/utils/constants"
import { useResultModal } from "@razzia/web/features/manager/contexts/result-modal-context"
import clsx from "clsx"
import { Check, Clock, ImageOff, Music, Video, X } from "lucide-react"
import { useTranslation } from "react-i18next"

interface AnswerRow {
  label: string
  count: number
  isCorrect: boolean
  color: string | null
  answerLabel: string | null
}

const MediaPreview = ({ media }: { media?: QuestionMedia }) => {
  if (media?.type === MEDIA_TYPES.IMAGE) {
    return (
      <img
        src={media.url}
        alt=""
        className="h-16 w-auto rounded-md object-contain md:h-full"
      />
    )
  }

  if (media?.type === MEDIA_TYPES.VIDEO) {
    return (
      <div className="flex h-16 w-24 items-center justify-center rounded-lg bg-gray-200 md:h-38 md:w-full">
        <Video className="size-6 text-gray-400 md:size-10" />
      </div>
    )
  }

  if (media?.type === MEDIA_TYPES.AUDIO) {
    return (
      <div className="flex h-16 w-24 items-center justify-center rounded-lg bg-gray-200 md:h-38 md:w-full">
        <Music className="size-6 text-gray-400 md:size-10" />
      </div>
    )
  }

  return (
    <div className="flex h-16 w-24 items-center justify-center rounded-lg bg-gray-200 md:h-38 md:w-full">
      <ImageOff className="size-6 text-gray-400 md:size-10" />
    </div>
  )
}

const ResultModalAnswers = () => {
  const { questionResult, totalPlayers, answeredCount } = useResultModal()
  const { t } = useTranslation()

  const noAnswerCount = totalPlayers - answeredCount

  const rows: AnswerRow[] = [
    ...questionResult.answers.map((label, ai) => ({
      label,
      count: questionResult.playerAnswers.filter((pa) =>
        pa.answerIds?.includes(ai),
      ).length,
      isCorrect: questionResult.solutions.includes(ai),
      color: ANSWERS_COLORS[ai % 4],
      answerLabel: ANSWERS_LABELS[ai % 4],
    })),
    {
      label: t("manager:result.noAnswer"),
      count: noAnswerCount,
      isCorrect: false,
      color: null,
      answerLabel: null,
    },
  ]

  return (
    <div className="flex flex-col border-b-2 border-gray-200 md:flex-row">
      <div className="flex shrink-0 flex-row items-center gap-4 border-b-2 border-gray-200 bg-gray-50 p-4 md:w-66 md:flex-col md:justify-center md:border-r-2 md:border-b-0">
        <MediaPreview media={questionResult.media} />
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Clock className="size-3.5" />
          <span>
            {questionResult.time === NO_TIME_LIMIT
              ? "∞"
              : `${questionResult.time}${t("manager:result.timeLimitSuffix")}`}
          </span>
          {questionResult.options?.scoringMode && (
            <div className="rounded-md bg-gray-200 px-2 py-0.5 font-semibold text-gray-600">
              {t(
                `quizz:question.config.scoringMode.${questionResult.options.scoringMode}`,
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5 overflow-hidden px-4 py-3 md:gap-2 md:px-5 md:py-4">
        <p className="text-md mb-1 font-semibold text-gray-700">
          {questionResult.question}
        </p>

        {rows.map((row, i) => (
          <div key={i} className="flex items-center gap-3">
            {row.color && row.answerLabel ? (
              <div
                className={clsx(
                  "flex size-6 shrink-0 items-center justify-center rounded-md text-xs font-bold text-white",
                  row.color,
                )}
              >
                {row.answerLabel}
              </div>
            ) : (
              <div className="flex size-6 shrink-0 items-center justify-center rounded-md border-2 border-gray-300 bg-white">
                <X className="size-3 stroke-4 text-gray-400" />
              </div>
            )}

            <span
              className={clsx("min-w-0 flex-1 truncate text-sm font-medium", {
                "text-gray-400": !row.color,
              })}
            >
              {row.label}
            </span>

            <div className="shrink-0">
              {row.isCorrect ? (
                <Check className="size-5 stroke-4 text-green-500" />
              ) : (
                <X
                  className={clsx(
                    "size-5 stroke-4",
                    row.color ? "text-red-500" : "text-red-400",
                  )}
                />
              )}
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <span className="text-center text-sm font-semibold text-gray-600">
                {row.count}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ResultModalAnswers
