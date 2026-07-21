import { QUESTION_TYPES } from "@razzia/common/constants"
import type { Question } from "@razzia/common/types/game"
import type { ScoringFn } from "@razzia/socket/services/scoring"

export const type = QUESTION_TYPES.ORDER

export const scoring: ScoringFn = (
  question: Question,
  answerIds: number[],
): number => {
  if (answerIds.length !== question.solutions.length) {
    return 0
  }

  // Count items in correct position
  let correct = 0

  for (let i = 0; i < question.solutions.length; i++) {
    if (answerIds[i] === question.solutions[i]) {
      correct++
    }
  }

  return correct / question.solutions.length
}
