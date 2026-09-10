import type { QuizzValidated } from "@razzia/common/validators/quizz"
import Button from "@razzia/web/components/Button"
import FieldError from "@razzia/web/components/forms/FieldError"
import Input from "@razzia/web/components/Input"
import {
  createQuizz,
  quizzKeys,
  updateQuizz,
} from "@razzia/web/features/manager/queries"
import {
  useQuizzEditor,
  type QuizzFormValues,
} from "@razzia/web/features/quizz/contexts/quizz-editor-context"
import { ApiError } from "@razzia/web/lib/api"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import clsx from "clsx"
import { Controller, useFormContext } from "react-hook-form"
import toast from "react-hot-toast"
import { useTranslation } from "react-i18next"

const QuizzEditorHeader = () => {
  const { quizzId, setCurrentIndex } = useQuizzEditor()
  const { handleSubmit, control } = useFormContext<
    QuizzFormValues,
    unknown,
    QuizzValidated
  >()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { t } = useTranslation()

  const handleExit = () => {
    navigate({ to: "/manager/config" })
  }

  const onError = (error: Error) => {
    toast.error(
      t(error instanceof ApiError ? error.key : "errors:quizz.failedToSave"),
    )
  }

  const onSaved = (messageKey: string) => {
    queryClient.invalidateQueries({ queryKey: quizzKeys.all })
    toast.success(t(messageKey))
    handleExit()
  }

  const { mutate: create } = useMutation({
    mutationFn: createQuizz,
    onSuccess: () => onSaved("quizz:quizzSaved"),
    onError,
  })

  const { mutate: update } = useMutation({
    mutationFn: updateQuizz,
    onSuccess: () => onSaved("quizz:quizzUpdated"),
    onError,
  })

  const handleSave = handleSubmit(
    (values) => {
      if (quizzId) {
        update({ id: quizzId, json: values })

        return
      }

      create(values)
    },
    (invalid) => {
      if (!Array.isArray(invalid.questions)) {
        return
      }

      const index = invalid.questions.findIndex(Boolean)

      if (index >= 0) {
        setCurrentIndex(index)
      }
    },
  )

  return (
    <header className="bg-background z-20 flex h-14 items-center justify-between gap-4 px-4 shadow-sm">
      <Controller
        control={control}
        name="subject"
        render={({ field, fieldState }) => (
          <div className="flex items-center gap-6">
            <Input
              {...field}
              variant="sm"
              aria-invalid={fieldState.invalid}
              aria-describedby={
                fieldState.invalid ? `${field.name}-error` : undefined
              }
              className={clsx(
                "w-64",
                fieldState.invalid && "ring-2 ring-red-500",
              )}
              placeholder={t("quizz:titleQuizzPlaceholder")}
            />
            <FieldError
              id={`${field.name}-error`}
              errors={[fieldState.error]}
            />
          </div>
        )}
      />

      <div className="flex gap-2">
        <Button
          className="text-md bg-accent text-accent-foreground px-4 py-2 font-semibold"
          onClick={handleExit}
        >
          {t("common:exit")}
        </Button>
        <Button className="bg-primary text-md px-4 py-2" onClick={handleSave}>
          {t("common:save")}
        </Button>
      </div>
    </header>
  )
}

export default QuizzEditorHeader
