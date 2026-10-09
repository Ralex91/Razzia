import type { Question } from "@razzia/common/types/game"
import { BASIC_QUIZZ } from "@razzia/e2e/utils/constants"
import { seedQuizz } from "@razzia/e2e/utils/editor"
import { expect, test } from "@razzia/e2e/utils/fixtures"
import { t } from "@razzia/e2e/utils/i18n"
import { createGame, next, startGame } from "@razzia/e2e/utils/manager"
import { answer, confirm, joinGame } from "@razzia/e2e/utils/player"

const question = (overrides: Partial<Question>): Question => ({
  type: "single",
  question: "Capital of France?",
  answers: ["Paris", "Lyon"],
  solutions: [0],
  cooldown: 3,
  time: 30,
  ...overrides,
})

const uniqueSubject = (name: string) => `${name} ${Date.now()}`

test("restores the manager screen after a reload", async ({
  page: manager,
  newPage,
}) => {
  const pin = await createGame(manager)
  const player = await newPage()

  await joinGame(player, pin, "Alice")
  await expect(manager.getByText("Alice")).toBeVisible()
  await startGame(manager)
  await expect(
    manager.getByRole("button", { name: t("common:skip") }),
  ).toBeVisible()

  await manager.reload()

  await expect(manager.getByText("1 / 2")).toBeVisible()
  await expect(
    manager.getByRole("button", { name: t("common:skip") }),
  ).toBeVisible()

  await answer(player, "Paris")
  await expect(
    manager.getByRole("button", { name: t("common:next") }),
  ).toBeVisible()
})

test("marks a player who did not answer in time as wrong", async ({
  page: manager,
  newPage,
}) => {
  const subject = uniqueSubject("Timeout quizz")

  seedQuizz(subject, { questions: [question({ time: 5 })] })

  const pin = await createGame(manager, subject)
  const player = await newPage()

  await joinGame(player, pin, "Alice")
  await expect(manager.getByText("Alice")).toBeVisible()
  await startGame(manager)
  await expect(player.getByRole("button", { name: /^A Paris$/u })).toBeVisible()

  await expect(player.getByText(t("game:wrong"))).toBeVisible()
  await expect(
    manager.getByRole("button", { name: t("common:next") }),
  ).toBeVisible()
})

test("reveals the answers without waiting for a player who left", async ({
  page: manager,
  newPage,
}) => {
  const pin = await createGame(manager)
  const alice = await newPage()
  const bob = await newPage()

  await joinGame(alice, pin, "Alice")
  await joinGame(bob, pin, "Bob")
  await expect(manager.getByText("Bob")).toBeVisible()
  await startGame(manager)
  await expect(alice.getByText(BASIC_QUIZZ)).toBeVisible()

  await bob.goto("/")
  await expect(bob.getByText(t("game:reconnectTitle"))).toBeVisible()

  await answer(alice, "Paris")
  await expect(alice.getByText(t("game:correct"))).toBeVisible()

  await bob.getByRole("button", { name: t("game:reconnect") }).click()
  await expect(bob.getByText(t("game:wrong"))).toBeVisible()
})

test("scores an estimation answered with the slider", async ({
  page: manager,
  newPage,
}) => {
  const subject = uniqueSubject("Slider quizz")

  seedQuizz(subject, {
    questions: [
      question({
        type: "estimation",
        question: "Pick 50",
        answers: [],
        solutions: [50],
        options: { inputMode: "slider", min: 0, max: 100, step: 1, margin: 10 },
      }),
    ],
  })

  const pin = await createGame(manager, subject)
  const player = await newPage()

  await joinGame(player, pin, "Alice")
  await expect(manager.getByText("Alice")).toBeVisible()
  await startGame(manager)

  await player
    .getByRole("slider", { name: t("game:estimation.yourAnswer") })
    .fill("55")
  await confirm(player)

  await expect(player.getByText("+750")).toBeVisible()
})

test("lets the manager skip the auto-advance countdown", async ({
  page: manager,
  newPage,
}) => {
  const pin = await createGame(manager)

  await manager.getByRole("button", { name: t("game:settings.title") }).click()

  const dialog = manager.getByRole("dialog")

  await dialog
    .getByRole("switch", {
      name: t("game:settings.autoAdvance.label"),
      exact: true,
    })
    .click()
  await dialog
    .getByLabel(t("game:settings.autoAdvance.responsesDelay"))
    .fill("600")
  await dialog.getByRole("button", { name: t("common:save") }).click()
  await expect(dialog).toBeHidden()

  const player = await newPage()

  await joinGame(player, pin, "Alice")
  await expect(manager.getByText("Alice")).toBeVisible()
  await startGame(manager)
  await answer(player, "Paris")
  await expect(player.getByText(t("game:correct"))).toBeVisible()

  await next(manager)

  await expect(manager.getByText(t("game:leaderboard"))).toBeVisible()

  await next(manager)
  await answer(player, "4")
  await expect(player.getByText(t("game:correct"))).toBeVisible()
  await next(manager)

  await expect(
    player.getByText(t("game:rank", { count: 1, ordinal: true })),
  ).toBeVisible()
})

test("keeps the waiting room when the manager reloads the page", async ({
  page: manager,
  newPage,
}) => {
  const pin = await createGame(manager)
  const player = await newPage()

  await joinGame(player, pin, "Alice")
  await expect(manager.getByText("Alice")).toBeVisible()

  await manager.reload()

  await expect(manager.getByText("Alice")).toBeVisible()
  await expect(manager.getByText(pin)).toBeVisible()
  await expect(player.getByText(t("game:waitingForPlayers"))).toBeVisible()

  await startGame(manager)
  await answer(player, "Paris")
  await expect(player.getByText(t("game:correct"))).toBeVisible()
})
