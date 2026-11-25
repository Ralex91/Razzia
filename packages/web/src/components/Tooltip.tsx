import type { ComponentProps, ReactNode } from "react"
import { Tooltip as RadixTooltip } from "radix-ui"
import { twMerge } from "tailwind-merge"

type Props = {
  content: ReactNode
  children: ReactNode
  className?: string
  arrowClassName?: string
} & Pick<ComponentProps<typeof RadixTooltip.Content>, "side" | "sideOffset">

const Tooltip = ({
  content,
  children,
  className,
  arrowClassName,
  side = "top",
  sideOffset = 6,
}: Props) => (
  <RadixTooltip.Root>
    <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>

    <RadixTooltip.Portal>
      <RadixTooltip.Content
        side={side}
        sideOffset={sideOffset}
        className={twMerge(
          "z-50 rounded-lg bg-black/40 px-2 py-1 text-sm font-semibold text-white drop-shadow-md data-[state=delayed-open]:animate-fade",
          className,
        )}
      >
        {content}
        <RadixTooltip.Arrow
          className={twMerge("fill-black/40", arrowClassName)}
        />
      </RadixTooltip.Content>
    </RadixTooltip.Portal>
  </RadixTooltip.Root>
)

export default Tooltip
