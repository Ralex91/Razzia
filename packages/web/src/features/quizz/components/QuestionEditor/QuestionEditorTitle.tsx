import { useQuizzEditor } from "@razzia/web/features/quizz/contexts/quizz-editor-context"
import type { ChangeEvent } from "react"
import { useTranslation } from "react-i18next"

const QuestionEditorTitle = () => {
  const { updateQuestion, currentIndex, currentQuestion } = useQuizzEditor()
  const { t } = useTranslation()

  const handleChangeQuestion = (e: ChangeEvent<HTMLInputElement>) => {
    updateQuestion(currentIndex, { question: e.target.value })
  }

  return (
    <div className="bg-background z-10 rounded-xl shadow-sm">
      <input
        className="placeholder:text-muted-foreground text-foreground w-full resize-none p-4 text-center text-xl font-semibold outline-none"
        placeholder={t("quizz:question.placeholder")}
        value={currentQuestion.question}
        onChange={handleChangeQuestion}
      />
    </div>
  )
}

export default QuestionEditorTitle
