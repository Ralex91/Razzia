import { useQuizzEditor } from "@razzia/web/features/quizz/contexts/quizz-editor-context"
import clsx from "clsx"
import { Lightbulb } from "lucide-react"
import type { ChangeEvent } from "react"
import { useTranslation } from "react-i18next"

const QuestionEditorNote = () => {
  const { currentQuestion, currentIndex, updateQuestion } = useQuizzEditor()
  const { t } = useTranslation()

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    updateQuestion(currentIndex, { note: e.target.value || undefined })
  }

  return (
    <label
      className={clsx(
        "bg-background z-10 mx-auto flex w-full max-w-3xl cursor-text items-start gap-3 rounded-xl px-4 py-3 shadow-sm transition-opacity",
        !currentQuestion.note &&
          "opacity-60 focus-within:opacity-100 hover:opacity-100",
      )}
    >
      <Lightbulb className="text-primary mt-0.5 size-5 shrink-0" />
      <textarea
        value={currentQuestion.note ?? ""}
        onChange={handleChange}
        aria-label={t("quizz:question.note")}
        placeholder={t("quizz:question.notePlaceholder")}
        rows={1}
        className="placeholder:text-muted-foreground text-foreground field-sizing-content max-h-32 min-w-0 flex-1 resize-none bg-transparent font-semibold outline-none"
      />
    </label>
  )
}

export default QuestionEditorNote
