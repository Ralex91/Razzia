import { QUIZZ_MODES } from "@razzia/common/constants"
import FieldError from "@razzia/web/components/forms/FieldError"
import Input from "@razzia/web/components/Input"
import EstimationScale from "@razzia/web/features/questions/estimation/components/EstimationScale"
import { getEstimationOptions } from "@razzia/web/features/questions/estimation/utils"
import ConfigNumberInput from "@razzia/web/features/quizz/components/QuestionEditor/QuestionEditorConfig/ConfigNumberInput"
import {
  useQuizzEditor,
  type QuizzFormValues,
} from "@razzia/web/features/quizz/contexts/quizz-editor-context"
import clsx from "clsx"
import { useId, useState } from "react"
import { useController } from "react-hook-form"
import { useTranslation } from "react-i18next"

const EstimationEditor = () => {
  const { currentQuestion, gameMode, questionPath } = useQuizzEditor()
  const { field, fieldState } = useController<QuizzFormValues>({
    name: questionPath("solutions"),
  })
  const { t } = useTranslation()
  const options = getEstimationOptions(currentQuestion.options)
  const solution = currentQuestion.solutions?.[0]
  const [input, setInput] = useState(String(solution ?? ""))
  const minId = useId()
  const maxId = useId()

  const handleChange = (raw: string) => {
    setInput(raw)

    const num = Number(raw)

    if (raw.trim() === "" || isNaN(num)) {
      return
    }

    field.onChange([num])
  }

  const bounds = {
    startLabel: (
      <label htmlFor={minId}>{t("quizz:question.config.estimation.min")}</label>
    ),
    endLabel: (
      <label htmlFor={maxId}>{t("quizz:question.config.estimation.max")}</label>
    ),
    start: (
      <div className="flex w-24 flex-col">
        <ConfigNumberInput id={minId} name="options.min" />
      </div>
    ),
    end: (
      <div className="flex w-24 flex-col">
        <ConfigNumberInput id={maxId} name="options.max" />
      </div>
    ),
  }

  if (gameMode === QUIZZ_MODES.SURVEY) {
    return (
      <div className="z-10 rounded-2xl bg-white px-5 py-4 shadow-sm">
        <EstimationScale options={options} {...bounds} />
      </div>
    )
  }

  return (
    <div className="z-10 mt-12 flex flex-col gap-1">
      <div
        className={clsx(
          "rounded-2xl bg-white px-5 py-4 shadow-sm",
          fieldState.invalid && "ring-2 ring-red-500",
        )}
      >
        <EstimationScale
          options={options}
          solution={solution}
          onSolutionChange={(value) => handleChange(String(value))}
          solutionLabel={t("quizz:question.estimation.correctAnswer")}
          {...bounds}
          bubble={
            <label className="bg-correct flex flex-col items-center gap-1 rounded-xl px-3 py-2 text-xs text-white shadow-md">
              {t("quizz:question.estimation.correctAnswer")}
              <Input
                variant="sm"
                type="number"
                step={options.step}
                value={input}
                onChange={(e) => handleChange(e.target.value)}
                onBlur={field.onBlur}
                aria-invalid={fieldState.invalid}
                aria-describedby={
                  fieldState.invalid ? `${field.name}-error` : undefined
                }
                className={clsx(
                  "w-24 border-transparent bg-white text-center",
                  fieldState.invalid && "border-red-500",
                )}
              />
            </label>
          }
        />
      </div>
      <FieldError id={`${field.name}-error`} errors={[fieldState.error]} pill />
    </div>
  )
}

export default EstimationEditor
