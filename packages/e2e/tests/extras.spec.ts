import type { Question } from "@razzia/common/types/game"
import { seedQuizz } from "@razzia/e2e/utils/editor"
import { expect, test } from "@razzia/e2e/utils/fixtures"
import { t } from "@razzia/e2e/utils/i18n"
import { createGame, next, startGame } from "@razzia/e2e/utils/manager"
import { answer, joinGame } from "@razzia/e2e/utils/player"

const question = (overrides: Partial<Question>): Question => ({
  type: "single",
  question: "Question?",
  answers: ["Right", "Wrong"],
  solutions: [0],
  cooldown: 3,
  time: 30,
  ...overrides,
})

const uniqueSubject = (name: string) => `${name} ${Date.now()}`

test("plays video and audio questions", async ({ page: manager, newPage }) => {
  const subject = uniqueSubject("Media game")

  seedQuizz(subject, {
    questions: [
      question({
        question: "Video question",
        category: "Round",
        media: { type: "video", url: "/media/clip.mp4" },
      }),
      question({
        question: "Audio question",
        category: "Round",
        media: { type: "audio", url: "/media/sound.mp3" },
      }),
    ],
  })

  const pin = await createGame(manager, subject)
  const player = await newPage()

  await joinGame(player, pin, "Alice")
  await expect(manager.getByText("Alice")).toBeVisible()
  await startGame(manager)

  await expect(manager.locator("video[src='/media/clip.mp4']")).toBeVisible()
  await answer(player, "Right")
  await next(manager)

  await expect(manager.locator("audio[src='/media/sound.mp3']")).toBeVisible()
  await expect(player.locator("audio[src='/media/sound.mp3']")).toBeVisible()

  await answer(player, "Right")
  await expect(player.getByText(t("game:correct"))).toBeVisible()
})

test("shows a streak badge after two right answers in a row", async ({
  page: manager,
  newPage,
}) => {
  const subject = uniqueSubject("Streak game")

  seedQuizz(subject, {
    questions: [
      question({ question: "First" }),
      question({ question: "Second" }),
      question({ question: "Third" }),
    ],
  })

  const pin = await createGame(manager, subject)
  const player = await newPage()

  await joinGame(player, pin, "Alice")
  await expect(manager.getByText("Alice")).toBeVisible()
  await startGame(manager)

  const streakBadge = manager.getByRole("img", { name: t("game:streak") })

  await answer(player, "Right")
  await next(manager)
  await expect(manager.getByText(t("game:leaderboard"))).toBeVisible()
  await expect(streakBadge).toHaveCount(0)
  await next(manager)

  await answer(player, "Right")
  await next(manager)
  await expect(manager.getByText(t("game:leaderboard"))).toBeVisible()
  await expect(streakBadge).toBeVisible()
})

test("expands the QR code in the waiting room", async ({ page }) => {
  await createGame(page)

  await page.getByRole("button", { name: t("game:showQrCode") }).click()

  const dialog = page.getByRole("alertdialog")

  await expect(dialog.locator("svg").first()).toBeVisible()
  await dialog.getByRole("button", { name: t("common:close") }).click()
  await expect(dialog).toBeHidden()
})
