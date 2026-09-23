import {
  MEDIA_TYPES,
  QUESTION_TYPES,
  QUIZZ_MODES,
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
  scoringMode: z.enum(SCORING_MODES),
})

const questionValidator = z.object({
  type: z.enum(QUESTION_TYPES),
  question: z.string().min(1, "errors:quizz.questionEmpty"),
  media: questionMediaValidator.optional(),
  answers: z
    .array(z.string().min(1, "errors:quizz.answerEmpty"))
    .min(2, "errors:quizz.tooFewAnswers")
    .max(4, "errors:quizz.tooManyAnswers"),
  solutions: z.array(z.number().int().min(0)).optional(),
  cooldown: z
    .number()
    .int()
    .min(3, "errors:quizz.cooldownTooShort")
    .max(15, "errors:quizz.cooldownTooLong"),
  time: z.number().int().min(-1),
  maxPoints: z.number().int().min(1, "errors:quizz.maxPointsTooLow").optional(),
  penalty: z.number().int().min(0, "errors:quizz.penaltyNegative").optional(),
  options: multiOptionsValidator.optional(),
})

export const quizzValidator = z
  .object({
    gameMode: z.enum(QUIZZ_MODES),
    subject: z.string().min(1, "errors:quizz.subjectEmpty"),
    questions: z.array(questionValidator).min(1, "errors:quizz.noQuestions"),
  })
  .superRefine((quizz, ctx) => {
    if (quizz.gameMode !== QUIZZ_MODES.QUIZ) {
      return
    }

    quizz.questions.forEach((question, index) => {
      if (question.solutions && question.solutions.length > 0) {
        return
      }

      ctx.addIssue({
        code: "custom",
        path: ["questions", index, "solutions"],
        message: "errors:quizz.noSolution",
      })
    })
  })

export type QuizzValidated = z.infer<typeof quizzValidator>

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null

/**
 * Upgrades quizz files written by older versions: quizzes without a `gameMode`,
 * questions without a `type`, a scalar `solutions`, or options without a
 * `scoringMode`.
 */
export const normalizeLegacyQuizz = (data: unknown): unknown => {
  if (!isRecord(data) || !Array.isArray(data.questions)) {
    return data
  }

  return {
    ...data,
    gameMode: data.gameMode ?? QUIZZ_MODES.QUIZ,
    questions: data.questions.map((question: unknown) => {
      if (!isRecord(question)) {
        return question
      }

      return {
        ...question,
        type: question.type ?? QUESTION_TYPES.SINGLE,
        solutions:
          question.solutions === undefined || Array.isArray(question.solutions)
            ? question.solutions
            : [question.solutions],
        ...(isRecord(question.options)
          ? {
              options: {
                scoringMode: SCORING_MODES.BALANCED,
                ...question.options,
              },
            }
          : {}),
      }
    }),
  }
}
