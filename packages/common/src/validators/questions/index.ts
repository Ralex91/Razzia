import { QUESTION_TYPES } from "@razzia/common/constants"
import type { Question, QuestionType } from "@razzia/common/types/game"
import { refineChoiceQuestion } from "@razzia/common/validators/questions/choice"
import { refineEstimationQuestion } from "@razzia/common/validators/questions/estimation"

export type AddIssue = (_path: Array<string | number>, _message: string) => void

export type QuestionRefinement = (
  _question: Question,
  _addIssue: AddIssue,
) => void

export const QUESTION_REFINEMENTS: Record<QuestionType, QuestionRefinement> = {
  [QUESTION_TYPES.SINGLE]: refineChoiceQuestion,
  [QUESTION_TYPES.MULTI]: refineChoiceQuestion,
  [QUESTION_TYPES.ESTIMATION]: refineEstimationQuestion,
}
