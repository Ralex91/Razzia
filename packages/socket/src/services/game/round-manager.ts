// oxlint-disable typescript/no-unnecessary-condition
import { EVENTS, MEDIA_TYPES, NO_TIME_LIMIT } from "@razzia/common/constants"
import type {
  Answer,
  GameResult,
  GameSettings,
  GameUpdateQuestion,
  Player,
  Question,
  QuestionResult,
  Quizz,
} from "@razzia/common/types/game"
import type { Server, Socket } from "@razzia/common/types/game/socket"
import {
  type Status,
  STATUS,
  type StatusDataMap,
} from "@razzia/common/types/game/status"
import { CooldownTimer } from "@razzia/socket/services/game/cooldown-timer"
import { PlayerManager } from "@razzia/socket/services/game/player-manager"
import {
  countAnswers,
  scoreQuestion,
} from "@razzia/socket/services/scoring/round"
import { orderToPoint, timeToPoint } from "@razzia/socket/utils/game"
import sleep from "@razzia/socket/utils/sleep"
import { nanoid } from "nanoid"

type BroadcastFn = <T extends Status>(
  _status: T,
  _data: StatusDataMap[T],
) => void
type SendFn = <T extends Status>(
  _target: string,
  _status: T,
  _data: StatusDataMap[T],
) => void

export interface RoundManagerOptions {
  quizz: Quizz
  players: PlayerManager
  cooldown: CooldownTimer
  io: Server
  gameId: string
  getManagerId: () => string
  broadcast: BroadcastFn
  send: SendFn
  onNewQuestion: () => void
  onGameFinished: (_result: GameResult) => void
  getSettings: () => GameSettings
}

interface RoundStep {
  name: string
  skip?: () => boolean
  enter: () => void
  delay: (_settings: GameSettings) => number
}

export class RoundManager {
  private readonly opts: RoundManagerOptions
  private readonly steps: RoundStep[]
  private started = false
  private currentQuestion = 0
  private currentStep = -1
  private playersAnswers: Answer[] = []
  private startTime = 0
  private leaderboard: Player[] = []
  private tempOldLeaderboard: Player[] | null = null
  private questionsHistory: QuestionResult[] = []
  private autoAdvanceTimer: NodeJS.Timeout | null = null

  constructor(opts: RoundManagerOptions) {
    this.opts = opts
    this.steps = [
      {
        name: "reveal",
        enter: () => {
          this.showResults()
        },
        delay: (settings) => settings.autoAdvance.responsesDelay,
      },
      {
        name: "leaderboard",
        skip: () => this.isLastQuestion(),
        enter: () => {
          this.showLeaderboard()
        },
        delay: (settings) => settings.autoAdvance.leaderboardDelay,
      },
    ]
  }

  isStarted(): boolean {
    return this.started
  }

  private get question(): Question {
    return this.opts.quizz.questions[this.currentQuestion]
  }

  private isAskingQuestion(): boolean {
    return this.currentStep < 0
  }

  private isLastQuestion(): boolean {
    return !this.opts.quizz.questions[this.currentQuestion + 1]
  }

  // ── Auto advance ─────────────────────────────────────────────────────────

  clearAutoAdvance(): void {
    if (!this.autoAdvanceTimer) {
      return
    }

    clearInterval(this.autoAdvanceTimer)
    this.autoAdvanceTimer = null
    this.emitAutoAdvance(null)
  }

  private emitAutoAdvance(state: { seconds: number; total: number } | null) {
    this.opts.io
      .to(this.opts.getManagerId())
      .emit(EVENTS.MANAGER.AUTO_ADVANCE, state)
  }

  private scheduleAutoAdvance(delay: number): void {
    this.clearAutoAdvance()

    if (!this.opts.getSettings().autoAdvance.enable) {
      return
    }

    let remaining = delay

    this.emitAutoAdvance({ seconds: remaining, total: delay })

    this.autoAdvanceTimer = setInterval(() => {
      remaining -= 1

      if (remaining > 0) {
        this.emitAutoAdvance({ seconds: remaining, total: delay })

        return
      }

      this.clearAutoAdvance()
      this.advance()
    }, 1000)
  }

  // ── Flow ─────────────────────────────────────────────────────────────────

  getReconnectInfo(): GameUpdateQuestion | null {
    if (!this.started) {
      return null
    }

    return {
      current: this.currentQuestion + 1,
      total: this.opts.quizz.questions.length,
    }
  }

  async start(socket: Socket): Promise<void> {
    if (this.started) {
      return
    }

    if (this.opts.players.count() === 0) {
      socket.emit(EVENTS.GAME.ERROR_MESSAGE, "errors:game.noPlayersConnected")

      return
    }

    this.started = true

    this.opts.broadcast(STATUS.SHOW_START, {
      time: 3,
      subject: this.opts.quizz.subject,
    })

    await sleep(3)

    this.opts.io.to(this.opts.gameId).emit(EVENTS.GAME.START_COOLDOWN)
    await this.opts.cooldown.start(3)

    void this.newQuestion()
  }

  advance(): void {
    if (!this.started) {
      return
    }

    this.clearAutoAdvance()

    if (this.isAskingQuestion()) {
      this.opts.cooldown.abort()

      return
    }

    this.runStep(this.currentStep + 1)
  }

  private runStep(index: number): void {
    const step = this.steps[index]

    if (!step) {
      this.nextQuestion()

      return
    }

    if (step.skip?.()) {
      this.runStep(index + 1)

      return
    }

    this.currentStep = index
    step.enter()
    this.scheduleAutoAdvance(step.delay(this.opts.getSettings()))
  }

  private nextQuestion(): void {
    if (this.isLastQuestion()) {
      this.finish()

      return
    }

    this.currentQuestion += 1
    void this.newQuestion()
  }

  private async newQuestion(): Promise<void> {
    if (!this.started) {
      return
    }

    this.currentStep = -1

    this.opts.onNewQuestion()

    this.opts.io.to(this.opts.gameId).emit(EVENTS.GAME.UPDATE_QUESTION, {
      current: this.currentQuestion + 1,
      total: this.opts.quizz.questions.length,
    })

    this.opts.broadcast(STATUS.SHOW_PREPARED, {
      totalAnswers: this.question.answers.length,
      questionNumber: this.currentQuestion + 1,
    })

    await sleep(2)

    if (!this.started) {
      return
    }

    const imageMedia = (() => {
      if (this.question.media?.type !== MEDIA_TYPES.IMAGE) {
        return undefined
      }

      return this.question.media
    })()

    this.opts.broadcast(STATUS.SHOW_QUESTION, {
      question: this.question.question,
      media: imageMedia,
      cooldown: this.question.cooldown,
    })

    await sleep(this.question.cooldown)

    if (!this.started) {
      return
    }

    this.startTime = Date.now()

    this.opts.broadcast(STATUS.SELECT_ANSWER, {
      question: this.question.question,
      answers: this.question.answers,
      media: this.question.media,
      time: this.question.time,
      totalPlayer: this.opts.players.count(),
      questionType: this.question.type,
      options: this.question.options,
    })

    await this.opts.cooldown.start(this.question.time)

    if (!this.started) {
      return
    }

    this.runStep(0)
  }

  // ── Steps ────────────────────────────────────────────────────────────────

  private showResults(): void {
    const currentPlayers = this.opts.players.getAll()

    const oldLeaderboard = (() => {
      if (this.leaderboard.length === 0) {
        return currentPlayers.map((p) => ({ ...p }))
      }

      return this.leaderboard.map((p) => ({ ...p }))
    })()

    const answerCounts = countAnswers(this.playersAnswers)

    const sortedPlayers = scoreQuestion(
      this.question,
      currentPlayers,
      this.playersAnswers,
    )

    this.opts.players.replace(sortedPlayers)

    sortedPlayers.forEach((player, index) => {
      const aheadPlayer = sortedPlayers[index - 1]

      this.opts.send(player.id, STATUS.SHOW_RESULT, {
        correct: player.lastCorrect,
        message: player.lastCorrect ? "game:correct" : "game:wrong",
        points: player.lastPoints,
        myPoints: player.points,
        rank: index + 1,
        aheadOfMe: aheadPlayer ? aheadPlayer.username : null,
      })
    })

    this.opts.send(this.opts.getManagerId(), STATUS.SHOW_RESPONSES, {
      ...this.question,
      responses: answerCounts,
    })

    this.questionsHistory.push({
      ...this.question,
      playerAnswers: currentPlayers.map((player) => ({
        playerName: player.username,
        answerIds:
          this.playersAnswers.find((a) => a.playerId === player.id)
            ?.answerIds ?? null,
      })),
    })

    this.leaderboard = sortedPlayers
    this.tempOldLeaderboard = oldLeaderboard
    this.playersAnswers = []
  }

  private showLeaderboard(): void {
    const oldLeaderboard = this.tempOldLeaderboard ?? this.leaderboard

    this.opts.send(this.opts.getManagerId(), STATUS.SHOW_LEADERBOARD, {
      oldLeaderboard: oldLeaderboard.slice(0, 5),
      leaderboard: this.leaderboard.slice(0, 5),
    })

    this.tempOldLeaderboard = null
  }

  private finish(): void {
    this.started = false
    this.clearAutoAdvance()

    const top = this.leaderboard.slice(0, 3)

    this.opts.onGameFinished({
      id: `${Date.now()}-${nanoid(8)}`,
      subject: this.opts.quizz.subject,
      date: new Date().toISOString(),
      players: this.leaderboard.map((player, index) => ({
        username: player.username,
        points: player.points,
        rank: index + 1,
      })),
      questions: this.questionsHistory,
    })

    this.opts.send(this.opts.getManagerId(), STATUS.FINISHED, {
      subject: this.opts.quizz.subject,
      top,
    })

    this.leaderboard.forEach((player, index) => {
      this.opts.send(player.id, STATUS.FINISHED, {
        subject: this.opts.quizz.subject,
        top,
        rank: index + 1,
      })
    })
  }

  // ── Player actions ───────────────────────────────────────────────────────

  selectAnswer(socket: Socket, answerIds: number[]): void {
    const player = this.opts.players.findById(socket.id)

    if (!player) {
      return
    }

    if (this.playersAnswers.find((a) => a.playerId === socket.id)) {
      return
    }

    const points = (() => {
      if (this.question.time === NO_TIME_LIMIT) {
        return orderToPoint(
          this.playersAnswers.length,
          this.opts.players.count(),
          this.question.maxPoints,
        )
      }

      return timeToPoint(this.startTime, this.question)
    })()

    this.playersAnswers.push({
      playerId: player.id,
      answerIds,
      points,
    })

    this.opts.send(socket.id, STATUS.WAIT, {
      text: "game:waitingForAnswers",
    })

    socket
      .to(this.opts.gameId)
      .emit(EVENTS.GAME.PLAYER_ANSWER, this.playersAnswers.length)
    this.opts.players.broadcastCount()

    if (this.playersAnswers.length === this.opts.players.count()) {
      this.opts.cooldown.abort()
    }
  }
}
