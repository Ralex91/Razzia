import defaultBackground from "@razzia/web/assets/background.png"
import { getBranding } from "@razzia/web/branding/branding"
import QuestionEditorAnswers from "@razzia/web/features/quizz/components/QuestionEditor/QuestionEditorAnswers"
import QuestionEditorConfig from "@razzia/web/features/quizz/components/QuestionEditor/QuestionEditorConfig"
import QuestionEditorMedia from "@razzia/web/features/quizz/components/QuestionEditor/QuestionEditorMedia"
import QuestionEditorTitle from "@razzia/web/features/quizz/components/QuestionEditor/QuestionEditorTitle"

const QuestionEditor = () => {
  const background = getBranding()?.background ?? defaultBackground

  return (
    <div className="flex flex-1 overflow-hidden">
      <main className="mx-auto flex max-w-7xl flex-1 flex-col gap-4 overflow-y-auto p-6">
        <QuestionEditorTitle />
        <QuestionEditorMedia />
        <QuestionEditorAnswers />

        <div className="fixed top-0 left-0 h-full w-full">
          <img
            className="pointer-events-none h-full w-full object-cover select-none"
            src={background}
            onError={(event) => {
              event.currentTarget.onerror = null
              event.currentTarget.src = defaultBackground
            }}
            alt="background"
          />
        </div>
      </main>
      <QuestionEditorConfig />
    </div>
  )
}

export default QuestionEditor
