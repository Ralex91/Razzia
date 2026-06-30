import Button from "@razzia/web/components/Button"
import AnswerButton from "@razzia/web/features/game/components/AnswerButton"
import {
  ANSWERS_COLORS,
  ANSWERS_LABELS,
} from "@razzia/web/features/game/utils/constants"
import type { AnswerComponentProps } from "@razzia/web/features/questions/types"
import { useState } from "react"
import { useTranslation } from "react-i18next"

const MultiAnswers = ({
  answers,
  onSubmit,
  readOnly,
}: AnswerComponentProps) => {
  const [selected, setSelected] = useState<number[]>([])
  const { t } = useTranslation()

  const handleSubmit = () => onSubmit(selected)

  const toggle = (key: number) => {
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    )
  }

  return (
    <div className="mx-auto mb-4 flex w-full max-w-7xl flex-col gap-2 px-2">
      <div className="grid grid-cols-2 gap-1 text-lg font-bold text-white md:text-xl">
        {answers.map((answer, key) => {
          const isSelected = selected.includes(key)

          return (
            <AnswerButton
              key={key}
              className={ANSWERS_COLORS[key]}
              label={ANSWERS_LABELS[key]}
              onClick={() => toggle(key)}
              selected={readOnly ? undefined : isSelected}
              disabled={readOnly}
            >
              {answer}
            </AnswerButton>
          )
        })}
      </div>
      {!readOnly && (
        <Button
          onClick={handleSubmit}
          disabled={selected.length === 0}
          className="mx-auto w-full max-w-xs"
        >
          {t("game:confirm")}
        </Button>
      )}
    </div>
  )
}

export default MultiAnswers
