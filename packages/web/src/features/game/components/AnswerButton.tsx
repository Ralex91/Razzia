import clsx from "clsx"
import { Check, X } from "lucide-react"
import type { ButtonHTMLAttributes, PropsWithChildren } from "react"

type Props = PropsWithChildren &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    label: string
    correct?: boolean
    selected?: boolean
    large?: boolean
  }

const AnswerButton = ({
  className,
  label,
  children,
  correct,
  selected,
  large,
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
      <span
        className={clsx(
          "flex shrink-0 items-center justify-center bg-black/20 font-bold",
          large
            ? "size-7 rounded-md text-base md:size-9 md:text-lg"
            : "size-5 rounded text-sm sm:size-7 sm:rounded-md md:size-8 md:text-base",
        )}
      >
        {label}
      </span>
      <p
        className={clsx(
          "w-full flex-1 break-all drop-shadow-md",
          large ? "text-lg md:text-2xl" : "text-sm md:text-lg",
        )}
      >
        {children}
      </p>
      {correct !== undefined && (
        <CorrectIcon className="size-4 stroke-6 md:size-6" />
      )}
      {selected !== undefined && correct === undefined && (
        <span
          className={clsx(
            "text-foreground flex shrink-0 items-center justify-center rounded-md",
            large ? "size-6 md:size-8" : "size-5 md:size-6",
            selected ? "bg-white" : "bg-white/20",
          )}
        >
          {selected && (
            <Check
              className={clsx(
                "stroke-5",
                large ? "size-4 md:size-5" : "size-3 md:size-4",
              )}
            />
          )}
        </span>
      )}
    </button>
  )
}

export default AnswerButton
