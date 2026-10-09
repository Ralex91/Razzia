import {
  countAnswers,
  scoreQuestion,
} from "@razzia/socket/services/scoring/round"
import { createPlayer, createQuestion } from "@razzia/socket/test/fixtures"
import { describe, expect, it } from "vitest"

const alice = () => createPlayer({ id: "alice", username: "Alice" })
const bob = () => createPlayer({ id: "bob", username: "Bob" })

describe("countAnswers", () => {
  it("counts how many players picked each answer", () => {
    const counts = countAnswers([
      { playerId: "alice", answerIds: [0, 1], points: 0 },
      { playerId: "bob", answerIds: [1], points: 0 },
    ])

    expect(counts).toEqual({ 0: 1, 1: 2 })
  })
})

describe("scoreQuestion", () => {
  it("adds the answer points to correct players and sorts by score", () => {
    const players = [alice(), bob()]
    const scored = scoreQuestion(createQuestion({ solutions: [0] }), players, [
      { playerId: "alice", answerIds: [1], points: 900 },
      { playerId: "bob", answerIds: [0], points: 800 },
    ])

    expect(scored.map((p) => [p.username, p.points, p.lastCorrect])).toEqual([
      ["Bob", 800, true],
      ["Alice", 0, false],
    ])
  })

  it("scales the points with partial scoring", () => {
    const question = createQuestion({ type: "multi", solutions: [0, 1] })
    const [scored] = scoreQuestion(
      question,
      [alice()],
      [{ playerId: "alice", answerIds: [0], points: 1000 }],
    )

    expect(scored.lastPoints).toBe(500)
  })

  it("applies the penalty to wrong answers only, never below zero", () => {
    const question = createQuestion({ solutions: [0], penalty: 300 })
    const players = [
      createPlayer({ id: "alice", points: 1000 }),
      createPlayer({ id: "bob", points: 100 }),
      createPlayer({ id: "carol", points: 500 }),
    ]

    const scored = scoreQuestion(question, players, [
      { playerId: "alice", answerIds: [1], points: 800 },
      { playerId: "bob", answerIds: [1], points: 800 },
    ])

    expect(scored.map((p) => [p.id, p.points])).toEqual([
      ["alice", 700],
      ["carol", 500],
      ["bob", 0],
    ])
    expect(scored[0].lastPoints).toBe(-300)
  })

  it("counts a right answer worth no points as correct", () => {
    const question = createQuestion({ solutions: [0], penalty: 300 })
    const [scored] = scoreQuestion(
      question,
      [alice()],
      [{ playerId: "alice", answerIds: [0], points: 0 }],
    )

    expect(scored).toMatchObject({ lastCorrect: true, points: 0, streak: 1 })
    expect(scored.lastPoints).toBe(0)
  })

  it("tracks the answer streak", () => {
    const player = createPlayer({ id: "alice", streak: 2 })
    const question = createQuestion({ solutions: [0] })

    scoreQuestion(
      question,
      [player],
      [{ playerId: "alice", answerIds: [0], points: 500 }],
    )

    expect(player.streak).toBe(3)

    scoreQuestion(question, [player], [])

    expect(player.streak).toBe(0)
  })
})
