import { ESTIMATION_INPUT_MODES } from "@razzia/common/constants"
import { isEstimationOptions } from "@razzia/common/questions/options"
import type { QuestionRefinement } from "@razzia/common/validators/questions"
import { z } from "zod"

export const estimationOptionsValidator = z.object({
  inputMode: z.enum(ESTIMATION_INPUT_MODES),
  min: z.number(),
  max: z.number(),
  step: z.number(),
  margin: z.number(),
})

export const refineEstimationQuestion: QuestionRefinement = (
  { options, solutions },
  addIssue,
) => {
  if (!isEstimationOptions(options)) {
    addIssue(["options"], "errors:quizz.estimationInvalidOptions")

    return
  }

  if (options.step <= 0) {
    addIssue(["options", "step"], "errors:quizz.estimationStepInvalid")
  }

  if (options.margin < 0) {
    addIssue(["options", "margin"], "errors:quizz.estimationMarginNegative")
  }

  if (options.min >= options.max) {
    addIssue(["options", "max"], "errors:quizz.estimationInvalidRange")
  }

  const solution = solutions?.at(0)
  const isOutOfRange =
    solution !== undefined && (solution < options.min || solution > options.max)

  if ((solutions?.length ?? 0) > 1 || isOutOfRange) {
    addIssue(["solutions"], "errors:quizz.estimationSolutionOutOfRange")
  }
}
