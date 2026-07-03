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
      <div className="bg-accent flex h-16 w-24 items-center justify-center rounded-lg md:h-38 md:w-full">
        <Video className="text-muted-foreground size-6 md:size-10" />
      </div>
    )
  }

  if (media?.type === MEDIA_TYPES.AUDIO) {
    return (
      <div className="bg-accent flex h-16 w-24 items-center justify-center rounded-lg md:h-38 md:w-full">
        <Music className="text-muted-foreground size-6 md:size-10" />
      </div>
    )
  }

  return (
    <div className="bg-accent flex h-16 w-24 items-center justify-center rounded-lg md:h-38 md:w-full">
      <ImageOff className="text-muted-foreground size-6 md:size-10" />
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
    <div className="border-accent flex flex-col border-b-2 md:flex-row">
      <div className="border-accent bg-muted/30 flex shrink-0 flex-row items-center gap-4 border-b-2 p-4 md:w-66 md:flex-col md:justify-center md:border-r-2 md:border-b-0">
        <MediaPreview media={questionResult.media} />
        <div className="text-muted-foreground flex items-center gap-2 text-xs">
          <Clock className="size-3.5" />
          <span>
            {questionResult.time === NO_TIME_LIMIT
              ? "∞"
              : `${questionResult.time}${t("manager:result.timeLimitSuffix")}`}
          </span>
          {questionResult.options?.scoringMode && (
            <div className="bg-accent text-accent-foreground rounded-md px-2 py-0.5 font-semibold">
              {t(
                `quizz:question.config.scoringMode.${questionResult.options.scoringMode}`,
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5 overflow-hidden px-4 py-3 md:gap-2 md:px-5 md:py-4">
        <p className="text-md text-foreground mb-1 font-semibold">
          {questionResult.question}
        </p>

        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-x-3 gap-y-1.5 md:gap-y-2">
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
                <div className="border-accent flex size-6 shrink-0 items-center justify-center rounded-md border-2 bg-white">
                  <X className="text-muted-foreground size-3 stroke-4" />
                </div>
              )}

              <span
                className={clsx("min-w-0 truncate text-sm font-medium", {
                  "text-muted-foreground": !row.color,
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

              <span className="text-accent-foreground text-center text-sm font-semibold">
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
