import { REVEAL_QUIZZ } from "@razzia/e2e/utils/constants"
import { expect, test } from "@razzia/e2e/utils/fixtures"
import { t } from "@razzia/e2e/utils/i18n"
import { createGame, startGame } from "@razzia/e2e/utils/manager"
import { answer, joinGame } from "@razzia/e2e/utils/player"

test("shows the answer explanation when revealing the answer", async ({
  page: manager,
  newPage,
}) => {
  const pin = await createGame(manager, REVEAL_QUIZZ)
  const player = await newPage()

  await joinGame(player, pin, "Alice")
  await expect(manager.getByText("Alice")).toBeVisible()
  await startGame(manager)

  const note = "Paris has been the capital of France since 987."

  await answer(player, "Paris")
  await expect(player.getByText(t("game:correct"))).toBeVisible()
  await expect(manager.getByText(note)).toBeVisible()
})

test("keeps the answers reachable on phones when the question has an image", async ({
  page: manager,
  newPage,
}) => {
  const pin = await createGame(manager, REVEAL_QUIZZ)
  const player = await newPage({
    viewport: { width: 390, height: 664 },
    isMobile: true,
    hasTouch: true,
  })

  await joinGame(player, pin, "Alice")
  await expect(manager.getByText("Alice")).toBeVisible()
  await startGame(manager)

  const showImage = player.getByRole("button", {
    name: t("game:media.showImage"),
  })
  const answerButton = player.getByRole("button", { name: /^A Paris$/u })

  await expect(showImage).toBeVisible()
  await expect(answerButton).toBeInViewport()
  await expect(
    player.getByRole("img", { name: "Which city is shown?" }),
  ).toHaveCount(0)

  await showImage.click()
  await expect(
    player
      .getByRole("dialog")
      .getByRole("img", { name: "Which city is shown?" }),
  ).toBeVisible()
  await player.keyboard.press("Escape")

  await answerButton.click()
  await expect(player.getByText(t("game:correct"))).toBeVisible()
})

test("shows the question image inline on desktop", async ({
  page: manager,
  newPage,
}) => {
  const pin = await createGame(manager, REVEAL_QUIZZ)
  const player = await newPage()

  await joinGame(player, pin, "Alice")
  await expect(manager.getByText("Alice")).toBeVisible()
  await startGame(manager)

  await expect(player.getByRole("button", { name: /^A Paris$/u })).toBeVisible()
  await expect(
    player.getByRole("button", { name: t("game:media.showImage") }),
  ).toHaveCount(0)

  await answer(player, "Paris")
  await expect(player.getByText(t("game:correct"))).toBeVisible()
})
