import type { Page } from "@playwright/test"
import type { Question, QuestionResult } from "@razzia/common/types/game"
import { expect, test } from "@razzia/e2e/utils/fixtures"
import { t } from "@razzia/e2e/utils/i18n"
import { loginManager } from "@razzia/e2e/utils/manager"
import { seedResult } from "@razzia/e2e/utils/results"

const question = (
  overrides: Partial<Question>,
  playerAnswers: QuestionResult["playerAnswers"],
): QuestionResult => ({
  type: "single",
  question: "",
  answers: ["Yes", "No"],
  solutions: [0],
  cooldown: 3,
  time: -1,
  ...overrides,
  playerAnswers,
})

const openResult = async (manager: Page, subject: string) => {
  await loginManager(manager)
  await manager
    .getByRole("button", { name: t("manager:tabs.results"), exact: true })
    .click()

  const row = manager.getByRole("button", { name: new RegExp(subject, "u") })

  await row.click()

  const heading = manager.getByRole("heading", { name: subject })

  await expect(heading).toBeVisible()

  return { row, heading }
}

const CORRECT = t("manager:result.table.correct").trim()
const INCORRECT = t("manager:result.table.incorrect").trim()

const expectRow = (manager: Page, name: string) =>
  expect(manager.getByRole("row", { name, exact: true })).toBeVisible()

test("shows the stats, answers and points of each question", async ({
  page: manager,
}) => {
  const subject = `Results quizz ${Date.now()}`

  seedResult({
    gameMode: "quiz",
    subject,
    players: [
      { username: "Bob", points: 1000, rank: 1 },
      { username: "Alice", points: 900, rank: 2 },
    ],
    questions: [
      question({ question: "Capital of France?", answers: ["Paris", "Lyon"] }, [
        { playerName: "Alice", answerIds: [0], correct: true, points: 1000 },
        { playerName: "Bob", answerIds: [1], correct: false, points: 0 },
      ]),
      question(
        {
          type: "multi",
          question: "Primary colors?",
          answers: ["Red", "Blue", "Green"],
          solutions: [0, 1],
          options: { scoringMode: "strict" },
        },
        [
          { playerName: "Alice", answerIds: [0], correct: false, points: -100 },
          { playerName: "Bob", answerIds: [0, 1], correct: true, points: 1000 },
        ],
      ),
      question({ question: "Nobody answers" }, [
        { playerName: "Alice", answerIds: null, correct: false, points: 0 },
        { playerName: "Bob", answerIds: null, correct: false, points: 0 },
      ]),
    ],
  })

  const { row, heading } = await openResult(manager, subject)
  const previous = manager.getByRole("button", { name: t("common:previous") })
  const nextQuestion = manager.getByRole("button", { name: t("common:next") })

  await expect(row).toContainText(t("manager:result.playerCount", { count: 2 }))
  await expect(
    manager.getByText(`1${t("manager:result.paginationOf")}3`),
  ).toBeVisible()
  await expect(previous).toBeDisabled()
  await expect(manager.getByText("50%")).toBeVisible()
  await expect(manager.getByText("2/2")).toBeVisible()
  await expectRow(manager, `Alice A Paris ${CORRECT} 1000`)
  await expectRow(manager, `Bob B Lyon ${INCORRECT} 0`)

  await nextQuestion.click()
  await expect(
    manager.getByText(`2${t("manager:result.paginationOf")}3`),
  ).toBeVisible()
  await expect(
    manager.getByText(t("quizz:question.config.scoringMode.strict"), {
      exact: true,
    }),
  ).toBeVisible()
  await expect(manager.getByText("50%")).toBeVisible()
  await expectRow(manager, `Alice A Red ${INCORRECT} -100`)
  await expectRow(manager, `Bob A Red B Blue ${CORRECT} 1000`)

  await nextQuestion.click()
  await expect(
    manager.getByText(`3${t("manager:result.paginationOf")}3`),
  ).toBeVisible()
  await expect(nextQuestion).toBeDisabled()
  await expect(manager.getByText("0/2")).toBeVisible()
  await expect(manager.getByText("0%")).toBeVisible()
  await expectRow(manager, `Alice - ${INCORRECT} 0`)

  await manager.getByRole("button", { name: t("common:close") }).click()
  await expect(heading).toBeHidden()

  await row
    .locator("..")
    .getByRole("button", { name: t("manager:result.delete") })
    .click()
  await manager
    .getByRole("alertdialog")
    .getByRole("button", { name: t("common:delete") })
    .click()

  await expect(manager.getByText(t("manager:result.deleted"))).toBeVisible()
  await expect(row).toBeHidden()
})

test("falls back to computed values for older results", async ({
  page: manager,
}) => {
  const subject = `Legacy result ${Date.now()}`

  seedResult({
    gameMode: "quiz",
    subject,
    players: [{ username: "Alice", points: 1500, rank: 1 }],
    questions: [
      question({ question: "Old question" }, [
        { playerName: "Alice", answerIds: [0] },
      ]),
    ],
  })

  await openResult(manager, subject)

  await expectRow(manager, `Alice A Yes ${CORRECT} 1500`)
})

test("hides correctness in the result of a survey", async ({
  page: manager,
}) => {
  const subject = `Survey result ${Date.now()}`

  seedResult({
    gameMode: "survey",
    subject,
    players: [
      { username: "Alice", points: 0, rank: 1 },
      { username: "Bob", points: 0, rank: 2 },
    ],
    questions: [
      question({ question: "Favorite?", solutions: undefined }, [
        { playerName: "Alice", answerIds: [0] },
        { playerName: "Bob", answerIds: [0] },
      ]),
    ],
  })

  await openResult(manager, subject)

  await expect(manager.getByText("2/2")).toBeVisible()
  await expect(
    manager.getByText(t("manager:result.stats.correctAnswers")),
  ).toBeHidden()
  await expect(
    manager.getByRole("columnheader", {
      name: t("manager:result.table.correctIncorrect"),
    }),
  ).toBeHidden()
  await expectRow(manager, "Alice A Yes 0")
})
