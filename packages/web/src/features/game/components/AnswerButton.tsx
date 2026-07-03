import clsx from "clsx"
import { Check, X } from "lucide-react"
import type { ButtonHTMLAttributes, PropsWithChildren } from "react"

type Props = PropsWithChildren &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    label: string
    correct?: boolean
    selected?: boolean
  }

const AnswerButton = ({
  className,
  label,
  children,
  correct,
  selected,
  ...otherProps
}: Props) => {
  const CorrectIcon = correct ? Check : X

  return (
    <button
      className={clsx(
        "relative flex items-center gap-3 rounded-2xl px-4 py-6 text-left",
        className,
      )}
      {...otherProps}
    >
      <span className="flex size-5 shrink-0 items-center justify-center rounded bg-black/20 text-sm font-bold sm:size-7 sm:rounded-md md:size-8 md:text-base">
        {label}
      </span>
      <p className="w-full flex-1 text-sm break-all drop-shadow-md md:text-lg">
        {children}
      </p>
      {correct !== undefined && (
        <CorrectIcon className="size-4 stroke-6 md:size-6" />
      )}
      {selected !== undefined && correct === undefined && (
        <span
          className={clsx(
            "text-foreground flex size-5 shrink-0 items-center justify-center rounded-md md:size-6",
            selected ? "bg-white" : "bg-white/20",
          )}
        >
          {selected && <Check className="size-3 stroke-5 md:size-4" />}
        </span>
      )}
    </button>
  )
}

export default AnswerButton
