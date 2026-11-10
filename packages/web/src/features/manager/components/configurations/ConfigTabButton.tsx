import type { ButtonHTMLAttributes, PropsWithChildren } from "react"
import clsx from "clsx"

const ConfigTabButton = ({
  children,
  active,
  ...otherProps
}: ButtonHTMLAttributes<HTMLButtonElement> &
  PropsWithChildren & { active?: boolean }) => (
  <button
    className={clsx(
      "flex-1 rounded-lg px-4 py-2 font-semibold text-accent-foreground hover:bg-accent",
      active && "bg-primary text-white hover:bg-primary/90",
    )}
    {...otherProps}
  >
    <div>{children}</div>
  </button>
)

export default ConfigTabButton
