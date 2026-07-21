import {
  ANSWERS_COLORS,
  ANSWERS_LABELS,
} from "@razzia/web/features/game/utils/constants"
import { QUESTION_REGISTRY } from "@razzia/web/features/questions"
import { useQuizzEditor } from "@razzia/web/features/quizz/contexts/quizz-editor-context"
import clsx from "clsx"
import { ImagePlus, Minus, Plus } from "lucide-react"
import { useTranslation } from "react-i18next"

const QuestionEditorAnswers = () => {
  const { currentQuestion, currentIndex, updateQuestion } = useQuizzEditor()
  const { t } = useTranslation()

  const questionType = currentQuestion.type
  const { SolutionPicker } = QUESTION_REGISTRY[questionType]

  const updateAnswer = (index: number, value: string) => {
    const next = [...currentQuestion.answers]
    next[index] = value
    updateQuestion(currentIndex, { answers: next })
  }

  const addAnswer = () => {
    if (currentQuestion.answers.length >= 4) {
      return
    }

    updateQuestion(currentIndex, { answers: [...currentQuestion.answers, ""] })
  }

  const removeAnswer = () => {
    if (currentQuestion.answers.length <= 2) {
      return
    }

    const next = currentQuestion.answers.slice(0, -1)
    const maxIndex = next.length - 1
    const nextSolution = currentQuestion.solutions.filter((s) => s <= maxIndex)

    updateQuestion(currentIndex, {
      answers: next,
      solutions: nextSolution.length > 0 ? nextSolution : [0],
    })
  }

  // Text type: show single input for the correct answer
  if (questionType === "text") {
    const answer = currentQuestion.answers[0] ?? ""

    return (
      <div className="z-10 flex flex-col gap-3">
        <div className="bg-accent/50 rounded-xl p-4">
          <p className="text-muted-foreground mb-2 text-xs font-semibold uppercase">
            {t("quizz:questionType.textCorrectAnswer")}
          </p>
          <input
            className="bg-background w-full rounded-lg px-4 py-3 text-lg font-semibold outline-none ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-blue-500"
            placeholder={t("quizz:textInput.correctAnswerPlaceholder")}
            value={answer}
            onChange={(e) => {
              const next = [e.target.value, e.target.value]
              updateQuestion(currentIndex, { answers: next })
            }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="z-10 flex flex-col gap-3">
      <div className="flex items-center justify-between px-1">
        <div className="text-muted-foreground bg-background rounded-lg px-2 py-1 text-sm font-semibold">
          {currentQuestion.answers.length}
          {t("quizz:answersCountSuffix")}
        </div>
        <div className="flex gap-2">
          <button
            onClick={removeAnswer}
            disabled={currentQuestion.answers.length <= 2}
            className="bg-accent text-accent-foreground hover:bg-accent flex size-7 items-center justify-center rounded-lg disabled:opacity-40"
          >
            <Minus className="size-4" />
          </button>
          <button
            onClick={addAnswer}
            disabled={currentQuestion.answers.length >= 4}
            className="bg-accent text-accent-foreground hover:bg-accent flex size-7 items-center justify-center rounded-lg disabled:opacity-40"
          >
            <Plus className="size-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {currentQuestion.answers.map((answer, i) => {
          const isSelected = currentQuestion.solutions.includes(i)

          return (
            <div
              key={i}
              className={clsx(
                "flex items-center gap-3 rounded-2xl px-4 py-6",
                ANSWERS_COLORS[i],
              )}
            >
              <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-black/20 text-sm font-bold text-white md:size-8 md:text-base">
                {ANSWERS_LABELS[i]}
              </span>
              <label className="group relative shrink-0 cursor-pointer">
                {currentQuestion.answerImages?.[i] ? (
                  <>
                    <img
                      src={currentQuestion.answerImages[i]}
                      alt=""
                      className="size-10 rounded-md object-cover md:size-12"
                    />
                    <div className="absolute inset-0 flex items-center justify-center rounded-md bg-black/0 transition-colors group-hover:bg-black/40">
                      <ImagePlus className="size-4 text-white opacity-0 group-hover:opacity-100" />
                    </div>
                  </>
                ) : (
                  <div className="flex size-10 items-center justify-center rounded-md bg-black/10 transition-colors hover:bg-black/20 md:size-12">
                    <ImagePlus className="size-4 text-white/60" />
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    const reader = new FileReader()
                    reader.onload = () => {
                      const url = reader.result as string
                      const next = [...(currentQuestion.answerImages ?? [])]
                      next[i] = url
                      updateQuestion(currentIndex, { answerImages: next })
                    }
                    reader.readAsDataURL(file)
                    e.target.value = ""
                  }}
                />
              </label>
              <div className="flex flex-1 items-center justify-between gap-1.5 drop-shadow-md">
                <input
                  className="w-full bg-transparent font-semibold text-white placeholder-white/70 outline-none"
                  placeholder={t("quizz:addAnswerPlaceholder")}
                  value={answer}
                  onChange={(e) => updateAnswer(i, e.target.value)}
                />
                <SolutionPicker index={i} isSelected={isSelected} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default QuestionEditorAnswers
