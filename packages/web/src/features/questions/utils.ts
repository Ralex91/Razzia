import { estimationAccuracy } from "@razzia/common/questions/estimation"
import { isEstimationOptions } from "@razzia/common/questions/options"
import type { Question } from "@razzia/common/types/game"

export const choiceInitialValues = (question: Question): Partial<Question> => {
  if (question.answers.length >= 2) {
    return {}
  }

  return { answers: ["", ""], solutions: [0] }
}

export const isAnswerCorrect = (
  question: Question,
  answerIds: number[] | null,
): boolean => {
  const { solutions, options } = question

  if (!answerIds || !solutions) {
    return false
  }

  if (isEstimationOptions(options)) {
    const value = answerIds.at(0)
    const solution = solutions.at(0)

    return (
      value !== undefined &&
      solution !== undefined &&
      estimationAccuracy(value, solution, options.margin) > 0
    )
  }

  return answerIds.some((id) => solutions.includes(id))
}
