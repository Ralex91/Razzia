import Input from "@razzia/web/components/Input"
import FieldError from "@razzia/web/components/forms/FieldError"
import type { Question } from "@razzia/common/types/game"
import {
  useQuizzEditor,
  type QuizzFormValues,
} from "@razzia/web/features/quizz/contexts/quizz-editor-context"
import clsx from "clsx"
import { useState } from "react"
import { useController, type FieldPathByValue } from "react-hook-form"

type NumberFieldPath = FieldPathByValue<QuizzFormValues, number | undefined>

interface Props {
  name: FieldPathByValue<Question, number | undefined>
  fallback?: number
  min?: number
  max?: number
}

const ConfigNumberInput = ({ name, fallback, min, max }: Props) => {
  const { questionPath } = useQuizzEditor()
  const { field, fieldState } = useController<QuizzFormValues, NumberFieldPath>(
    { name: questionPath(name) },
  )
  const value = field.value ?? fallback ?? 0
  const [input, setInput] = useState(String(value))

  const handleChange = (raw: string) => {
    setInput(raw)

    const num = Number(raw)

    if (raw === "" || isNaN(num)) {
      return
    }

    field.onChange(Math.min(max ?? num, Math.max(min ?? num, num)))
  }

  const handleBlur = () => {
    field.onBlur()
    setInput(String(value))
  }

  return (
    <>
      <Input
        variant="sm"
        type="number"
        min={min}
        max={max}
        value={input}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={handleBlur}
        aria-invalid={fieldState.invalid}
        aria-describedby={
          fieldState.invalid ? `${field.name}-error` : undefined
        }
        className={clsx("w-full", fieldState.invalid && "ring-2 ring-red-500")}
      />
      <FieldError id={`${field.name}-error`} errors={[fieldState.error]} />
    </>
  )
}

export default ConfigNumberInput
