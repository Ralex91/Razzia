import clsx from "clsx"
import { type PropsWithChildren } from "react"
import { twMerge } from "tailwind-merge"

type Props = {
  className?: string
} & PropsWithChildren

const Card = ({ children, className }: Props) => (
  <div
    className={twMerge(
      clsx(
        "z-10 flex w-full max-w-80 flex-col rounded-xl bg-background p-4 shadow-sm",
        className,
      ),
    )}
  >
    {children}
  </div>
)

export default Card
