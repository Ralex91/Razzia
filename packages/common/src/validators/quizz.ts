import {
  MEDIA_TYPES,
  QUESTION_TYPES,
  SCORING_MODES,
} from "@razzia/common/constants"
import { z } from "zod"

export const questionMediaValidator = z.object({
  type: z
    .enum([MEDIA_TYPES.IMAGE, MEDIA_TYPES.VIDEO, MEDIA_TYPES.AUDIO])
    .optional(),
  url: z.url("errors:quizz.invalidMediaUrl"),
})

const multiOptionsValidator = z.object({
  scoringMode: z.enum(SCORING_MODES).default(SCORING_MODES.BALANCED),
})

// Backward compat: questions saved before type was required default to "single"
const questionValidator = z.preprocess(
  (data) => {
    if (
      typeof data === "object" &&
      data !== null &&
      !("type" in (data as Record<string, unknown>))
    ) {
      return {
        ...(data as Record<string, unknown>),
        type: QUESTION_TYPES.SINGLE,
      }
    }

    return data
  },
  z.object({
    type: z.enum(QUESTION_TYPES),
    question: z.string().min(1, "errors:quizz.questionEmpty"),
    media: questionMediaValidator.optional(),
    answers: z
      .array(z.string().min(1, "errors:quizz.answerEmpty"))
      .min(2, "errors:quizz.tooFewAnswers")
      .max(4, "errors:quizz.tooManyAnswers"),
    solutions: z
      .union([z.number().int().min(0), z.array(z.number().int().min(0)).min(1)])
      .transform((v) => (Array.isArray(v) ? v : [v])),
    cooldown: z.number().int().min(3).max(15),
    time: z.number().int().min(-1),
    maxPoints: z.number().int().min(0).optional(),
    options: multiOptionsValidator.optional(),
  }),
)

export const quizzValidator = z.object({
  subject: z.string().min(1, "errors:quizz.subjectEmpty"),
  questions: z.array(questionValidator).min(1, "errors:quizz.noQuestions"),
})

export type QuizzValidated = z.infer<typeof quizzValidator>
