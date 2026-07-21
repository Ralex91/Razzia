import type { SolutionPickerProps } from "@razzia/web/features/questions/types"
import { useQuizzEditor } from "@razzia/web/features/quizz/contexts/quizz-editor-context"
import { ArrowDown, ArrowUp } from "lucide-react"

/**
 * For order questions, solutions array defines the correct sequence.
 * Each solution value = the answer index that should be in this position.
 * e.g. solutions: [2, 0, 1] means answer[2] first, then answer[0], then answer[1].
 *
 * This picker lets the user set the order by reordering the solutions list.
 */
const OrderSolutionPicker = ({ index, isSelected }: SolutionPickerProps) => {
  const { currentQuestion, currentIndex, updateQuestion } = useQuizzEditor()

  const handleMoveUp = () => {
    const pos = currentQuestion.solutions.indexOf(index)

    if (pos <= 0) return

    const next = [...currentQuestion.solutions]
    ;[next[pos - 1], next[pos]] = [next[pos], next[pos - 1]]
    updateQuestion(currentIndex, { solutions: next })
  }

  const handleMoveDown = () => {
    const pos = currentQuestion.solutions.indexOf(index)

    if (pos === -1 || pos >= currentQuestion.solutions.length - 1) return

    const next = [...currentQuestion.solutions]
    ;[next[pos], next[pos + 1]] = [next[pos + 1], next[pos]]
    updateQuestion(currentIndex, { solutions: next })
  }

  const isEmpty = !currentQuestion.solutions.includes(index)

  return (
    <div className="flex gap-1">
      <button
        type="button"
        onClick={handleMoveUp}
        disabled={isEmpty || currentQuestion.solutions.indexOf(index) === 0}
        className="flex size-6 items-center justify-center rounded bg-white/20 text-white hover:bg-white/40 disabled:opacity-20"
      >
        <ArrowUp className="size-3.5" />
      </button>
      <button
        type="button"
        onClick={handleMoveDown}
        disabled={
          isEmpty ||
          currentQuestion.solutions.indexOf(index) ===
            currentQuestion.solutions.length - 1
        }
        className="flex size-6 items-center justify-center rounded bg-white/20 text-white hover:bg-white/40 disabled:opacity-20"
      >
        <ArrowDown className="size-3.5" />
      </button>
    </div>
  )
}

export default OrderSolutionPicker
