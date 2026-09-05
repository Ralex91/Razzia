import type { FieldError as FieldErrorType } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { twMerge } from "tailwind-merge"

interface Props {
  id?: string
  errors?: Array<FieldErrorType | undefined>
  pill?: boolean
  className?: string
}

const FieldError = ({ id, errors, pill = false, className }: Props) => {
  const { t } = useTranslation()

  const message = errors?.find((error) => error?.message)?.message

  if (!message) {
    return null
  }

  return (
    <p
      id={id}
      className={twMerge(
        "text-sm font-semibold text-red-600",
        pill && "bg-background w-fit rounded-lg px-2 py-1",
        className,
      )}
    >
      {t(message)}
    </p>
  )
}

export default FieldError
