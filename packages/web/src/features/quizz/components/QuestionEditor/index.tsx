import GameBackground from "@razzia/web/components/GameBackground"
import { QUESTION_REGISTRY } from "@razzia/web/features/questions"
import QuestionEditorAnswers from "@razzia/web/features/quizz/components/QuestionEditor/QuestionEditorAnswers"
import QuestionEditorConfig from "@razzia/web/features/quizz/components/QuestionEditor/QuestionEditorConfig"
import QuestionEditorMedia from "@razzia/web/features/quizz/components/QuestionEditor/QuestionEditorMedia"
import QuestionEditorNote from "@razzia/web/features/quizz/components/QuestionEditor/QuestionEditorNote"
import QuestionEditorTitle from "@razzia/web/features/quizz/components/QuestionEditor/QuestionEditorTitle"
import { useQuizzEditor } from "@razzia/web/features/quizz/contexts/quizz-editor-context"

const QuestionEditor = () => {
  const { currentQuestion, currentQuestionId, isRemoving } = useQuizzEditor()
  const AnswersEditor =
    QUESTION_REGISTRY[currentQuestion.type].AnswersEditor ??
    QuestionEditorAnswers

  if (isRemoving) {
    return null
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      <main className="mx-auto flex max-w-7xl flex-1 flex-col gap-4 overflow-y-auto p-6">
        <QuestionEditorTitle />
        <QuestionEditorMedia />
        <QuestionEditorNote />
        <AnswersEditor key={currentQuestionId} />

        <GameBackground />
      </main>
      <QuestionEditorConfig />
    </div>
  )
}

export default QuestionEditor
