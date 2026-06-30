import { SCORING_MODES } from "@razzia/common/constants"
import type {
  MultiQuestionOptions,
  ScoringMode,
} from "@razzia/common/types/game"

export { default as AnswerComponent } from "@razzia/web/features/questions/multi/components/MultiAnswers"

export { default as ConfigComponent } from "@razzia/web/features/questions/multi/components/MultiConfig"

export { default as SolutionPicker } from "@razzia/web/features/questions/multi/components/MultiPicker"

export const labelKey = "quizz:questionType.multi"

export const defaultOptions: MultiQuestionOptions = {
  scoringMode: SCORING_MODES.BALANCED,
}

export const scoringModes: ScoringMode[] = [
  SCORING_MODES.STRICT,
  SCORING_MODES.BALANCED,
  SCORING_MODES.LENIENT,
]
