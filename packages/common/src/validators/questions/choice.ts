import { z } from "zod"
import type { QuestionRefinement } from "@razzia/common/validators/questions"
import {
  MAX_ANSWERS,
  MIN_ANSWERS,
  SCORING_MODES,
} from "@razzia/common/constants"

export const multiOptionsValidator = z.object({
  scoringMode: z.enum(SCORING_MODES),
})

export const refineChoiceQuestion: QuestionRefinement = (
  { answers, solutions },
  addIssue,
) => {
  if (answers.length < MIN_ANSWERS) {
    addIssue(["answers"], "errors:quizz.tooFewAnswers")
  }

  if (answers.length > MAX_ANSWERS) {
    addIssue(["answers"], "errors:quizz.tooManyAnswers")
  }

  const hasInvalidSolution = solutions?.some(
    (solution) => !Number.isInteger(solution) || solution < 0,
  )

  if (hasInvalidSolution) {
    addIssue(["solutions"], "errors:quizz.noSolution")
  }
}
