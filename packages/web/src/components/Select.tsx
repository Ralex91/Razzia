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
        "focus:border-primary flex w-full cursor-pointer items-center justify-between rounded-lg border-2 border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 focus:outline-none",
        className,
      ),
    )}
    {...props}
  >
    {children}
    {!hideChevron && (
      <RadixSelect.Icon>
        <ChevronDown className="size-4 text-gray-400" />
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
          "z-50 w-(--radix-select-trigger-width) overflow-hidden rounded-lg border border-gray-200 bg-white shadow-md",
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
        "flex cursor-pointer items-center justify-between gap-3 rounded-sm px-3 py-1.5 text-sm text-gray-700 outline-none hover:bg-gray-100 focus:bg-gray-100 data-[state=checked]:font-semibold",
        className,
      ),
    )}
    {...props}
  >
    <RadixSelect.ItemText>{children}</RadixSelect.ItemText>
    <RadixSelect.ItemIndicator>
      <Check className="size-3.5 text-gray-500" />
    </RadixSelect.ItemIndicator>
  </RadixSelect.Item>
)
