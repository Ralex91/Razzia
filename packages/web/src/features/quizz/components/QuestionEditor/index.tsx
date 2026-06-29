import GameBackground from "@razzia/web/components/GameBackground"
import QuestionEditorAnswers from "@razzia/web/features/quizz/components/QuestionEditor/QuestionEditorAnswers"
import QuestionEditorConfig from "@razzia/web/features/quizz/components/QuestionEditor/QuestionEditorConfig"
import QuestionEditorMedia from "@razzia/web/features/quizz/components/QuestionEditor/QuestionEditorMedia"
import QuestionEditorTitle from "@razzia/web/features/quizz/components/QuestionEditor/QuestionEditorTitle"

const QuestionEditor = () => (
  <div className="flex flex-1 overflow-hidden">
    <main className="mx-auto flex max-w-7xl flex-1 flex-col gap-4 overflow-y-auto p-6">
      <QuestionEditorTitle />
      <QuestionEditorMedia />
      <QuestionEditorAnswers />

      <GameBackground />
    </main>
    <QuestionEditorConfig />
  </div>
)

export default QuestionEditor
