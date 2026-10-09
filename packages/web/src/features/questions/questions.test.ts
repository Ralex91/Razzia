import {
  ESTIMATION_INPUT_MODES,
  QUESTION_TYPES,
} from "@razzia/common/constants"
import type {
  EstimationQuestionOptions,
  Question,
} from "@razzia/common/types/game"
import { calculatePercentages } from "@razzia/web/features/game/utils/score"
import {
  getRangeRatio,
  snapToStep,
} from "@razzia/web/features/questions/estimation/utils"
import { isAnswerCorrect } from "@razzia/web/features/questions/utils"
import { describe, expect, it } from "vitest"

const estimationOptions = (
  overrides: Partial<EstimationQuestionOptions> = {},
): EstimationQuestionOptions => ({
  inputMode: ESTIMATION_INPUT_MODES.SLIDER,
  min: 0,
  max: 100,
  step: 1,
  margin: 10,
  ...overrides,
})

const question = (overrides: Partial<Question> = {}): Question => ({
  type: QUESTION_TYPES.MULTI,
  question: "Question ?",
  answers: ["A", "B", "C"],
  solutions: [0, 1],
  cooldown: 5,
  time: 10,
  ...overrides,
})

describe("isAnswerCorrect", () => {
  it("accepts any right choice", () => {
    expect(isAnswerCorrect(question(), [1, 2])).toBe(true)
    expect(isAnswerCorrect(question(), [2])).toBe(false)
  })

  it("is false without an answer or a solution", () => {
    expect(isAnswerCorrect(question(), null)).toBe(false)
    expect(isAnswerCorrect(question({ solutions: undefined }), [0])).toBe(false)
  })

  it("accepts estimations within the margin", () => {
    const estimation = question({
      type: QUESTION_TYPES.ESTIMATION,
      solutions: [50],
      options: estimationOptions(),
    })

    expect(isAnswerCorrect(estimation, [60])).toBe(true)
    expect(isAnswerCorrect(estimation, [61])).toBe(false)
  })
})

describe("snapToStep", () => {
  it("snaps to the closest step from the minimum", () => {
    expect(snapToStep(12, estimationOptions({ min: 1, step: 5 }))).toBe(11)
  })

  it("keeps the value within the range", () => {
    expect(snapToStep(150, estimationOptions())).toBe(100)
    expect(snapToStep(-5, estimationOptions())).toBe(0)
  })

  it("avoids floating point noise with decimal steps", () => {
    expect(snapToStep(0.3, estimationOptions({ step: 0.1 }))).toBe(0.3)
  })
})

describe("getRangeRatio", () => {
  it("places the value on the range", () => {
    expect(getRangeRatio(25, estimationOptions())).toBe(0.25)
    expect(getRangeRatio(200, estimationOptions())).toBe(1)
  })

  it("handles an empty range", () => {
    expect(getRangeRatio(5, estimationOptions({ min: 10, max: 10 }))).toBe(0)
  })
})

describe("calculatePercentages", () => {
  it("converts answer counts to rounded percentages", () => {
    expect(calculatePercentages({ 0: 1, 1: 2 })).toEqual({
      0: "33%",
      1: "67%",
    })
    expect(calculatePercentages({})).toEqual({})
  })
})
