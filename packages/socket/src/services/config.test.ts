import { QUIZZ_MODES } from "@razzia/common/constants"
import type { GameResult } from "@razzia/common/types/game"
import {
  deleteQuizz,
  deleteResult,
  getPath,
  getQuizz,
  getQuizzById,
  getQuizzMeta,
  getResultById,
  getResultsMeta,
  initConfig,
  saveQuizz,
  saveResult,
  updateQuizz,
} from "@razzia/socket/services/config"
import { DomainError } from "@razzia/socket/services/errors"
import { createQuestion, createQuizz } from "@razzia/socket/test/fixtures"
import fs from "fs"
import { join } from "path"
import { beforeEach, describe, expect, it } from "vitest"

const quizzDir = () => getPath("quizz")
const resultsDir = () => getPath("results")

const writeJson = (path: string, data: unknown) =>
  fs.writeFileSync(path, JSON.stringify(data))

const createResult = (overrides: Partial<GameResult> = {}): GameResult => ({
  id: "result",
  gameMode: QUIZZ_MODES.QUIZ,
  subject: "Subject",
  date: "2026-01-01T00:00:00.000Z",
  players: [],
  questions: [],
  ...overrides,
})

const expectDomainError = (fn: () => unknown, key: string) => {
  expect(fn).toThrow(DomainError)
  expect(fn).toThrow(key)
}

beforeEach(() => {
  fs.rmSync(getPath(), { recursive: true, force: true })
  initConfig()
})

describe("initConfig", () => {
  it("creates the example quizz on first launch", () => {
    expect(getQuizz().map((q) => q.subject)).toEqual(["Example Quizz"])
  })
})

describe("quizz storage", () => {
  it("saves, reads, updates and deletes a quizz", () => {
    const { id } = saveQuizz(createQuizz([createQuestion()]))

    expect(getQuizzById(id).subject).toBe("Test quizz")

    updateQuizz(id, { ...createQuizz([createQuestion()]), subject: "Renamed" })

    expect(getQuizzById(id).subject).toBe("Renamed")

    deleteQuizz(id)

    expectDomainError(() => getQuizzById(id), "errors:quizz.notFound")
  })

  it("rejects an invalid quizz with the first error key", () => {
    expectDomainError(
      () => saveQuizz(createQuizz([])),
      "errors:quizz.noQuestions",
    )
  })

  it("lists quizz sorted by subject, numbers included", () => {
    saveQuizz({ ...createQuizz([createQuestion()]), subject: "Quizz 10" })
    saveQuizz({ ...createQuizz([createQuestion()]), subject: "quizz 2" })

    expect(getQuizzMeta().map((q) => q.subject)).toEqual([
      "Example Quizz",
      "quizz 2",
      "Quizz 10",
    ])
  })

  it("skips invalid files and assigns an id to files without one", () => {
    writeJson(join(quizzDir(), "broken.json"), { subject: "" })
    fs.writeFileSync(join(quizzDir(), "unreadable.json"), "{")
    writeJson(join(quizzDir(), "legacy.json"), {
      subject: "Legacy",
      questions: [
        {
          question: "Q",
          answers: ["A", "B"],
          solutions: 0,
          cooldown: 5,
          time: 10,
        },
      ],
    })

    const legacy = getQuizz().find((q) => q.subject === "Legacy")
    const stored = JSON.parse(
      fs.readFileSync(join(quizzDir(), "legacy.json"), "utf-8"),
    ) as { id?: string }

    expect(getQuizz()).toHaveLength(2)
    expect(legacy?.id).toBeTypeOf("string")
    expect(stored.id).toBe(legacy?.id)
  })

  it("never resolves an id to a file outside of the quizz folder", () => {
    writeJson(getPath("secret.json"), createQuizz([createQuestion()]))

    expectDomainError(() => deleteQuizz("../secret"), "errors:quizz.notFound")
    expect(fs.existsSync(getPath("secret.json"))).toBe(true)
  })
})

describe("results storage", () => {
  it("lists results from the most recent one", () => {
    saveResult(createResult({ id: "old", date: "2026-01-01T00:00:00.000Z" }))
    saveResult(createResult({ id: "new", date: "2026-02-01T00:00:00.000Z" }))

    expect(getResultsMeta().map((r) => r.id)).toEqual(["new", "old"])
  })

  it("reads results saved before survey mode as quiz results", () => {
    fs.mkdirSync(resultsDir(), { recursive: true })
    writeJson(join(resultsDir(), "legacy.json"), {
      ...createResult({ id: "legacy" }),
      gameMode: undefined,
    })

    expect(getResultById("legacy").gameMode).toBe(QUIZZ_MODES.QUIZ)
    expect(getResultsMeta()[0].gameMode).toBe(QUIZZ_MODES.QUIZ)
  })

  it("deletes a result", () => {
    saveResult(createResult({ id: "to-delete" }))
    deleteResult("to-delete")

    expect(getResultsMeta()).toEqual([])
    expectDomainError(
      () => getResultById("to-delete"),
      "errors:result.notFound",
    )
  })
})
