import Game from "@razzia/socket/services/game"
import dayjs from "dayjs"

interface EmptyGame {
  since: number
  game: Game
}

class Registry {
  private static instance: Registry | null = null
  private games: Game[] = []
  private emptyGames: EmptyGame[] = []
  private cleanupInterval: ReturnType<typeof setTimeout> | null = null
  private readonly EMPTY_GAME_TIMEOUT_MINUTES = 5
  private readonly CLEANUP_INTERVAL_MS = 60_000

  private constructor() {
    this.startCleanupTask()
  }

  static getInstance(): Registry {
    Registry.instance ??= new Registry()

    return Registry.instance
  }

  addGame(game: Game): void {
    this.games.push(game)
    console.log(`Game ${game.gameId} added. Total games: ${this.games.length}`)
  }

  getGameById(gameId: string): Game | undefined {
    return this.games.find((g) => g.gameId === gameId)
  }

  getGameByInviteCode(inviteCode: string): Game | undefined {
    return this.games.find((g) => g.inviteCode === inviteCode)
  }

  getPlayerGame(gameId: string, clientId: string): Game | undefined {
    return this.games.find(
      (g) =>
        g.gameId === gameId && g.players.some((p) => p.clientId === clientId),
    )
  }

  getManagerGame(gmageId: string, clientId: string): Game | undefined {
    return this.games.find(
      (g) => g.gameId === gmageId && g.manager.clientId === clientId,
    )
  }

  getGameByManagerSocketId(socketId: string): Game | undefined {
    return this.games.find((g) => g.manager.id === socketId)
  }

  getGameByPlayerSocketId(socketId: string): Game | undefined {
    return this.games.find((g) => g.players.some((p) => p.id === socketId))
  }

  markGameAsEmpty(game: Game): void {
    const alreadyEmpty = this.emptyGames.find(
      (g) => g.game.gameId === game.gameId,
    )

    if (!alreadyEmpty) {
      this.emptyGames.push({
        since: dayjs().unix(),
        game,
      })
      console.log(
        `Game ${game.gameId} marked as empty. Total empty games: ${this.emptyGames.length}`,
      )
    }
  }

  reactivateGame(gameId: string): void {
    const initialLength = this.emptyGames.length
    this.emptyGames = this.emptyGames.filter((g) => g.game.gameId !== gameId)

    if (this.emptyGames.length < initialLength) {
      console.log(
        `Game ${gameId} reactivated. Remaining empty games: ${this.emptyGames.length}`,
      )
    }
  }

  removeGame(gameId: string): boolean {
    const initialLength = this.games.length
    const game = this.games.find((g) => g.gameId === gameId)

    if (game) {
      game.dispose()
    }

    this.games = this.games.filter((g) => g.gameId !== gameId)
    this.emptyGames = this.emptyGames.filter((g) => g.game.gameId !== gameId)

    const removed = this.games.length < initialLength

    if (removed) {
      console.log(`Game ${gameId} removed. Total games: ${this.games.length}`)
    }

    return removed
  }

  getAllGames(): Game[] {
    return [...this.games]
  }

  getGameCount(): number {
    return this.games.length
  }

  getEmptyGameCount(): number {
    return this.emptyGames.length
  }

  private cleanupEmptyGames(): void {
    const now = dayjs()
    const stillEmpty = this.emptyGames.filter(
      (g) =>
        now.diff(dayjs.unix(g.since), "minute") <
        this.EMPTY_GAME_TIMEOUT_MINUTES,
    )

    if (stillEmpty.length === this.emptyGames.length) {
      return
    }

    const removed = this.emptyGames.filter((g) => !stillEmpty.includes(g))
    const removedGameIds = removed.map((r) => r.game.gameId)

    removed.forEach((g) => {
      g.game.dispose()
    })
    this.games = this.games.filter((g) => !removedGameIds.includes(g.gameId))
    this.emptyGames = stillEmpty

    console.log(
      `Removed ${removed.length} empty game(s). Remaining games: ${this.games.length}`,
    )
  }

  private startCleanupTask(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupEmptyGames()
    }, this.CLEANUP_INTERVAL_MS)

    console.log("Game cleanup task started")
  }

  stopCleanupTask(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
      console.log("Game cleanup task stopped")
    }
  }

  cleanup(): void {
    this.stopCleanupTask()
    this.games = []
    this.emptyGames = []
    console.log("Registry cleaned up")
  }
}

export default Registry
