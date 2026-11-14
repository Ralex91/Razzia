import type { FieldErrors } from "react-hook-form"
import clsx from "clsx"
import { CircleAlert, Music, Trash2, Video } from "lucide-react"
import { useTranslation } from "react-i18next"
import { twMerge } from "tailwind-merge"
import type { Question, QuestionMedia } from "@razzia/common/types/game"
import { MEDIA_TYPES, QUESTION_TYPES } from "@razzia/common/constants"
import AlertDialog from "@razzia/web/components/AlertDialog"
import Tooltip from "@razzia/web/components/Tooltip"
import { getErrorMessages } from "@razzia/web/features/quizz/utils/errors"

const SlideMedia = ({ media }: { media?: QuestionMedia }) => {
  if (media?.type === MEDIA_TYPES.IMAGE) {
    return (
      <img src={media.url} className="mx-auto max-h-14 w-auto rounded-md" />
    )
  }

  if (media?.type === MEDIA_TYPES.VIDEO) {
    return <Video className="mx-auto size-10 text-muted-foreground" />
  }

  if (media?.type === MEDIA_TYPES.AUDIO) {
    return <Music className="mx-auto size-10 text-muted-foreground" />
  }

  return null
}

interface Props {
  question: Question
  index: number
  isActive: boolean
  errors?: FieldErrors<Question>
  canDelete: boolean
  onClick: () => void
  onDelete: () => void
}

const QuizzEditorCard = ({
  question,
  index,
  isActive,
  errors,
  canDelete,
  onClick,
  onDelete,
}: Props) => {
  const { t } = useTranslation()
  const errorMessages = getErrorMessages(errors, t)

  return (
    <div
      onClick={onClick}
      className={twMerge(
        clsx(
          "group relative flex h-36 cursor-pointer flex-col justify-between gap-1 rounded-lg border-2 border-accent bg-background px-6 py-2",
          {
            "border-primary": isActive,
            "border-red-500": errorMessages.length > 0,
          },
        ),
      )}
    >
      <div className="absolute top-2 left-2 flex flex-col items-center gap-1">
        <span className="text-xs font-semibold text-muted-foreground">
          {index + 1}
        </span>

        {errorMessages.length > 0 && (
          <Tooltip
            side="right"
            className="bg-red-600"
            arrowClassName="fill-red-600"
            content={
              <ul className="flex max-w-64 flex-col gap-1">
                {errorMessages.map((message) => (
                  <li key={message}>{message}</li>
                ))}
              </ul>
            }
          >
            <span
              role="img"
              aria-label={t("quizz:questionHasErrors")}
              className="flex"
            >
              <CircleAlert className="size-3.5 text-red-500" />
            </span>
          </Tooltip>
        )}
      </div>
      <p className="truncate px-3 text-center text-xs font-semibold text-foreground">
        {question.question || t("quizz:noQuestionYet")}
      </p>

      <SlideMedia media={question.media} />

      {question.type === QUESTION_TYPES.ESTIMATION ? (
        <div className="flex h-4 items-center rounded-md border border-accent px-1.5">
          <div className="relative h-1 w-full rounded-full bg-accent">
            <div className="absolute top-1/2 left-1/2 size-1.5 -translate-1/2 rounded-full bg-correct" />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-1">
          {question.answers.map((_, i) => (
            <div
              key={i}
              className="flex h-4 flex-1 items-center rounded-md border border-accent px-0.5"
            >
              {question.solutions?.includes(i) && (
                <div className="ml-auto size-1.5 rounded-full bg-correct" />
              )}
            </div>
          ))}
        </div>
      )}

      {canDelete && (
        <AlertDialog
          trigger={
            <button
              onClick={(e) => e.stopPropagation()}
              aria-label={t("quizz:question.deleteQuestion")}
              className="absolute top-1.5 right-1.5 hidden rounded-sm bg-background p-1 text-muted-foreground group-hover:block hover:bg-red-50 hover:text-red-500"
            >
              <Trash2 className="size-3.5" />
            </button>
          }
          title={t("quizz:question.deleteQuestion")}
          description={t("quizz:question.deleteQuestionConfirm")}
          confirmLabel={t("common:delete")}
          onConfirm={onDelete}
        />
      )}
    </div>
  )
}

export default QuizzEditorCard
