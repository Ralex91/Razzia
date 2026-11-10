import clsx from "clsx"
import React from "react"

type Props = React.ComponentProps<"input"> & {
  variant?: "sm" | "md"
}

const Input = ({
  className,
  type = "text",
  variant = "md",
  ...otherProps
}: Props) => (
  <input
    type={type}
    className={clsx(
      "rounded-lg border-2 border-accent font-semibold text-foreground focus:border-primary focus:outline-none",
      variant === "md" && "p-2 text-lg",
      variant === "sm" && "px-3 py-2 text-sm",
      className,
    )}
    {...otherProps}
  />
)

export default Input
