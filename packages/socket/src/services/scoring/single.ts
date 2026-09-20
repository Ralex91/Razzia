import { QUESTION_TYPES } from "@razzia/common/constants"
import type { Question } from "@razzia/common/types/game"
import type { ScoringFn } from "@razzia/socket/services/scoring"

export const type = QUESTION_TYPES.SINGLE

export const scoring: ScoringFn = (
  question: Question,
  answerIds: number[],
): number => {
  if (answerIds.length !== 1) {
    return 0
  }

  if (!question.solutions?.includes(answerIds[0])) {
    return 0
  }

  return 1
}
