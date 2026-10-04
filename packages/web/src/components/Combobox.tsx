import Input from "@razzia/web/components/Input"
import clsx from "clsx"
import { Popover } from "radix-ui"
import {
  useId,
  useRef,
  useState,
  type ComponentProps,
  type KeyboardEvent,
} from "react"

type Props = Omit<
  ComponentProps<typeof Input>,
  "value" | "onChange" | "role" | "list"
> & {
  value: string
  onValueChange: (_value: string) => void
  options: string[]
}

const Combobox = ({
  value,
  onValueChange,
  options,
  onFocus,
  onBlur,
  ...props
}: Props) => {
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const listId = useId()

  const query = value.trim().toLowerCase()
  const suggestions = options.filter(
    (option) => option !== value && option.toLowerCase().includes(query),
  )
  const isOpen = open && suggestions.length > 0

  const optionId = (index: number) => `${listId}-${index}`

  const close = () => {
    setOpen(false)
    setActiveIndex(-1)
  }

  const handleSelect = (option: string) => {
    onValueChange(option)
    close()
  }

  const handleChange = (next: string) => {
    onValueChange(next)
    setOpen(true)
    setActiveIndex(-1)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault()
      setOpen(true)

      if (suggestions.length === 0) {
        return
      }

      const delta = e.key === "ArrowDown" ? 1 : -1
      setActiveIndex(
        (current) =>
          (current + delta + suggestions.length) % suggestions.length,
      )

      return
    }

    if (e.key === "Enter" && isOpen && suggestions[activeIndex]) {
      e.preventDefault()
      handleSelect(suggestions[activeIndex])
    }
  }

  return (
    <Popover.Root open={isOpen} onOpenChange={(next) => !next && close()}>
      <Popover.Anchor asChild>
        <Input
          ref={inputRef}
          role="combobox"
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-controls={listId}
          aria-activedescendant={
            isOpen && activeIndex >= 0 ? optionId(activeIndex) : undefined
          }
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={(e) => {
            setOpen(true)
            onFocus?.(e)
          }}
          onBlur={(e) => {
            close()
            onBlur?.(e)
          }}
          {...props}
        />
      </Popover.Anchor>
      <Popover.Portal>
        <Popover.Content
          id={listId}
          role="listbox"
          align="start"
          sideOffset={4}
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
          onInteractOutside={(e) => {
            if (inputRef.current?.contains(e.target as Node)) {
              e.preventDefault()
            }
          }}
          className="border-accent bg-background z-50 max-h-60 w-(--radix-popover-trigger-width) overflow-y-auto rounded-lg border p-1 shadow-md"
        >
          {suggestions.map((option, index) => (
            <div
              key={option}
              id={optionId(index)}
              role="option"
              aria-selected={index === activeIndex}
              onMouseDown={(e) => e.preventDefault()}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => handleSelect(option)}
              className={clsx(
                "text-foreground cursor-pointer truncate rounded-sm px-3 py-1.5 text-sm",
                index === activeIndex && "bg-muted",
              )}
            >
              {option}
            </div>
          ))}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

export default Combobox
