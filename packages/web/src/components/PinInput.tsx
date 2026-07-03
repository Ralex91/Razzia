import clsx from "clsx"
import {
  useRef,
  type ChangeEvent,
  type ClipboardEvent,
  type KeyboardEvent,
} from "react"

interface Props {
  value: string
  onChange: (_value: string) => void
  length?: number
  className?: string
}

const PinInput = ({ value, onChange, length = 6, className }: Props) => {
  const refs = useRef<Array<HTMLInputElement | null>>([])

  const padded = value.padEnd(length, " ").slice(0, length)
  const digits = Array.from({ length }, (_, i) => padded[i].trim())

  const focus = (index: number) => {
    refs.current[Math.max(0, Math.min(length - 1, index))]?.focus()
  }

  const update = (index: number, char: string) => {
    const next = padded.split("")
    next[index] = char || " "
    onChange(next.join("").trimEnd())
  }

  const handleKeyDown =
    (index: number) => (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Backspace") {
        e.preventDefault()

        if (digits[index]) {
          update(index, "")
        } else {
          focus(index - 1)
        }

        return
      }

      if (e.key === "ArrowLeft") {
        focus(index - 1)

        return
      }

      if (e.key === "ArrowRight") {
        focus(index + 1)
      }
    }

  const handleChange =
    (index: number) => (e: ChangeEvent<HTMLInputElement>) => {
      const char = e.target.value.replace(/\D/gu, "").slice(-1)

      if (!char) {
        return
      }

      update(index, char)
      focus(index + 1)
    }

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/gu, "")
      .slice(0, length)
    onChange(pasted)
    focus(pasted.length < length ? pasted.length : length - 1)
  }

  return (
    <div className={clsx("flex gap-2", className)}>
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={handleChange(i)}
          onKeyDown={handleKeyDown(i)}
          onPaste={handlePaste}
          className="focus:border-primary border-accent w-10 flex-1 rounded-lg border-2 p-2 text-center text-lg font-semibold outline-none"
        />
      ))}
    </div>
  )
}

export default PinInput
