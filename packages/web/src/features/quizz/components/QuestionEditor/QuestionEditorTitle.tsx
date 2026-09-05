import FieldError from "@razzia/web/components/forms/FieldError"
import {
  useQuizzEditor,
  type QuizzFormValues,
} from "@razzia/web/features/quizz/contexts/quizz-editor-context"
import clsx from "clsx"
import { Controller, useFormContext } from "react-hook-form"
import { useTranslation } from "react-i18next"

const QuestionEditorTitle = () => {
  const { questionPath } = useQuizzEditor()
  const { control } = useFormContext<QuizzFormValues>()
  const { t } = useTranslation()

  return (
    <Controller
      control={control}
      name={questionPath("question")}
      render={({ field, fieldState }) => (
        <div className="z-10 flex flex-col gap-1">
          <input
            {...field}
            aria-invalid={fieldState.invalid}
            aria-describedby={
              fieldState.invalid ? `${field.name}-error` : undefined
            }
            className={clsx(
              "bg-background placeholder:text-muted-foreground text-foreground w-full rounded-xl p-4 text-center text-xl font-semibold shadow-sm outline-none",
              fieldState.invalid && "ring-2 ring-red-500",
            )}
            placeholder={t("quizz:question.placeholder")}
          />
          <FieldError
            id={`${field.name}-error`}
            errors={[fieldState.error]}
            pill
          />
        </div>
      )}
    />
  )
}

export default QuestionEditorTitle
