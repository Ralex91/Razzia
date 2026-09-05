import Input from "@razzia/web/components/Input"
import { useState } from "react"

interface Props {
  value: number
  min?: number
  max?: number
  onChange: (_value: number) => void
}

const ConfigNumberInput = ({ value, min, max, onChange }: Props) => {
  const [input, setInput] = useState(String(value))

  const handleChange = (raw: string) => {
    setInput(raw)

    const num = Number(raw)

    if (raw === "" || isNaN(num)) {
      return
    }

    const clamped = Math.min(max ?? num, Math.max(min ?? num, num))
    onChange(clamped)
  }

  return (
    <Input
      variant="sm"
      type="number"
      min={min}
      max={max}
      value={input}
      onChange={(e) => handleChange(e.target.value)}
      onBlur={() => setInput(String(value))}
      className="w-full"
    />
  )
}

export default ConfigNumberInput
