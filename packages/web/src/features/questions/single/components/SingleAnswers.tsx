import AnswerButton from "@razzia/web/features/game/components/AnswerButton"
import {
  ANSWERS_COLORS,
  ANSWERS_LABELS,
} from "@razzia/web/features/game/utils/constants"
import type { AnswerComponentProps } from "@razzia/web/features/questions/types"
import clsx from "clsx"

const SingleAnswers = ({
  answers,
  onSubmit,
  readOnly,
  fill,
}: AnswerComponentProps) => {
  const handleSubmit = (key: number) => onSubmit([key])

  return (
    <div
      className={clsx(
        "mx-auto mb-4 grid w-full max-w-7xl gap-1 px-2 text-lg font-bold text-white md:text-xl",
        fill ? "flex-1 auto-rows-fr grid-cols-1 sm:grid-cols-2" : "grid-cols-2",
      )}
    >
      {answers.map((answer, key) => (
        <AnswerButton
          key={key}
          className={ANSWERS_COLORS[key]}
          label={ANSWERS_LABELS[key]}
          onClick={() => handleSubmit(key)}
          disabled={readOnly}
          large={fill}
        >
          {answer}
        </AnswerButton>
      ))}
    </div>
  )
}

export default SingleAnswers
