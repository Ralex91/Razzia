import type { Page } from "@playwright/test"
import {
  answerInput,
  openQuizzTab,
  readQuizz,
  saveQuizz,
} from "@razzia/e2e/utils/editor"
import { expect, test } from "@razzia/e2e/utils/fixtures"
import { t } from "@razzia/e2e/utils/i18n"
import { listMediaFiles, pngFile, wavFile } from "@razzia/e2e/utils/media"

const openLibrary = async (page: Page) => {
  await page.getByRole("button", { name: t("quizz:media.library") }).click()

  const dialog = page.getByRole("dialog", { name: t("quizz:media.library") })

  await expect(dialog).toBeVisible()

  return dialog
}

const createQuestion = async (page: Page, subject: string) => {
  await page.getByRole("button", { name: t("manager:quizz.create") }).click()
  await page.getByPlaceholder(t("quizz:titleQuizzPlaceholder")).fill(subject)
  await page
    .getByPlaceholder(t("quizz:question.placeholder"))
    .fill("Which media?")
  await answerInput(page, 0).fill("This one")
  await answerInput(page, 1).fill("Another")
}

test.beforeEach(async ({ page }) => {
  await openQuizzTab(page)
})

test("uploads, searches, filters and picks a media", async ({ page }) => {
  const tag = `lib${Date.now()}`

  await createQuestion(page, `Library quizz ${tag}`)

  const dialog = await openLibrary(page)

  await dialog
    .locator("input[type=file]")
    .setInputFiles([pngFile(`${tag}-image`), wavFile(`${tag}-sound`)])
  await dialog.getByPlaceholder(t("quizz:media.search")).fill(tag)

  const image = dialog.getByTitle(new RegExp(`^${tag}-image-.+\\.png$`, "u"))
  const sound = dialog.getByTitle(new RegExp(`^${tag}-sound-.+\\.wav$`, "u"))

  await expect(image).toBeVisible()
  await expect(sound).toBeVisible()

  await dialog
    .getByRole("combobox", { name: t("quizz:media.filterByType") })
    .click()
  await page
    .getByRole("option", { name: t("quizz:question.media.audio") })
    .click()
  await expect(sound).toBeVisible()
  await expect(image).toBeHidden()

  await dialog
    .getByRole("combobox", { name: t("quizz:media.filterByType") })
    .click()
  await page.getByRole("option", { name: t("quizz:media.filter.all") }).click()
  await dialog.getByRole("radio", { name: t("quizz:media.view.list") }).click()
  await expect(image).toContainText(t("quizz:question.media.image"))
  await expect(sound).toContainText(t("quizz:question.media.audio"))

  await dialog.getByPlaceholder(t("quizz:media.search")).fill(`${tag}-nothing`)
  await expect(dialog.getByText(t("quizz:media.noResults"))).toBeVisible()

  await dialog.getByPlaceholder(t("quizz:media.search")).fill(tag)
  await image.click()

  await expect(dialog).toBeHidden()
  await expect(page.getByRole("img", { name: "Question Media" })).toBeVisible()
  await saveQuizz(page)

  expect(readQuizz(`Library quizz ${tag}`)?.questions[0].media).toMatchObject({
    type: "image",
    url: expect.stringMatching(new RegExp(`^/media/${tag}-image-`, "u")),
  })
})

test("deletes a media and detaches it from the question", async ({ page }) => {
  const tag = `del${Date.now()}`

  await createQuestion(page, `Delete media quizz ${tag}`)

  let dialog = await openLibrary(page)

  await dialog.locator("input[type=file]").setInputFiles(pngFile(tag))
  await dialog.getByPlaceholder(t("quizz:media.search")).fill(tag)
  await dialog.getByTitle(new RegExp(`^${tag}-`, "u")).click()
  await expect(page.getByRole("img", { name: "Question Media" })).toBeVisible()

  await page.getByRole("button", { name: t("quizz:addQuestion") }).click()
  dialog = await openLibrary(page)
  await dialog.getByPlaceholder(t("quizz:media.search")).fill(tag)
  await dialog.getByRole("button", { name: t("quizz:media.delete") }).click()
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: t("common:delete") })
    .click()

  await expect(dialog.getByText(t("quizz:media.noResults"))).toBeVisible()
  expect(listMediaFiles().some((file) => file.startsWith(tag))).toBe(false)

  await dialog.getByRole("button", { name: t("common:close") }).click()
  await page.getByRole("button", { name: /^1 Which media\?/u }).click()
  await expect(
    page.getByPlaceholder(t("quizz:question.placeholder")),
  ).toHaveValue("Which media?")
  await expect(page.getByRole("img", { name: "Question Media" })).toBeHidden()
})

test("attaches a media from a URL", async ({ page }) => {
  const subject = `URL media quizz ${Date.now()}`
  const url = "https://example.com/picture.png"

  await createQuestion(page, subject)
  await page.getByRole("button", { name: t("quizz:media.fromUrl") }).click()
  await page.getByPlaceholder(t("quizz:question.mediaUrlPlaceholder")).fill(url)
  await page
    .getByRole("button", { name: t("quizz:question.media.image") })
    .click()

  await expect(page.getByRole("img", { name: "Question Media" })).toBeVisible()
  await saveQuizz(page)

  expect(readQuizz(subject)?.questions[0].media).toEqual({
    type: "image",
    url,
  })
})
