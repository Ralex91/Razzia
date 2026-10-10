import { expect, test } from "@razzia/e2e/utils/fixtures"

test("applies the instance branding", async ({ page }) => {
  await page.route("**/branding/theme.json", (route) =>
    route.fulfill({
      json: {
        appName: "My Quiz",
        colors: { primary: "#123456" },
        answerColors: ["#111111", "#222222"],
        font: { family: "Courier New" },
      },
    }),
  )

  await page.goto("/")

  await expect(page).toHaveTitle("My Quiz")
  await expect(page.getByRole("img", { name: "My Quiz" })).toBeVisible()

  const cssVariable = (name: string) =>
    page.evaluate(
      (variable) => document.documentElement.style.getPropertyValue(variable),
      name,
    )

  expect(await cssVariable("--color-primary")).toBe("#123456")
  expect(await cssVariable("--color-answer-2")).toBe("#222222")
  expect(await cssVariable("--font-display")).toBe('"Courier New", sans-serif')
})

test("keeps the default look without branding", async ({ page }) => {
  await page.route("**/branding/theme.json", (route) =>
    route.fulfill({ status: 404 }),
  )

  await page.goto("/")

  await expect(page.getByRole("img", { name: "Razzia" })).toBeVisible()
})
