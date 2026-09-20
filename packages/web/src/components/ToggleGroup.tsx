import clsx from "clsx"
import { ToggleGroup as RadixToggleGroup } from "radix-ui"
import { twMerge } from "tailwind-merge"

interface Item<T extends string> {
  value: T
  label: string
}

interface Props<T extends string> {
  items: Array<Item<T>>
  value: T
  onChange: (_value: T) => void
  className?: string
}

const ToggleGroup = <T extends string>({
  items,
  value,
  onChange,
  className,
}: Props<T>) => (
  <RadixToggleGroup.Root
    type="single"
    value={value}
    onValueChange={(next) => {
      if (next) {
        onChange(next as T)
      }
    }}
    className={twMerge(
      clsx(
        "bg-accent flex h-10 items-center gap-0.5 rounded-lg p-0.5",
        className,
      ),
    )}
  >
    {items.map((item) => (
      <RadixToggleGroup.Item
        key={item.value}
        value={item.value}
        className="text-muted-foreground data-[state=on]:bg-background data-[state=on]:text-foreground focus-visible:outline-primary flex h-full cursor-pointer items-center rounded-md px-3 text-sm font-semibold focus-visible:outline-2"
      >
        {item.label}
      </RadixToggleGroup.Item>
    ))}
  </RadixToggleGroup.Root>
)

export default ToggleGroup
