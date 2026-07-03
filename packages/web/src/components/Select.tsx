import * as RadixSelect from "@radix-ui/react-select"
import clsx from "clsx"
import { Check, ChevronDown } from "lucide-react"
import type { ComponentProps } from "react"
import { twMerge } from "tailwind-merge"

export const Select = RadixSelect.Root

export const SelectValue = RadixSelect.Value

type SelectTriggerProps = ComponentProps<typeof RadixSelect.Trigger> & {
  hideChevron?: boolean
}

export const SelectTrigger = ({
  className,
  children,
  hideChevron,
  ...props
}: SelectTriggerProps) => (
  <RadixSelect.Trigger
    className={twMerge(
      clsx(
        "focus:border-primary border-accent text-foreground bg-background flex w-full cursor-pointer items-center justify-between rounded-lg border-2 px-3 py-2 text-sm font-semibold focus:outline-none",
        className,
      ),
    )}
    {...props}
  >
    {children}
    {!hideChevron && (
      <RadixSelect.Icon>
        <ChevronDown className="text-muted-foreground size-4" />
      </RadixSelect.Icon>
    )}
  </RadixSelect.Trigger>
)

type SelectContentProps = ComponentProps<typeof RadixSelect.Content>

export const SelectContent = ({
  className,
  children,
  ...props
}: SelectContentProps) => (
  <RadixSelect.Portal>
    <RadixSelect.Content
      position="popper"
      sideOffset={4}
      className={twMerge(
        clsx(
          "border-accent bg-background z-50 w-(--radix-select-trigger-width) overflow-hidden rounded-lg border shadow-md",
          className,
        ),
      )}
      {...props}
    >
      <RadixSelect.Viewport className="p-1">{children}</RadixSelect.Viewport>
    </RadixSelect.Content>
  </RadixSelect.Portal>
)

type SelectItemProps = ComponentProps<typeof RadixSelect.Item>

export const SelectItem = ({
  className,
  children,
  ...props
}: SelectItemProps) => (
  <RadixSelect.Item
    className={twMerge(
      clsx(
        "text-foreground hover:bg-muted focus:bg-muted flex cursor-pointer items-center justify-between gap-3 rounded-sm px-3 py-1.5 text-sm outline-none data-[state=checked]:font-semibold",
        className,
      ),
    )}
    {...props}
  >
    <RadixSelect.ItemText>{children}</RadixSelect.ItemText>
    <RadixSelect.ItemIndicator>
      <Check className="text-muted-foreground size-3.5" />
    </RadixSelect.ItemIndicator>
  </RadixSelect.Item>
)
