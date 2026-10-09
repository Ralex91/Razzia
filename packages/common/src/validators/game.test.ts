import { createDefaultGameSettings } from "@razzia/common/constants"
import { gameSettingsValidator } from "@razzia/common/validators/game"
import { describe, expect, it } from "vitest"

const autoAdvance = (responsesDelay: number) => ({
  autoAdvance: { enable: true, responsesDelay, leaderboardDelay: 5 },
})

describe("gameSettingsValidator", () => {
  it("accepts the default settings and partial updates", () => {
    expect(
      gameSettingsValidator.safeParse(createDefaultGameSettings()).success,
    ).toBe(true)
    expect(gameSettingsValidator.safeParse({ answersOnly: true }).success).toBe(
      true,
    )
  })

  it.each([2, 601, 4.5])("rejects an auto advance delay of %d", (delay) => {
    const result = gameSettingsValidator.safeParse(autoAdvance(delay))

    expect(result.success).toBe(false)
  })
})
