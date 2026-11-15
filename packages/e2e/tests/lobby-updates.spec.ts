import { expect, test } from "@razzia/e2e/utils/fixtures"
import { t } from "@razzia/e2e/utils/i18n"
import { createGame } from "@razzia/e2e/utils/manager"
import { joinGame } from "@razzia/e2e/utils/player"

test("keeps all concurrent joins in the lobby before and after a manager reload", async ({
  page: manager,
  newPage,
}) => {
  const pin = await createGame(manager)
  const names = Array.from(
    { length: 6 },
    (_, i) => `Concurrent player ${i + 1}`,
  )
  const players = await Promise.all(names.map(() => newPage()))

  await Promise.all(players.map((player, i) => joinGame(player, pin, names[i])))
  await expect(manager.getByText(/^Concurrent player [1-6]$/u)).toHaveCount(6)
  await Promise.all(
    names.map((name) =>
      expect(manager.getByText(name, { exact: true })).toBeVisible(),
    ),
  )

  await manager.reload()
  await expect(manager.getByText(/^Concurrent player [1-6]$/u)).toHaveCount(6)
  await Promise.all(
    names.map((name) =>
      expect(manager.getByText(name, { exact: true })).toBeVisible(),
    ),
  )

  await manager.getByText(names[0], { exact: true }).click()
  await expect(
    players[0].getByRole("textbox", {
      name: t("game:pinDigit", { position: 1 }),
    }),
  ).toBeVisible()
  await expect(manager.getByText(names[0], { exact: true })).toHaveCount(0)
  await expect(manager.getByText(/^Concurrent player [2-6]$/u)).toHaveCount(5)
})
