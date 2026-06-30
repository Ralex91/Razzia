import type { QuestionOptions } from "@razzia/common/types/game"

export interface AnswerComponentProps {
  answers: string[]
  options?: QuestionOptions
  onSubmit: (_answerKeys: number[]) => void
  readOnly?: boolean
}

export interface SolutionPickerProps {
  index: number
  isSelected: boolean
}
