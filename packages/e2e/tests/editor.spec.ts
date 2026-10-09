import { BASIC_QUIZZ } from "@razzia/e2e/utils/constants"
import {
  addAnswer,
  answerInput,
  numberSetting,
  openQuizzTab,
  quizzRow,
  readQuizz,
  saveQuizz,
  seedQuizz,
  selectOption,
  solutionPicker,
  switchSetting,
  toggleSolution,
} from "@razzia/e2e/utils/editor"
import { expect, test } from "@razzia/e2e/utils/fixtures"
import { t } from "@razzia/e2e/utils/i18n"
import fs from "fs"

const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
)

const uniqueSubject = (name: string) => `${name} ${Date.now()}`

test.beforeEach(async ({ page }) => {
  await openQuizzTab(page)
})

test("saves every question type and setting", async ({ page }) => {
  const subject = uniqueSubject("Full quizz")

  await page.getByRole("button", { name: t("manager:quizz.create") }).click()
  await page.getByPlaceholder(t("quizz:titleQuizzPlaceholder")).fill(subject)

  await page
    .getByPlaceholder(t("quizz:question.placeholder"))
    .fill("Single question")
  await page
    .getByRole("textbox", { name: t("quizz:question.note") })
    .fill("Because")
  await answerInput(page, 0).fill("Wrong")
  await answerInput(page, 1).fill("Right")
  await toggleSolution(page, 1)
  await toggleSolution(page, 0)
  await page
    .getByRole("combobox", {
      name: t("quizz:question.config.categoryPlaceholder"),
    })
    .fill("Round 1")
  await numberSetting(page, t("quizz:question.config.maxPoints")).fill("500")
  await switchSetting(page, t("quizz:question.config.penalty")).click()
  await numberSetting(page, t("quizz:question.config.penalty")).fill("250")
  await numberSetting(page, t("quizz:question.config.questionDisplay")).fill(
    "4",
  )
  await switchSetting(page, t("quizz:question.config.answerTime")).click()

  await page.getByRole("button", { name: t("quizz:addQuestion") }).click()
  await page
    .getByPlaceholder(t("quizz:question.placeholder"))
    .fill("Multi question")
  await selectOption(
    page,
    t("quizz:question.config.answerMode"),
    t("quizz:questionType.multi"),
  )
  await addAnswer(page)
  await answerInput(page, 0).fill("A")
  await answerInput(page, 1).fill("B")
  await answerInput(page, 2).fill("C")
  await toggleSolution(page, 2)
  await selectOption(
    page,
    t("quizz:question.config.scoringMode"),
    t("quizz:question.config.scoringMode.strict"),
  )

  await page.getByRole("button", { name: t("quizz:addQuestion") }).click()
  await page
    .getByPlaceholder(t("quizz:question.placeholder"))
    .fill("Estimation question")
  await selectOption(
    page,
    t("quizz:question.config.answerMode"),
    t("quizz:questionType.estimation"),
  )
  await page
    .getByRole("spinbutton", {
      name: t("quizz:question.config.estimation.max"),
    })
    .fill("200")
  await page
    .getByRole("spinbutton", {
      name: t("quizz:question.config.estimation.min"),
    })
    .fill("10")
  await page
    .getByRole("spinbutton", {
      name: t("quizz:question.estimation.correctAnswer"),
    })
    .fill("120")
  await selectOption(
    page,
    t("quizz:question.config.estimation.inputMode"),
    t("quizz:question.config.estimation.inputModes.input"),
  )
  await numberSetting(page, t("quizz:question.config.estimation.step")).fill(
    "5",
  )
  await numberSetting(page, t("quizz:question.config.estimation.margin")).fill(
    "20",
  )

  await saveQuizz(page)

  expect(readQuizz(subject)).toMatchObject({
    gameMode: "quiz",
    questions: [
      {
        type: "single",
        question: "Single question",
        note: "Because",
        answers: ["Wrong", "Right"],
        solutions: [1],
        category: "Round 1",
        maxPoints: 500,
        penalty: 250,
        cooldown: 4,
        time: -1,
      },
      {
        type: "multi",
        answers: ["A", "B", "C"],
        solutions: [0, 2],
        category: "Round 1",
        options: { scoringMode: "strict" },
      },
      {
        type: "estimation",
        solutions: [120],
        options: { inputMode: "input", min: 10, max: 200, step: 5, margin: 20 },
      },
    ],
  })
})

test("hides the scoring settings in survey mode", async ({ page }) => {
  const subject = uniqueSubject("Survey quizz")

  await page.getByRole("button", { name: t("manager:quizz.create") }).click()
  await page.getByPlaceholder(t("quizz:titleQuizzPlaceholder")).fill(subject)
  await page.getByRole("radio", { name: t("quizz:gameMode.survey") }).click()

  await expect(solutionPicker(page, 0)).toHaveCount(0)
  await expect(solutionPicker(page, 1)).toHaveCount(0)
  await expect(
    page.getByRole("heading", { name: t("quizz:question.config.scoring") }),
  ).toBeHidden()
  await expect(
    page.getByRole("combobox", {
      name: t("quizz:question.config.categoryPlaceholder"),
    }),
  ).toBeHidden()

  await page
    .getByPlaceholder(t("quizz:question.placeholder"))
    .fill("Favorite color?")
  await answerInput(page, 0).fill("Red")
  await answerInput(page, 1).fill("Blue")
  await saveQuizz(page)

  expect(readQuizz(subject)?.gameMode).toBe("survey")
})

test("shows validation errors and jumps to the invalid question", async ({
  page,
}) => {
  await page.getByRole("button", { name: t("manager:quizz.create") }).click()
  await page
    .getByPlaceholder(t("quizz:question.placeholder"))
    .fill("Valid question")
  await answerInput(page, 0).fill("Yes")
  await answerInput(page, 1).fill("No")
  await page.getByRole("button", { name: t("quizz:addQuestion") }).click()
  await page.getByRole("button", { name: /^1 Valid question/u }).click()

  await page.getByRole("button", { name: t("common:save") }).click()

  await expect(
    page.getByPlaceholder(t("quizz:question.placeholder")),
  ).toHaveValue("")
  await expect(page.getByText(t("errors:quizz.questionEmpty"))).toBeVisible()
  await expect(page.getByText(t("errors:quizz.answerEmpty"))).toHaveCount(2)
  await expect(
    page.getByRole("button", { name: /^2 This question has errors/u }),
  ).toBeVisible()
  await expect(page).toHaveURL(/\/manager\/quizz$/u)
})

test("edits then deletes a quizz", async ({ page }) => {
  const subject = uniqueSubject("Editable quizz")

  seedQuizz(subject)
  await page.reload()
  await page
    .getByRole("button", { name: t("manager:tabs.quizz"), exact: true })
    .click()
  await quizzRow(page, subject)
    .getByRole("button", { name: t("manager:quizz.edit") })
    .click()

  await page
    .getByPlaceholder(t("quizz:question.placeholder"))
    .fill("Edited question")
  await page.getByRole("button", { name: t("quizz:addQuestion") }).click()
  await page
    .getByRole("button", { name: /^2 / })
    .getByRole("button", { name: t("quizz:question.deleteQuestion") })
    .click()
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: t("common:delete") })
    .click()
  await expect(page.getByRole("button", { name: /^2 / })).toBeHidden()
  await saveQuizz(page, t("quizz:quizzUpdated"))

  expect(readQuizz(subject)?.questions).toMatchObject([
    { question: "Edited question" },
  ])

  await page
    .getByRole("button", { name: t("manager:tabs.quizz"), exact: true })
    .click()
  await quizzRow(page, subject)
    .getByRole("button", { name: t("manager:quizz.delete") })
    .click()
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: t("common:delete") })
    .click()

  await expect(page.getByText(t("manager:quizz.deleted"))).toBeVisible()
  await expect(page.getByText(subject, { exact: true })).toBeHidden()
  expect(readQuizz(subject)).toBeUndefined()
})

test("exports and imports a quizz as JSON", async ({ page }) => {
  const download = page.waitForEvent("download")

  await quizzRow(page, BASIC_QUIZZ)
    .getByRole("button", { name: t("manager:quizz.export") })
    .click()

  const exported = JSON.parse(
    fs.readFileSync(await (await download).path(), "utf-8"),
  ) as Record<string, unknown>

  expect(exported).toMatchObject({ subject: BASIC_QUIZZ })
  expect(exported).not.toHaveProperty("id")

  const subject = uniqueSubject("Imported quizz")

  await page.locator("input[type=file]").setInputFiles({
    name: "quizz.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify({ ...exported, subject })),
  })

  await expect(page.getByText(t("quizz:quizzSaved"))).toBeVisible()
  await expect(page.getByText(subject, { exact: true })).toBeVisible()
  expect(readQuizz(subject)?.questions).toHaveLength(2)
})

test("attaches an uploaded image to a question", async ({ page }) => {
  const subject = uniqueSubject("Media quizz")

  await page.getByRole("button", { name: t("manager:quizz.create") }).click()
  await page.getByPlaceholder(t("quizz:titleQuizzPlaceholder")).fill(subject)
  await page
    .getByPlaceholder(t("quizz:question.placeholder"))
    .fill("What is this image?")
  await answerInput(page, 0).fill("A pixel")
  await answerInput(page, 1).fill("A cat")

  await page.locator("input[type=file]").setInputFiles({
    name: "pixel.png",
    mimeType: "image/png",
    buffer: PNG,
  })

  await expect(page.getByRole("img", { name: "Question Media" })).toBeVisible()
  await saveQuizz(page)

  expect(readQuizz(subject)?.questions[0].media).toMatchObject({
    type: "image",
    url: expect.stringMatching(/^\/media\/pixel-.+\.png$/u),
  })
})

test("keeps the other questions intact when deleting one in the middle", async ({
  page,
}) => {
  const subject = uniqueSubject("Delete middle")
  const fillQuestion = async (question: string, answers: string[]) => {
    await page.getByPlaceholder(t("quizz:question.placeholder")).fill(question)
    await answers.reduce(
      (previous, value, index) =>
        previous.then(async () => {
          if (index >= 2) {
            await addAnswer(page)
          }

          await answerInput(page, index).fill(value)
        }),
      Promise.resolve(),
    )
  }

  await page.getByRole("button", { name: t("manager:quizz.create") }).click()
  await page.getByPlaceholder(t("quizz:titleQuizzPlaceholder")).fill(subject)
  await fillQuestion("First", ["A1", "B1"])

  await page.getByRole("button", { name: t("quizz:addQuestion") }).click()
  await fillQuestion("Second", ["A2", "B2", "C2", "D2"])
  await toggleSolution(page, 3)
  await toggleSolution(page, 0)

  await page.getByRole("button", { name: t("quizz:addQuestion") }).click()
  await fillQuestion("Third", ["A3", "B3", "C3"])
  await toggleSolution(page, 2)
  await toggleSolution(page, 0)

  const second = page.getByRole("button", { name: /^2 Second/u })

  await second.click()
  await second
    .getByRole("button", { name: t("quizz:question.deleteQuestion") })
    .click()
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: t("common:delete") })
    .click()

  await page.getByRole("button", { name: /^2 Third/u }).click()
  await expect(answerInput(page, 2)).toHaveValue("C3")
  await saveQuizz(page)

  expect(readQuizz(subject)?.questions).toMatchObject([
    { question: "First", answers: ["A1", "B1"], solutions: [0] },
    { question: "Third", answers: ["A3", "B3", "C3"], solutions: [2] },
  ])
})

test("restores the quiz settings when switching back from survey", async ({
  page,
}) => {
  const subject = uniqueSubject("Back to quiz")

  await page.getByRole("button", { name: t("manager:quizz.create") }).click()
  await page.getByPlaceholder(t("quizz:titleQuizzPlaceholder")).fill(subject)
  await page.getByPlaceholder(t("quizz:question.placeholder")).fill("Pick B")
  await answerInput(page, 0).fill("A")
  await answerInput(page, 1).fill("B")
  await toggleSolution(page, 1)
  await toggleSolution(page, 0)

  await page.getByRole("radio", { name: t("quizz:gameMode.survey") }).click()
  await expect(
    page.getByRole("heading", { name: t("quizz:question.config.scoring") }),
  ).toBeHidden()
  await page.getByRole("radio", { name: t("quizz:gameMode.quiz") }).click()

  await expect(
    page.getByRole("heading", { name: t("quizz:question.config.scoring") }),
  ).toBeVisible()
  await expect(solutionPicker(page, 1)).toHaveAttribute("aria-pressed", "true")
  await saveQuizz(page)

  expect(readQuizz(subject)).toMatchObject({
    gameMode: "quiz",
    questions: [{ solutions: [1] }],
  })
})

test("refuses to save a quizz without a title", async ({ page }) => {
  await page.getByRole("button", { name: t("manager:quizz.create") }).click()
  await page.getByPlaceholder(t("quizz:titleQuizzPlaceholder")).fill("")
  await page.getByPlaceholder(t("quizz:question.placeholder")).fill("Question")
  await answerInput(page, 0).fill("A")
  await answerInput(page, 1).fill("B")
  await page.getByRole("button", { name: t("common:save") }).click()

  await expect(page.getByText(t("errors:quizz.subjectEmpty"))).toBeVisible()
  await expect(page).toHaveURL(/\/manager\/quizz$/u)
})

test("keeps the number settings within their limits", async ({ page }) => {
  const subject = uniqueSubject("Limits")

  await page.getByRole("button", { name: t("manager:quizz.create") }).click()
  await page.getByPlaceholder(t("quizz:titleQuizzPlaceholder")).fill(subject)
  await page.getByPlaceholder(t("quizz:question.placeholder")).fill("Question")
  await answerInput(page, 0).fill("A")
  await answerInput(page, 1).fill("B")

  const fields = [
    [t("quizz:question.config.questionDisplay"), "99", "15"],
    [t("quizz:question.config.answerTime"), "1", "5"],
    [t("quizz:question.config.maxPoints"), "-50", "0"],
  ] as const

  await fields.reduce(
    (previous, [label, typed, expected]) =>
      previous.then(async () => {
        const input = numberSetting(page, label)

        await input.fill(typed)
        await input.blur()
        await expect(input).toHaveValue(expected)
      }),
    Promise.resolve(),
  )

  await saveQuizz(page)

  expect(readQuizz(subject)?.questions[0]).toMatchObject({
    cooldown: 15,
    time: 5,
    maxPoints: 0,
  })
})
