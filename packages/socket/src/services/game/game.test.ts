import {
  EVENTS,
  NO_TIME_LIMIT,
  QUESTION_TYPES,
  QUIZZ_MODES,
  SCORING_MODES,
} from "@razzia/common/constants"
import type { Question, Quizz } from "@razzia/common/types/game"
import { STATUS } from "@razzia/common/types/game/status"
import {
  getPath,
  getResultById,
  getResultsMeta,
} from "@razzia/socket/services/config"
import Game from "@razzia/socket/services/game"
import { createFakeIo } from "@razzia/socket/test/fake-io"
import {
  createEstimationQuestion,
  createQuestion,
  createQuizz,
} from "@razzia/socket/test/fixtures"
import fs from "fs"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const FIRST_QUESTION_DELAY_MS = 8000
const NEXT_QUESTION_DELAY_MS = 2000
const TICK_MS = 1000

const MANAGER = "manager"

const setup = (quizz: Quizz, players = ["Alice", "Bob"]) => {
  const fake = createFakeIo()
  const game = new Game(fake.io, MANAGER, quizz)
  const manager = fake.createSocket(MANAGER)

  game.reconnect(manager)

  const sockets = players.map((username) => {
    const socket = fake.createSocket(username.toLowerCase())

    game.join(socket, username)

    return socket
  })

  const status = (room: string) => fake.lastStatus(room)

  const reachAnswers = async (question: Question, first = true) => {
    await vi.advanceTimersByTimeAsync(
      (first ? FIRST_QUESTION_DELAY_MS : NEXT_QUESTION_DELAY_MS) +
        question.cooldown * 1000,
    )

    expect(status(game.gameId)?.name).toBe(STATUS.SELECT_ANSWER)
  }

  const start = async () => {
    void game.start(manager)
    await reachAnswers(quizz.questions[0])
  }

  return { ...fake, game, manager, sockets, status, start, reachAnswers }
}

beforeEach(() => {
  fs.rmSync(getPath("results"), { recursive: true, force: true })
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe("joining a game", () => {
  it("requires a username unless usernames are generated", () => {
    const { game, createSocket } = setup(createQuizz([createQuestion()]), [])

    expect(game.join(createSocket("a"))).toBe("errors:auth.usernameTooShort")

    game.updateSettings({ generatedUsernames: true })

    expect(game.join(createSocket("b"), "Ignored")).toBeNull()
    expect(game.players[0].username).not.toBe("Ignored")
  })

  it("refuses players once the game is locked", () => {
    const { game, createSocket, lastEvent } = setup(
      createQuizz([createQuestion()]),
      [],
    )

    game.setLocked(true)

    expect(lastEvent(MANAGER, EVENTS.MANAGER.LOCK_UPDATED)?.data).toBe(true)
    expect(game.join(createSocket("a"), "Alice")).toBe("errors:game.locked")
  })

  it("refuses the same client twice", () => {
    const { game, createSocket } = setup(createQuizz([createQuestion()]), [
      "Alice",
    ])

    expect(game.join(createSocket("other-socket", "alice"), "Alice")).toBe(
      "errors:game.playerAlreadyConnected",
    )
  })

  it("notifies the manager and the players", () => {
    const { game, lastEvent } = setup(createQuizz([createQuestion()]))

    expect(lastEvent(MANAGER, EVENTS.MANAGER.NEW_PLAYER)?.data).toMatchObject({
      username: "Bob",
    })
    expect(lastEvent(game.gameId, EVENTS.GAME.TOTAL_PLAYERS)?.data).toBe(2)
  })

  it("lets the manager kick a player", () => {
    const { game, lastEvent } = setup(createQuizz([createQuestion()]))

    game.kickPlayer("alice")

    expect(game.players.map((p) => p.username)).toEqual(["Bob"])
    expect(lastEvent("alice", EVENTS.GAME.RESET)?.data).toBe(
      "errors:game.kickedByManager",
    )
  })
})

describe("quiz flow", () => {
  it("refuses to start without players", async () => {
    const { game, manager, lastEvent } = setup(
      createQuizz([createQuestion()]),
      [],
    )

    await game.start(manager)

    expect(game.started).toBe(false)
    expect(lastEvent(MANAGER, EVENTS.GAME.ERROR_MESSAGE)?.data).toBe(
      "errors:game.noPlayersConnected",
    )
  })

  it("plays a full game and saves the result", async () => {
    const questions = [
      createQuestion({ solutions: [0] }),
      createQuestion({ solutions: [1] }),
    ]
    const { game, sockets, status, start, reachAnswers } = setup(
      createQuizz(questions),
    )
    const [alice, bob] = sockets

    await start()

    expect(game.updateSettings({ answersOnly: true })).toBe(false)

    game.selectAnswer(alice, [0])
    await vi.advanceTimersByTimeAsync(5000)
    game.selectAnswer(bob, [1])
    await vi.advanceTimersByTimeAsync(TICK_MS)

    expect(status("alice")).toMatchObject({
      name: STATUS.SHOW_RESULT,
      data: { correct: true, points: 1000, rank: 1, aheadOfMe: null },
    })
    expect(status("bob")).toMatchObject({
      name: STATUS.SHOW_RESULT,
      data: { correct: false, rank: 2, aheadOfMe: "Alice" },
    })
    expect(status(MANAGER)).toMatchObject({
      name: STATUS.SHOW_RESPONSES,
      data: { responses: { 0: 1, 1: 1 } },
    })

    game.advance()

    expect(status(MANAGER)?.name).toBe(STATUS.SHOW_LEADERBOARD)

    game.advance()
    await reachAnswers(questions[1], false)
    await vi.advanceTimersByTimeAsync(questions[1].time * 1000)

    expect(status("alice")?.data).toMatchObject({ correct: false })

    game.advance()

    expect(status(MANAGER)).toMatchObject({
      name: STATUS.FINISHED,
      data: { top: [{ username: "Alice", points: 1000 }, { username: "Bob" }] },
    })
    expect(status("bob")?.data).toMatchObject({ rank: 2 })
    expect(getResultsMeta().at(0)).toMatchObject({
      gameMode: QUIZZ_MODES.QUIZ,
      playerCount: 2,
    })
  })

  it("lets the manager skip the remaining answer time", async () => {
    const { game, status, start } = setup(createQuizz([createQuestion()]))

    await start()
    game.advance()
    await vi.advanceTimersByTimeAsync(TICK_MS)

    expect(status(MANAGER)?.name).toBe(STATUS.SHOW_RESPONSES)
  })

  it("ignores answers sent outside of the answer phase", async () => {
    const { game, sockets, status, manager } = setup(
      createQuizz([createQuestion({ time: NO_TIME_LIMIT })]),
    )
    const [alice, bob] = sockets

    game.selectAnswer(alice, [0])
    void game.start(manager)
    await vi.advanceTimersByTimeAsync(FIRST_QUESTION_DELAY_MS)

    expect(status(game.gameId)?.name).toBe(STATUS.SHOW_QUESTION)

    game.selectAnswer(alice, [0])
    await vi.advanceTimersByTimeAsync(3000)

    expect(status(game.gameId)?.name).toBe(STATUS.SELECT_ANSWER)

    game.selectAnswer(bob, [0])
    game.advance()
    game.selectAnswer(alice, [0])
    await vi.advanceTimersByTimeAsync(TICK_MS)

    expect(status("bob")?.data).toMatchObject({ correct: true, points: 1000 })
    expect(status("alice")?.data).toMatchObject({ correct: false })
  })

  it("ends the round once every connected player answered", async () => {
    const { game, sockets, status, start } = setup(
      createQuizz([createQuestion()]),
    )
    const [alice, bob] = sockets

    await start()
    game.setPlayerDisconnected(bob.id)
    game.selectAnswer(alice, [0])
    await vi.advanceTimersByTimeAsync(TICK_MS)

    expect(status(MANAGER)?.name).toBe(STATUS.SHOW_RESPONSES)
  })

  it("ends the round when the last player left to answer leaves", async () => {
    const { game, sockets, status, start } = setup(
      createQuizz([createQuestion()]),
    )
    const [alice, bob] = sockets

    await start()
    game.selectAnswer(alice, [0])
    await vi.advanceTimersByTimeAsync(TICK_MS)

    expect(status(MANAGER)).toBeUndefined()

    game.setPlayerDisconnected(bob.id)
    await vi.advanceTimersByTimeAsync(TICK_MS)

    expect(status(MANAGER)?.name).toBe(STATUS.SHOW_RESPONSES)
  })

  it("only counts the first answer of a player", async () => {
    const { game, sockets, status, start } = setup(
      createQuizz([createQuestion({ solutions: [0] })]),
      ["Alice", "Bob"],
    )
    const [alice] = sockets

    await start()
    game.selectAnswer(alice, [1])
    game.selectAnswer(alice, [0])
    game.advance()
    await vi.advanceTimersByTimeAsync(TICK_MS)

    expect(status("alice")?.data).toMatchObject({ correct: false })
  })

  it("skips the leaderboard between questions of the same category", async () => {
    const questions = [
      createQuestion({ category: "Geography" }),
      createQuestion({ category: "Geography " }),
    ]
    const { game, status, start } = setup(createQuizz(questions))

    await start()
    game.advance()
    await vi.advanceTimersByTimeAsync(TICK_MS)
    game.advance()

    expect(status(game.gameId)?.name).toBe(STATUS.SHOW_PREPARED)
  })

  it("shows the score movement of the whole round", async () => {
    const questions = [
      createQuestion({ category: "Round 1" }),
      createQuestion({ category: "Round 1" }),
      createQuestion({ category: "Round 2" }),
    ]
    const { game, sockets, status, start, reachAnswers } = setup(
      createQuizz(questions),
    )
    const [alice, bob] = sockets

    await start()
    game.selectAnswer(alice, [0])
    game.advance()
    await vi.advanceTimersByTimeAsync(TICK_MS)
    game.advance()

    await reachAnswers(questions[1], false)
    game.selectAnswer(bob, [0])
    game.advance()
    await vi.advanceTimersByTimeAsync(TICK_MS)
    game.advance()

    expect(status(MANAGER)).toMatchObject({
      name: STATUS.SHOW_LEADERBOARD,
      data: {
        oldLeaderboard: [{ points: 0 }, { points: 0 }],
        leaderboard: [{ points: 1000 }, { points: 1000 }],
      },
    })
  })

  it("scores by answer order when there is no time limit", async () => {
    const { game, sockets, status, start } = setup(
      createQuizz([createQuestion({ time: NO_TIME_LIMIT })]),
    )
    const [alice, bob] = sockets

    await start()
    await vi.advanceTimersByTimeAsync(60_000)
    game.selectAnswer(bob, [0])
    game.selectAnswer(alice, [0])
    await vi.advanceTimersByTimeAsync(TICK_MS)

    expect(status("bob")?.data).toMatchObject({ points: 1000 })
    expect(status("alice")?.data).toMatchObject({ points: 500 })
  })

  it("clamps estimations to the range and ignores invalid ones", async () => {
    const { game, sockets, status, start } = setup(
      createQuizz([createEstimationQuestion()]),
    )
    const [alice, bob] = sockets

    await start()
    game.selectAnswer(alice, [500])
    game.selectAnswer(bob, [Number.NaN])

    expect(status("alice")?.name).toBe(STATUS.WAIT)
    expect(status("bob")).toBeUndefined()

    game.advance()
    await vi.advanceTimersByTimeAsync(TICK_MS)

    expect(status(MANAGER)?.data).toMatchObject({ responses: { 100: 1 } })
  })

  it("advances automatically when enabled", async () => {
    const { game, status, start, events } = setup(
      createQuizz([createQuestion(), createQuestion()]),
    )

    game.updateSettings({
      autoAdvance: { enable: true, responsesDelay: 3, leaderboardDelay: 3 },
    })

    await start()
    game.advance()
    await vi.advanceTimersByTimeAsync(TICK_MS)

    expect(status(MANAGER)?.name).toBe(STATUS.SHOW_RESPONSES)
    expect(events(MANAGER, EVENTS.MANAGER.AUTO_ADVANCE).at(-1)?.data).toEqual({
      seconds: 3,
      total: 3,
    })

    await vi.advanceTimersByTimeAsync(3000)

    expect(status(MANAGER)?.name).toBe(STATUS.SHOW_LEADERBOARD)
  })
})

describe("game result", () => {
  it("records the real correctness and points of every answer", async () => {
    const question = createQuestion({
      type: QUESTION_TYPES.MULTI,
      solutions: [0, 1],
      penalty: 100,
      options: { scoringMode: SCORING_MODES.STRICT },
    })
    const { game, sockets, start } = setup(createQuizz([question]), [
      "Alice",
      "Bob",
      "Carol",
    ])
    const [alice, bob] = sockets

    await start()
    game.selectAnswer(alice, [0])
    game.selectAnswer(bob, [0, 1])
    game.advance()
    await vi.advanceTimersByTimeAsync(TICK_MS)
    game.advance()

    const [meta] = getResultsMeta()

    expect(getResultById(meta.id).questions[0].playerAnswers).toEqual([
      { playerName: "Alice", answerIds: [0], correct: false, points: -100 },
      { playerName: "Bob", answerIds: [0, 1], correct: true, points: 1000 },
      { playerName: "Carol", answerIds: null, correct: false, points: 0 },
    ])
  })
})

describe("survey flow", () => {
  it("collects answers without scoring them", async () => {
    const quizz = createQuizz(
      [createQuestion({ solutions: undefined })],
      QUIZZ_MODES.SURVEY,
    )
    const { game, sockets, status, start } = setup(quizz)
    const [alice, bob] = sockets

    await start()
    game.selectAnswer(alice, [2])
    game.selectAnswer(bob, [2])
    await vi.advanceTimersByTimeAsync(TICK_MS)

    expect(status("alice")?.name).toBe(STATUS.WAIT)
    expect(status(MANAGER)).toMatchObject({
      name: STATUS.SHOW_RESPONSES,
      data: { responses: { 2: 2 } },
    })

    game.advance()

    expect(status(MANAGER)).toMatchObject({
      name: STATUS.SUMMARY,
      data: { totalPlayers: 2, totalQuestions: 1 },
    })
    expect(getResultsMeta().at(0)?.gameMode).toBe(QUIZZ_MODES.SURVEY)
  })
})

describe("reconnection", () => {
  it("restores a disconnected player on a new socket", async () => {
    const { game, sockets, start, createSocket, lastEvent } = setup(
      createQuizz([createQuestion()]),
    )
    const [alice] = sockets

    await start()
    game.setPlayerDisconnected(alice.id)

    const newSocket = createSocket("alice-new", "alice")

    game.reconnect(newSocket)

    expect(game.players[0]).toMatchObject({ id: "alice-new", connected: true })
    expect(
      lastEvent("alice-new", EVENTS.PLAYER.SUCCESS_RECONNECT)?.data,
    ).toMatchObject({
      currentQuestion: { current: 1, total: 1 },
      status: { name: STATUS.SELECT_ANSWER },
    })
  })

  it("lets a player take over a connection not closed yet", async () => {
    const { game, sockets, start, createSocket, lastEvent, disconnected } =
      setup(createQuizz([createQuestion()]))
    const [alice] = sockets

    await start()
    game.reconnect(createSocket("alice-new", "alice"))

    expect(game.players[0]).toMatchObject({ id: "alice-new", connected: true })
    expect(
      lastEvent("alice-new", EVENTS.PLAYER.SUCCESS_RECONNECT),
    ).toBeDefined()
    expect(disconnected).toEqual([alice.id])
  })

  it("hands the game over to the latest manager connection", () => {
    const { game, createSocket, lastEvent, disconnected } = setup(
      createQuizz([createQuestion()]),
    )

    game.reconnect(createSocket("manager-tab-2", MANAGER))

    expect(game.manager).toMatchObject({ id: "manager-tab-2", connected: true })
    expect(
      lastEvent("manager-tab-2", EVENTS.MANAGER.SUCCESS_RECONNECT),
    ).toBeDefined()
    expect(lastEvent(MANAGER, EVENTS.GAME.RESET)?.data).toBe(
      "errors:game.managerAlreadyConnected",
    )
    expect(disconnected).toEqual([MANAGER])
  })
})

describe("manager grace period", () => {
  const GRACE_MS = 30_000

  it("closes the lobby when the manager does not come back in time", async () => {
    const { game } = setup(createQuizz([createQuestion()]))
    const onTimeout = vi.fn()

    game.setManagerDisconnected()
    game.waitForManager(onTimeout)
    await vi.advanceTimersByTimeAsync(GRACE_MS - TICK_MS)

    expect(onTimeout).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(TICK_MS)

    expect(onTimeout).toHaveBeenCalledOnce()
  })

  it("keeps the lobby when the manager comes back in time", async () => {
    const { game, createSocket } = setup(createQuizz([createQuestion()]))
    const onTimeout = vi.fn()

    game.setManagerDisconnected()
    game.waitForManager(onTimeout)
    await vi.advanceTimersByTimeAsync(GRACE_MS / 2)
    game.reconnect(createSocket("manager-new", MANAGER))
    await vi.advanceTimersByTimeAsync(GRACE_MS)

    expect(onTimeout).not.toHaveBeenCalled()
  })
})
