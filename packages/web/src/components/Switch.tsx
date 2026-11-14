import type { ComponentProps } from "react"
import clsx from "clsx"
import { Switch as RadixSwitch } from "radix-ui"
import { twMerge } from "tailwind-merge"

type Props = ComponentProps<typeof RadixSwitch.Root>

const Switch = ({ className, ...props }: Props) => (
  <RadixSwitch.Root
    className={twMerge(
      clsx(
        "relative h-5 w-9 cursor-pointer rounded-md bg-accent transition-colors focus-visible:outline-2 focus-visible:outline-primary data-[state=checked]:bg-primary",
        className,
      ),
    )}
    {...props}
  >
    <RadixSwitch.Thumb className="block size-4 translate-x-0.5 rounded-sm bg-white shadow-sm transition-transform data-[state=checked]:translate-x-4.5" />
  </RadixSwitch.Root>
)

export default Switch
