import * as RadixSwitch from "@radix-ui/react-switch"
import clsx from "clsx"
import type { ComponentProps } from "react"
import { twMerge } from "tailwind-merge"

type Props = ComponentProps<typeof RadixSwitch.Root>

const Switch = ({ className, ...props }: Props) => (
  <RadixSwitch.Root
    className={twMerge(
      clsx(
        "data-[state=checked]:bg-primary focus-visible:outline-primary bg-accent relative h-5 w-9 cursor-pointer rounded-md transition-colors focus-visible:outline-2",
        className,
      ),
    )}
    {...props}
  >
    <RadixSwitch.Thumb className="block size-4 translate-x-0.5 rounded-sm bg-white shadow-sm transition-transform data-[state=checked]:translate-x-4.5" />
  </RadixSwitch.Root>
)

export default Switch
