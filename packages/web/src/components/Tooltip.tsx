import type { ComponentProps, ReactNode } from "react"
import { Tooltip as RadixTooltip } from "radix-ui"

type Props = {
  content: ReactNode
  children: ReactNode
} & Pick<ComponentProps<typeof RadixTooltip.Content>, "side" | "sideOffset">

const Tooltip = ({
  content,
  children,
  side = "top",
  sideOffset = 6,
}: Props) => (
  <RadixTooltip.Root>
    <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>

    <RadixTooltip.Portal>
      <RadixTooltip.Content
        side={side}
        sideOffset={sideOffset}
        className="z-50 rounded-lg bg-black/40 px-2 py-1 text-sm font-semibold text-white drop-shadow-md data-[state=delayed-open]:animate-fade"
      >
        {content}
        <RadixTooltip.Arrow className="fill-black/40" />
      </RadixTooltip.Content>
    </RadixTooltip.Portal>
  </RadixTooltip.Root>
)

export default Tooltip
