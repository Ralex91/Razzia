import { expect, test } from "@razzia/e2e/utils/fixtures"
import { t } from "@razzia/e2e/utils/i18n"
import { loginManager } from "@razzia/e2e/utils/manager"

test("refuses a wrong manager password", async ({ page }) => {
  await page.goto("/manager")
  await page.getByPlaceholder(t("manager:passwordPlaceholder")).fill("wrong")
  await page.getByRole("button", { name: t("common:submit") }).click()

  await expect(
    page.getByText(t("errors:manager.invalidPassword")),
  ).toBeVisible()
  await expect(page).toHaveURL(/\/manager$/u)
})

test("keeps the manager logged in after a reload", async ({ page }) => {
  await loginManager(page)
  await page.reload()

  await expect(page.getByText(t("manager:configurationsTitle"))).toBeVisible()
})

test("logs the manager out", async ({ page }) => {
  await loginManager(page)
  await page.getByRole("button", { name: t("manager:logout") }).click()

  await expect(page).toHaveURL(/\/manager$/u)
  await expect(
    page.getByPlaceholder(t("manager:passwordPlaceholder")),
  ).toBeVisible()

  await page.goto("/manager/config")

  await expect(page).toHaveURL(/\/manager$/u)
})

for (const lang of ["fr", "pt"]) {
  test(`switches to ${lang} and keeps it after a reload`, async ({ page }) => {
    await page.goto("/")
    await page
      .getByRole("combobox", { name: t("common:changeLanguage") })
      .click()
    await page
      .getByRole("option", { name: t(`common:language.${lang}`) })
      .click()

    await expect(
      page.getByText(t("game:pinLabel", { lng: lang })),
    ).toBeVisible()
    await expect(
      page.getByRole("button", { name: t("common:submit", { lng: lang }) }),
    ).toBeVisible()

    await page.reload()

    await expect(
      page.getByText(t("game:pinLabel", { lng: lang })),
    ).toBeVisible()
  })
}

test.describe("portuguese browser", () => {
  test.use({ locale: "pt-BR" })

  test("detects portuguese and translates manager errors", async ({ page }) => {
    await page.goto("/")
    await expect(
      page.getByRole("combobox", {
        name: t("common:changeLanguage", { lng: "pt" }),
      }),
    ).toHaveText("PT")
    await expect(
      page.getByRole("button", { name: t("common:submit", { lng: "pt" }) }),
    ).toBeVisible()

    await page.goto("/manager")
    await page
      .getByPlaceholder(t("manager:passwordPlaceholder", { lng: "pt" }))
      .fill("wrong")
    await page
      .getByRole("button", { name: t("common:submit", { lng: "pt" }) })
      .click()
    await expect(
      page.getByText(t("errors:manager.invalidPassword", { lng: "pt" })),
    ).toBeVisible()
  })
})
