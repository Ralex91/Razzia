import { QUESTION_TYPES } from "@razzia/common/constants"
import type { Question } from "@razzia/common/types/game"
import type { ScoringFn } from "@razzia/socket/services/scoring"

export const type = QUESTION_TYPES.SINGLE

export const scoring: ScoringFn = (
  question: Question,
  answerIds: number[],
): number =>
  answerIds.length === 1 && question.solutions.includes(answerIds[0]) ? 1 : 0
