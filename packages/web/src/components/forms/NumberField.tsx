import FieldError from "@razzia/web/components/forms/FieldError"
import Input from "@razzia/web/components/Input"
import clsx from "clsx"
import {
  useController,
  type FieldPathByValue,
  type FieldValues,
} from "react-hook-form"
import { useTranslation } from "react-i18next"

interface Props<T extends FieldValues> {
  name: FieldPathByValue<T, number>
  label?: string
  min?: number
  max?: number
  className?: string
}

const NumberField = <T extends FieldValues>({
  name,
  label,
  min,
  max,
  className,
}: Props<T>) => {
  const { field, fieldState } = useController<T, FieldPathByValue<T, number>>({
    name,
  })
  const { t } = useTranslation()

  return (
    <div className={clsx("flex flex-col gap-1", className)}>
      {label && (
        <label
          htmlFor={field.name}
          className="text-muted-foreground text-sm font-medium"
        >
          {t(label)}
        </label>
      )}

      <Input
        id={field.name}
        variant="sm"
        type="number"
        min={min}
        max={max}
        aria-invalid={fieldState.invalid}
        aria-describedby={
          fieldState.invalid ? `${field.name}-error` : undefined
        }
        className={clsx(
          "w-full text-center",
          fieldState.invalid && "border-red-500",
        )}
        value={Number.isNaN(field.value) ? "" : field.value}
        onChange={(e) => field.onChange(e.target.valueAsNumber)}
        onBlur={field.onBlur}
      />

      <FieldError id={`${field.name}-error`} errors={[fieldState.error]} />
    </div>
  )
}

export default NumberField
