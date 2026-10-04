import type { Question } from "@razzia/common/types/game"
import {
  createDefaultEstimationOptions,
  snapToStep,
} from "@razzia/web/features/questions/estimation/utils"

export { default as AnswerComponent } from "@razzia/web/features/questions/estimation/components/EstimationAnswers"

export { default as ConfigComponent } from "@razzia/web/features/questions/estimation/components/EstimationConfig"

export { default as AnswersEditor } from "@razzia/web/features/questions/estimation/components/EstimationEditor"

export { default as PreparedComponent } from "@razzia/web/features/questions/estimation/components/EstimationPrepared"

export { default as ResponsesComponent } from "@razzia/web/features/questions/estimation/components/EstimationResponses"

export const labelKey = "quizz:questionType.estimation"

export const defaultOptions = createDefaultEstimationOptions()

export const initialValues = (): Partial<Question> => {
  const options = createDefaultEstimationOptions()

  return {
    answers: [],
    solutions: [snapToStep((options.min + options.max) / 2, options)],
    options,
  }
}
