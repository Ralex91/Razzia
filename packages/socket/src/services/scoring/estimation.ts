import { QUESTION_TYPES } from "@razzia/common/constants"
import { estimationAccuracy } from "@razzia/common/questions/estimation"
import { isEstimationOptions } from "@razzia/common/questions/options"
import type { Question } from "@razzia/common/types/game"
import type { ScoringFn } from "@razzia/socket/services/scoring"

export const type = QUESTION_TYPES.ESTIMATION

export const scoring: ScoringFn = (
  question: Question,
  answerIds: number[],
): number => {
  const value = answerIds.at(0)
  const solution = question.solutions?.at(0)

  if (
    value === undefined ||
    solution === undefined ||
    !isEstimationOptions(question.options)
  ) {
    return 0
  }

  return estimationAccuracy(value, solution, question.options.margin)
}
