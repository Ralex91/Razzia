import { expect, type Page } from "@playwright/test"
import { t } from "@razzia/e2e/utils/i18n"

export const enterPin = async (page: Page, pin: string) => {
  await page.goto("/")
  await page
    .getByRole("textbox", { name: t("game:pinDigit", { position: 1 }) })
    .click()
  await page.keyboard.type(pin)
  await page.getByRole("button", { name: t("common:submit") }).click()
}

export const joinGame = async (page: Page, pin: string, username: string) => {
  await page.goto(`/?pin=${pin}`)
  await page.getByPlaceholder(t("game:usernamePlaceholder")).fill(username)
  await page.getByRole("button", { name: t("common:submit") }).click()
  await expect(page.getByText(t("game:waitingForPlayers"))).toBeVisible()
}

export const answer = async (page: Page, label: string) => {
  await page
    .getByRole("button", { name: new RegExp(`^[A-D] ${label}$`, "u") })
    .click()
}

export const confirm = async (page: Page) => {
  await page.getByRole("button", { name: t("game:confirm") }).click()
}

export const expectPoints = async (page: Page, points: number) => {
  await expect(page.getByText(String(points), { exact: true })).toBeVisible()
}
