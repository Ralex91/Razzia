import type { QuestionOptions } from "@razzia/common/types/game"
import type { ManagerStatusDataMap } from "@razzia/common/types/game/status"

export interface AnswerComponentProps {
  answers: string[]
  options?: QuestionOptions
  onSubmit: (_answerKeys: number[]) => void
  readOnly?: boolean
  fill?: boolean
}

export interface SolutionPickerProps {
  index: number
  isSelected: boolean
}

export interface PreparedComponentProps {
  totalAnswers: number
}

export interface ResponsesComponentProps {
  data: ManagerStatusDataMap["SHOW_RESPONSES"]
}
