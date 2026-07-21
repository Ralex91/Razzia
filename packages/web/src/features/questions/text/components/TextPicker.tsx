import type { SolutionPickerProps } from "@razzia/web/features/questions/types"
import { Check } from "lucide-react"

const TextSolutionPicker = ({ isSelected }: SolutionPickerProps) => {
  if (!isSelected) return null

  return (
    <span className="flex size-6 items-center justify-center rounded-full bg-green-500 text-white">
      <Check className="size-4 stroke-5" />
    </span>
  )
}

export default TextSolutionPicker
