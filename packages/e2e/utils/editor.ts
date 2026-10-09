import { expect, type Page } from "@playwright/test"
import type { Question, Quizz } from "@razzia/common/types/game"
import { CONFIG_PATH } from "@razzia/e2e/utils/constants"
import { t } from "@razzia/e2e/utils/i18n"
import { loginManager } from "@razzia/e2e/utils/manager"
import fs from "fs"
import { join } from "path"

export const openQuizzTab = async (page: Page) => {
  await loginManager(page)
  await page
    .getByRole("button", { name: t("manager:tabs.quizz"), exact: true })
    .click()
}

export const quizzRow = (page: Page, subject: string) =>
  page.getByText(subject, { exact: true }).locator("..")

export const numberSetting = (page: Page, label: string) =>
  page.getByRole("spinbutton", { name: label, exact: true })

export const switchSetting = (page: Page, label: string) =>
  page.getByRole("switch", { name: label, exact: true })

export const selectOption = async (
  page: Page,
  label: string,
  option: string,
) => {
  await page.getByRole("combobox", { name: label, exact: true }).click()
  await page.getByRole("option", { name: option }).click()
}

export const answerInput = (page: Page, index: number) =>
  page.getByPlaceholder(t("quizz:addAnswerPlaceholder")).nth(index)

export const solutionPicker = (page: Page, index: number) =>
  page.getByRole("button", {
    name: t("quizz:markCorrect", { label: String.fromCharCode(65 + index) }),
  })

export const toggleSolution = async (page: Page, index: number) => {
  await solutionPicker(page, index).click()
}

export const addAnswer = async (page: Page) => {
  await page.getByRole("button", { name: t("quizz:addAnswer") }).click()
}

export const saveQuizz = async (
  page: Page,
  message = t("quizz:quizzSaved"),
) => {
  await page.getByRole("button", { name: t("common:save") }).click()
  await expect(page.getByText(message)).toBeVisible()
}

export const readQuizz = (subject: string): Quizz | undefined => {
  const dir = join(CONFIG_PATH, "quizz")

  return fs
    .readdirSync(dir)
    .map(
      (file) => JSON.parse(fs.readFileSync(join(dir, file), "utf-8")) as Quizz,
    )
    .find((quizz) => quizz.subject === subject)
}

const DEFAULT_SEED_QUESTIONS: Question[] = [
  {
    type: "single",
    question: "Question to edit",
    answers: ["Yes", "No"],
    solutions: [0],
    cooldown: 5,
    time: 20,
  },
]

export const seedQuizz = (
  subject: string,
  {
    gameMode = "quiz",
    questions = DEFAULT_SEED_QUESTIONS,
  }: Partial<Pick<Quizz, "gameMode" | "questions">> = {},
) => {
  const id = subject.toLowerCase().replace(/\W+/gu, "-")

  fs.writeFileSync(
    join(CONFIG_PATH, "quizz", `${id}.json`),
    JSON.stringify({ id, gameMode, subject, questions }),
  )
}
