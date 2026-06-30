import AnswerButton from "@razzia/web/features/game/components/AnswerButton"
import {
  ANSWERS_COLORS,
  ANSWERS_LABELS,
} from "@razzia/web/features/game/utils/constants"
import type { AnswerComponentProps } from "@razzia/web/features/questions/types"

const SingleAnswers = ({
  answers,
  onSubmit,
  readOnly,
}: AnswerComponentProps) => {
  const handleSubmit = (key: number) => onSubmit([key])

  return (
    <div className="mx-auto mb-4 grid w-full max-w-7xl grid-cols-2 gap-1 px-2 text-lg font-bold text-white md:text-xl">
      {answers.map((answer, key) => (
        <AnswerButton
          key={key}
          className={ANSWERS_COLORS[key]}
          label={ANSWERS_LABELS[key]}
          onClick={() => handleSubmit(key)}
          disabled={readOnly}
        >
          {answer}
        </AnswerButton>
      ))}
    </div>
  )
}

export default SingleAnswers
