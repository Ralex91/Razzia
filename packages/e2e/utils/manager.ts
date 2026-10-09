import { expect, type Page } from "@playwright/test"
import { BASIC_QUIZZ, MANAGER_PASSWORD } from "@razzia/e2e/utils/constants"
import { t } from "@razzia/e2e/utils/i18n"

export const loginManager = async (page: Page) => {
  await page.goto("/manager")
  await page
    .getByPlaceholder(t("manager:passwordPlaceholder"))
    .fill(MANAGER_PASSWORD)
  await page.getByRole("button", { name: t("common:submit") }).click()
  await expect(page).toHaveURL(/\/manager\/config$/u)
}

export const createGame = async (page: Page, subject = BASIC_QUIZZ) => {
  await loginManager(page)
  await page.getByRole("button", { name: subject }).click()
  await page.getByRole("button", { name: t("manager:quizz.startGame") }).click()

  const pin = page.getByText(/^\d{6}$/u)

  await expect(pin).toBeVisible()

  return (await pin.textContent()) ?? ""
}

export const startGame = async (manager: Page) => {
  await manager
    .getByRole("button", { name: t("game:startGame"), exact: true })
    .click()
}

export const next = async (manager: Page) => {
  await manager.getByRole("button", { name: t("common:next") }).click()
}
