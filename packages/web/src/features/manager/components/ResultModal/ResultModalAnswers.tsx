import clsx from "clsx"
import { Check, Clock, ImageOff, Music, Video, X } from "lucide-react"
import { useTranslation } from "react-i18next"
import type { QuestionMedia } from "@razzia/common/types/game"
import {
  MEDIA_TYPES,
  NO_TIME_LIMIT,
  QUESTION_TYPES,
  QUIZZ_MODES,
} from "@razzia/common/constants"
import {
  isEstimationOptions,
  isMultiOptions,
} from "@razzia/common/questions/options"
import {
  ANSWERS_COLORS,
  ANSWERS_LABELS,
} from "@razzia/web/features/game/utils/constants"
import { useResultModal } from "@razzia/web/features/manager/contexts/result-modal-context"
import { formatValue } from "@razzia/web/features/questions/estimation/utils"

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
      <div className="flex h-16 w-24 items-center justify-center rounded-lg bg-accent md:h-38 md:w-full">
        <Video className="size-6 text-muted-foreground md:size-10" />
      </div>
    )
  }

  if (media?.type === MEDIA_TYPES.AUDIO) {
    return (
      <div className="flex h-16 w-24 items-center justify-center rounded-lg bg-accent md:h-38 md:w-full">
        <Music className="size-6 text-muted-foreground md:size-10" />
      </div>
    )
  }

  return (
    <div className="flex h-16 w-24 items-center justify-center rounded-lg bg-accent md:h-38 md:w-full">
      <ImageOff className="size-6 text-muted-foreground md:size-10" />
    </div>
  )
}

const ResultModalAnswers = () => {
  const { result, questionResult, totalPlayers, answeredCount, correctCount } =
    useResultModal()
  const { t } = useTranslation()

  const noAnswerCount = totalPlayers - answeredCount
  const { options } = questionResult
  const scoringMode = isMultiOptions(options) ? options.scoringMode : undefined

  const values = questionResult.playerAnswers.flatMap(
    (pa) => pa.answerIds ?? [],
  )
  const average = (() => {
    if (values.length === 0) {
      return null
    }

    return values.reduce((acc, value) => acc + value, 0) / values.length
  })()

  const estimationRows = (): AnswerRow[] => {
    const solution = questionResult.solutions?.[0]

    if (!isEstimationOptions(options) || solution === undefined) {
      return [
        {
          label: t("manager:result.estimation.answered"),
          count: answeredCount,
          isCorrect: false,
          color: "bg-primary",
          answerLabel: "≈",
        },
      ]
    }

    return [
      {
        label: t("manager:result.estimation.withinMargin", {
          value: formatValue(solution),
          margin: formatValue(options.margin),
        }),
        count: correctCount,
        isCorrect: true,
        color: "bg-correct",
        answerLabel: "≈",
      },
      {
        label: t("manager:result.estimation.outsideMargin"),
        count: answeredCount - correctCount,
        isCorrect: false,
        color: "bg-red-500",
        answerLabel: "≠",
      },
    ]
  }

  const answerRows: AnswerRow[] = (() => {
    if (questionResult.type === QUESTION_TYPES.ESTIMATION) {
      return estimationRows()
    }

    return questionResult.answers.map((label, ai) => ({
      label,
      count: questionResult.playerAnswers.filter((pa) =>
        pa.answerIds?.includes(ai),
      ).length,
      isCorrect: questionResult.solutions?.includes(ai) ?? false,
      color: ANSWERS_COLORS[ai % 4],
      answerLabel: ANSWERS_LABELS[ai % 4],
    }))
  })()

  const rows: AnswerRow[] = [
    ...answerRows,
    {
      label: t("manager:result.noAnswer"),
      count: noAnswerCount,
      isCorrect: false,
      color: null,
      answerLabel: null,
    },
  ]

  return (
    <div className="flex flex-col border-b-2 border-accent md:flex-row">
      <div className="flex shrink-0 flex-row items-center gap-4 border-b-2 border-accent bg-muted/30 p-4 md:w-66 md:flex-col md:justify-center md:border-r-2 md:border-b-0">
        <MediaPreview media={questionResult.media} />
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="size-3.5" />
          <span>
            {questionResult.time === NO_TIME_LIMIT
              ? "∞"
              : `${questionResult.time}${t("manager:result.timeLimitSuffix")}`}
          </span>
          {scoringMode && (
            <div className="rounded-md bg-accent px-2 py-0.5 font-semibold text-accent-foreground">
              {t(`quizz:question.config.scoringMode.${scoringMode}`)}
            </div>
          )}
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5 overflow-hidden px-4 py-3 md:gap-2 md:px-5 md:py-4">
        <p className="text-md mb-1 font-semibold text-foreground">
          {questionResult.question}
        </p>

        {questionResult.type === QUESTION_TYPES.ESTIMATION &&
          average !== null && (
            <p className="mb-1 text-xs text-muted-foreground">
              {t("manager:result.estimation.average", {
                value: formatValue(Math.round(average * 100) / 100),
              })}
            </p>
          )}

        <div
          className={clsx(
            "grid items-center gap-x-3 gap-y-1.5 md:gap-y-2",
            result.gameMode === QUIZZ_MODES.SURVEY
              ? "grid-cols-[auto_minmax(0,1fr)_auto]"
              : "grid-cols-[auto_minmax(0,1fr)_auto_auto]",
          )}
        >
          {rows.map((row, i) => (
            <div key={i} className="contents">
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
                <div className="flex size-6 shrink-0 items-center justify-center rounded-md border-2 border-accent bg-white">
                  <X className="size-3 stroke-4 text-muted-foreground" />
                </div>
              )}

              <span
                className={clsx("min-w-0 truncate text-sm font-medium", {
                  "text-muted-foreground": !row.color,
                })}
              >
                {row.label}
              </span>

              {result.gameMode !== QUIZZ_MODES.SURVEY && (
                <div className="shrink-0">
                  {row.isCorrect ? (
                    <Check className="size-5 stroke-4 text-correct" />
                  ) : (
                    <X
                      className={clsx(
                        "size-5 stroke-4",
                        row.color ? "text-red-500" : "text-red-400",
                      )}
                    />
                  )}
                </div>
              )}

              <span className="text-center text-sm font-semibold text-accent-foreground">
                {row.count}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default ResultModalAnswers
