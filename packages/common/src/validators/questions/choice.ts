import { SCORING_MODES } from "@razzia/common/constants"
import type { QuestionRefinement } from "@razzia/common/validators/questions"
import { z } from "zod"

export const multiOptionsValidator = z.object({
  scoringMode: z.enum(SCORING_MODES),
})

export const refineChoiceQuestion: QuestionRefinement = (
  { answers, solutions },
  addIssue,
) => {
  if (answers.length < 2) {
    addIssue(["answers"], "errors:quizz.tooFewAnswers")
  }

  if (answers.length > 4) {
    addIssue(["answers"], "errors:quizz.tooManyAnswers")
  }

  const hasInvalidSolution = solutions?.some(
    (solution) => !Number.isInteger(solution) || solution < 0,
  )

  if (hasInvalidSolution) {
    addIssue(["solutions"], "errors:quizz.noSolution")
  }
}
