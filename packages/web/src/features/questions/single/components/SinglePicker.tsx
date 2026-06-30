import type { SolutionPickerProps } from "@razzia/web/features/questions/types"
import { useQuizzEditor } from "@razzia/web/features/quizz/contexts/quizz-editor-context"
import clsx from "clsx"
import { Check } from "lucide-react"

const SingleSolutionPicker = ({ index, isSelected }: SolutionPickerProps) => {
  const { currentQuestion, currentIndex, updateQuestion } = useQuizzEditor()

  const handleToggle = () => {
    const current = currentQuestion.solutions

    if (current.includes(index)) {
      const next = current.filter((s) => s !== index)

      updateQuestion(currentIndex, {
        solutions: next.length > 0 ? next : [index],
      })

      return
    }

    updateQuestion(currentIndex, { solutions: [...current, index] })
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      className={clsx(
        "flex size-6 shrink-0 items-center justify-center rounded-full transition-colors",
        isSelected ? "bg-white text-green-600" : "bg-white/20",
      )}
    >
      {isSelected && <Check className="size-4 stroke-5" />}
    </button>
  )
}

export default SingleSolutionPicker
