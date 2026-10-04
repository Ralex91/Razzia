import type {
  Question,
  QuestionOptions,
  QuestionType,
  ScoringMode,
} from "@razzia/common/types/game"
import * as estimation from "@razzia/web/features/questions/estimation"
import * as multi from "@razzia/web/features/questions/multi"
import * as single from "@razzia/web/features/questions/single"
import type {
  AnswerComponentProps,
  PreparedComponentProps,
  ResponsesComponentProps,
  SolutionPickerProps,
} from "@razzia/web/features/questions/types"
import type { ComponentType } from "react"

interface QuestionRegistryEntry {
  labelKey: string
  defaultOptions?: QuestionOptions
  scoringModes?: ScoringMode[]
  initialValues: (_question: Question) => Partial<Question>
  AnswerComponent: ComponentType<AnswerComponentProps>
  ConfigComponent: ComponentType
  AnswersEditor?: ComponentType
  SolutionPicker?: ComponentType<SolutionPickerProps>
  PreparedComponent?: ComponentType<PreparedComponentProps>
  ResponsesComponent?: ComponentType<ResponsesComponentProps>
}

export const QUESTION_REGISTRY: Record<QuestionType, QuestionRegistryEntry> = {
  single,
  multi,
  estimation,
}

export const QUESTION_TYPE_LIST = Object.keys(
  QUESTION_REGISTRY,
) as QuestionType[]
