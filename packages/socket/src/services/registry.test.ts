import type Game from "@razzia/socket/services/game"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const EMPTY_GAME_TIMEOUT_MS = 5 * 60_000
const CLEANUP_INTERVAL_MS = 60_000

const createGame = (gameId: string) => {
  const dispose = vi.fn()

  return { game: { gameId, dispose } as unknown as Game, dispose }
}

const loadRegistry = async () => {
  const { default: Registry } = await import("@razzia/socket/services/registry")

  return Registry.getInstance()
}

beforeEach(() => {
  vi.resetModules()
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe("Registry", () => {
  it("removes games left empty for more than 5 minutes", async () => {
    const registry = await loadRegistry()
    const { game, dispose } = createGame("empty")

    registry.addGame(game)
    registry.markGameAsEmpty(game)

    await vi.advanceTimersByTimeAsync(
      EMPTY_GAME_TIMEOUT_MS - CLEANUP_INTERVAL_MS,
    )

    expect(registry.getGameById("empty")).toBe(game)

    await vi.advanceTimersByTimeAsync(CLEANUP_INTERVAL_MS)

    expect(registry.getGameById("empty")).toBeUndefined()
    expect(dispose).toHaveBeenCalled()
  })

  it("keeps a game reactivated before the timeout", async () => {
    const registry = await loadRegistry()
    const { game } = createGame("reactivated")

    registry.addGame(game)
    registry.markGameAsEmpty(game)
    registry.reactivateGame("reactivated")

    await vi.advanceTimersByTimeAsync(EMPTY_GAME_TIMEOUT_MS * 2)

    expect(registry.getGameById("reactivated")).toBe(game)
  })
})
