import { EVENTS } from "@razzia/common/constants"
import type { QuizzValidated } from "@razzia/common/validators/quizz"
import Button from "@razzia/web/components/Button"
import FieldError from "@razzia/web/components/forms/FieldError"
import Input from "@razzia/web/components/Input"
import {
  useEvent,
  useSocket,
} from "@razzia/web/features/game/contexts/socket-context"
import {
  useQuizzEditor,
  type QuizzFormValues,
} from "@razzia/web/features/quizz/contexts/quizz-editor-context"
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
  const { socket } = useSocket()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const handleSave = handleSubmit(
    (values) => {
      if (quizzId) {
        socket.emit(EVENTS.QUIZZ.UPDATE, { id: quizzId, ...values })

        return
      }

      socket.emit(EVENTS.QUIZZ.SAVE, values)
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

  useEvent(EVENTS.QUIZZ.SAVE_SUCCESS, () => {
    toast.success(t("quizz:quizzSaved"))
    navigate({ to: "/manager/config" })
  })

  useEvent(EVENTS.QUIZZ.UPDATE_SUCCESS, (_data) => {
    toast.success(t("quizz:quizzUpdated"))
    navigate({ to: "/manager/config" })
  })

  useEvent(EVENTS.QUIZZ.ERROR, (message) => {
    toast.error(t(message))
  })

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
          onClick={() => navigate({ to: "/manager" })}
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
