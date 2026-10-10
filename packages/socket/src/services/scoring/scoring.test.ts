import { QUESTION_TYPES, SCORING_MODES } from "@razzia/common/constants"
import type { ScoringMode } from "@razzia/common/types/game"
import { QUESTION_SCORING } from "@razzia/socket/services/scoring"
import {
  createEstimationQuestion,
  createQuestion,
} from "@razzia/socket/test/fixtures"
import { describe, expect, it } from "vitest"

describe("single choice scoring", () => {
  const score = QUESTION_SCORING[QUESTION_TYPES.SINGLE]
  const question = createQuestion({ solutions: [1] })

  it("scores only the right answer", () => {
    expect(score(question, [1])).toBe(1)
    expect(score(question, [0])).toBe(0)
  })

  it("rejects several answers even if one is right", () => {
    expect(score(question, [0, 1])).toBe(0)
  })
})

describe("multiple choice scoring", () => {
  const score = QUESTION_SCORING[QUESTION_TYPES.MULTI]
  const question = (scoringMode?: ScoringMode) =>
    createQuestion({
      type: QUESTION_TYPES.MULTI,
      solutions: [0, 1],
      options: scoringMode ? { scoringMode } : undefined,
    })

  it.each([
    [SCORING_MODES.STRICT, [0, 1], 1],
    [SCORING_MODES.STRICT, [0], 0],
    [SCORING_MODES.STRICT, [0, 1, 2], 0],
    [SCORING_MODES.BALANCED, [0], 0.5],
    [SCORING_MODES.BALANCED, [0, 1, 2], 0.5],
    [SCORING_MODES.BALANCED, [0, 2, 3], 0],
    [SCORING_MODES.LENIENT, [0, 2, 3], 0.5],
    [SCORING_MODES.LENIENT, [0, 1, 2, 3], 1],
  ])("%s mode scores %j as %d", (mode, answerIds, expected) => {
    expect(score(question(mode), answerIds)).toBe(expected)
  })

  it("defaults to balanced mode", () => {
    expect(score(question(), [0, 2])).toBe(0)
    expect(score(question(), [0])).toBe(0.5)
  })
})

describe("estimation scoring", () => {
  const score = QUESTION_SCORING[QUESTION_TYPES.ESTIMATION]
  const question = createEstimationQuestion({ solutions: [50] })

  it("scores the accuracy of the estimation", () => {
    expect(score(question, [50])).toBe(1)
    expect(score(question, [60])).toBe(0.5)
    expect(score(question, [61])).toBe(0)
  })

  it("scores nothing without an answer", () => {
    expect(score(question, [])).toBe(0)
  })
})
