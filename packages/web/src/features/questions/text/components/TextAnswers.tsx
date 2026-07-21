import Button from "@razzia/web/components/Button"
import type { AnswerComponentProps } from "@razzia/web/features/questions/types"
import { useState } from "react"
import { useTranslation } from "react-i18next"

const TextAnswers = ({ answers, onSubmit, readOnly }: AnswerComponentProps) => {
  const [text, setText] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const { t } = useTranslation()
  const correctAnswer = answers[0] ?? ""

  const handleSubmit = () => {
    setSubmitted(true)
    // Normalize both strings for comparison
    const normalized = text.trim().toLowerCase()
    const expected = correctAnswer.trim().toLowerCase()

    if (normalized === expected) {
      onSubmit([0])
    } else {
      onSubmit([])
    }
  }

  return (
    <div className="mx-auto mb-4 flex w-full max-w-xl flex-col items-center gap-4 px-2">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={t("quizz:textInput.placeholder")}
        disabled={readOnly || submitted}
        className="w-full rounded-2xl bg-white/20 px-6 py-4 text-center text-xl font-bold text-white placeholder-white/50 outline-none backdrop-blur-sm transition-colors focus:bg-white/30 disabled:opacity-50"
        onKeyDown={(e) => {
          if (e.key === "Enter" && text.trim() && !submitted) {
            handleSubmit()
          }
        }}
        autoFocus
      />
      {!readOnly && !submitted && (
        <Button
          onClick={handleSubmit}
          disabled={!text.trim()}
          className="w-full max-w-xs"
        >
          {t("game:confirm")}
        </Button>
      )}
      {submitted && (
        <p className="rounded-lg bg-black/40 px-4 py-2 text-sm text-white/80">
          {t("quizz:textInput.answerWas")} <strong>{correctAnswer}</strong>
        </p>
      )}
    </div>
  )
}

export default TextAnswers
