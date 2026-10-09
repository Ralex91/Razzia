import { ANSWERS_LABELS } from "@razzia/web/features/game/utils/constants"
import type { SolutionPickerProps } from "@razzia/web/features/questions/types"
import { useQuizzEditor } from "@razzia/web/features/quizz/contexts/quizz-editor-context"
import clsx from "clsx"
import { Check } from "lucide-react"
import { useTranslation } from "react-i18next"

const MultiSolutionPicker = ({ index, isSelected }: SolutionPickerProps) => {
  const { currentQuestion, currentIndex, updateQuestion } = useQuizzEditor()
  const { t } = useTranslation()

  const handleToggle = () => {
    const current = currentQuestion.solutions ?? []

    if (current.includes(index)) {
      const next = current.filter((s) => s !== index)
      updateQuestion(currentIndex, {
        solutions: next.length > 0 ? next : [index],
      })
    } else {
      updateQuestion(currentIndex, { solutions: [...current, index] })
    }
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label={t("quizz:markCorrect", { label: ANSWERS_LABELS[index] })}
      aria-pressed={isSelected}
      className={clsx(
        "flex size-6 shrink-0 items-center justify-center rounded-md transition-colors",
        isSelected ? "text-correct bg-white" : "bg-white/20",
      )}
    >
      {isSelected && <Check className="size-4 stroke-5" />}
    </button>
  )
}

export default MultiSolutionPicker
