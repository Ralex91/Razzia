import { createFileRoute } from "@tanstack/react-router"
import QuestionEditor from "@razzia/web/features/quizz/components/QuestionEditor"
import QuizzEditorHeader from "@razzia/web/features/quizz/components/QuizzEditorHeader"
import QuizzEditorSidebar from "@razzia/web/features/quizz/components/QuizzEditorSidebar"
import { QuizzEditorProvider } from "@razzia/web/features/quizz/contexts/quizz-editor-context"

const QuizzEditorPage = () => (
  <QuizzEditorProvider>
    <div className="relative flex h-svh flex-col bg-muted">
      <QuizzEditorHeader />
      <div className="flex flex-1 overflow-hidden">
        <QuizzEditorSidebar />
        <QuestionEditor />
      </div>
    </div>
  </QuizzEditorProvider>
)

export const Route = createFileRoute("/manager/quizz/")({
  component: QuizzEditorPage,
})
