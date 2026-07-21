import type {
  QuestionOptions,
  QuestionType,
  ScoringMode,
} from "@razzia/common/types/game"
import * as multi from "@razzia/web/features/questions/multi"
import * as order from "@razzia/web/features/questions/order"
import * as single from "@razzia/web/features/questions/single"
import * as text from "@razzia/web/features/questions/text"
import type {
  AnswerComponentProps,
  SolutionPickerProps,
} from "@razzia/web/features/questions/types"
import type { ComponentType } from "react"

interface QuestionRegistryEntry {
  labelKey: string
  defaultOptions?: QuestionOptions
  scoringModes?: ScoringMode[]
  AnswerComponent: ComponentType<AnswerComponentProps>
  ConfigComponent: ComponentType
  SolutionPicker: ComponentType<SolutionPickerProps>
}

export const QUESTION_REGISTRY: Record<QuestionType, QuestionRegistryEntry> = {
  single,
  multi,
  order,
  text,
}

export const QUESTION_TYPE_LIST = Object.keys(
  QUESTION_REGISTRY,
) as QuestionType[]
