import { seedQuizz } from "@razzia/e2e/utils/editor"
import { expect, test } from "@razzia/e2e/utils/fixtures"
import { t } from "@razzia/e2e/utils/i18n"
import { createGame, startGame } from "@razzia/e2e/utils/manager"
import { joinGame } from "@razzia/e2e/utils/player"

const nextAnimationFrame = () =>
  new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve())
  })

for (const type of ["single", "multi"] as const) {
  test(`scrolls long ${type} answers with touch and submits the bottom option`, async ({
    page: manager,
    newPage,
  }) => {
    const viewport =
      type === "single"
        ? { width: 390, height: 640 }
        : { width: 667, height: 375 }
    const subject = `Mobile scrolling ${type} ${Date.now()}`
    const answers = Array.from(
      { length: 4 },
      (_, i) =>
        `Option ${i + 1}: ${"Read the approved maintenance instructions before performing this task. ".repeat(6)}`,
    )
    seedQuizz(subject, {
      questions: [
        {
          type,
          question:
            "Which procedure should be followed before performing maintenance?",
          answers,
          solutions: [3],
          time: -1,
          cooldown: 3,
        },
      ],
    })
    const pin = await createGame(manager, subject)
    const player = await newPage({ viewport, isMobile: true, hasTouch: true })
    await joinGame(player, pin, "Touch student")
    await expect(manager.getByText("Touch student")).toBeVisible()
    await startGame(manager)
    const last = player.getByRole("button", {
      name: `D ${answers[3]}`,
      exact: true,
    })
    await expect(last).toBeVisible()
    const initialBounds = await last.boundingBox()
    expect(initialBounds).not.toBeNull()
    expect(initialBounds?.y).toBeGreaterThan(viewport.height)
    const cdp = await player.context().newCDPSession(player)
    const swipe = async () => {
      const x = viewport.width / 2
      const startY = viewport.height - 50
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchStart",
        touchPoints: [{ x, y: startY }],
      })
      await Array.from({ length: 12 }).reduce(async (previous, _, index) => {
        await previous
        await player.evaluate(nextAnimationFrame)
        await cdp.send("Input.dispatchTouchEvent", {
          type: "touchMove",
          touchPoints: [{ x, y: startY - ((startY - 50) * (index + 1)) / 12 }],
        })
      }, Promise.resolve())
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchEnd",
        touchPoints: [],
      })
    }
    await swipe()
    await expect
      .poll(() => player.evaluate(() => window.scrollY))
      .toBeGreaterThan(0)
    await expect
      .poll(async () => {
        const box = await last.boundingBox()

        if (box && box.y + box.height / 2 < viewport.height - 10) {
          return true
        }

        await swipe()

        return false
      })
      .toBe(true)
    const target = await last.boundingBox()

    if (!target) {
      throw new Error("Bottom answer has no visible bounds")
    }

    expect(target.y + target.height / 2).toBeGreaterThan(0)
    expect(target.y + target.height / 2).toBeLessThan(viewport.height)
    await player.touchscreen.tap(
      target.x + target.width / 2,
      target.y + target.height / 2,
    )

    if (type === "multi") {
      const confirm = player.getByRole("button", {
        name: t("game:confirm"),
        exact: true,
      })
      await expect
        .poll(async () => {
          const bounds = await confirm.boundingBox()

          if (bounds && bounds.y + bounds.height < viewport.height) {
            return true
          }

          await swipe()

          return false
        })
        .toBe(true)
      const box = await confirm.boundingBox()

      if (!box) {
        throw new Error("Confirm button has no visible bounds")
      }

      expect(box.y + box.height).toBeLessThanOrEqual(viewport.height)
      await player.touchscreen.tap(
        box.x + box.width / 2,
        box.y + box.height / 2,
      )
    }

    await expect(
      player.getByText(t("game:correct"), { exact: true }),
    ).toBeVisible()
    await cdp.detach()
  })
}
