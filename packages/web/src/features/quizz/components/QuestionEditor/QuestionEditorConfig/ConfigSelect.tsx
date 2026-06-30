import * as Select from "@radix-ui/react-select"
import { Check, ChevronDown } from "lucide-react"

interface Option<T extends string = string> {
  value: T
  label: string
}

interface Props<T extends string = string> {
  value: T
  options: Array<Option<T>>
  onValueChange: (_value: T) => void
}

const ConfigSelect = <T extends string>({
  value,
  options,
  onValueChange,
}: Props<T>) => (
  <Select.Root value={value} onValueChange={onValueChange}>
    <Select.Trigger className="flex w-full cursor-pointer items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 hover:border-gray-300 focus:ring-2 focus:ring-gray-300 focus:outline-none">
      <Select.Value />
      <Select.Icon>
        <ChevronDown className="size-4 text-gray-400" />
      </Select.Icon>
    </Select.Trigger>

    <Select.Portal>
      <Select.Content
        position="popper"
        sideOffset={4}
        className="z-50 w-(--radix-select-trigger-width) overflow-hidden rounded-lg border border-gray-200 bg-white shadow-md"
      >
        <Select.Viewport className="p-1">
          {options.map((opt) => (
            <Select.Item
              key={opt.value}
              value={opt.value}
              className="flex cursor-pointer items-center justify-between rounded-sm px-3 py-1.5 text-sm text-gray-700 outline-none hover:bg-gray-100 focus:bg-gray-100 data-[state=checked]:font-semibold"
            >
              <Select.ItemText>{opt.label}</Select.ItemText>
              <Select.ItemIndicator>
                <Check className="size-3.5 text-gray-500" />
              </Select.ItemIndicator>
            </Select.Item>
          ))}
        </Select.Viewport>
      </Select.Content>
    </Select.Portal>
  </Select.Root>
)

export default ConfigSelect
