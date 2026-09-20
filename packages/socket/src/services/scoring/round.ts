import type { Answer, Player, Question } from "@razzia/common/types/game"
import { QUESTION_SCORING } from "@razzia/socket/services/scoring"

export type ScoredPlayer = Player & {
  lastCorrect: boolean
  lastPoints: number
}

export const countAnswers = (answers: Answer[]): Record<number, number> => {
  const answerIds = answers.flatMap((answer) => answer.answerIds)

  return answerIds.reduce<Record<number, number>>((acc, id) => {
    acc[id] = (acc[id] ?? 0) + 1

    return acc
  }, {})
}

export const scoreQuestion = (
  question: Question,
  players: Player[],
  answers: Answer[],
): ScoredPlayer[] => {
  const scored = players.map((player) => {
    const playerAnswer = answers.find((a) => a.playerId === player.id)

    const scoreMultiplier = (() => {
      if (!playerAnswer) {
        return 0
      }

      const scoring = QUESTION_SCORING[question.type]

      return scoring(question, playerAnswer.answerIds)
    })()

    const points = Math.round((playerAnswer?.points ?? 0) * scoreMultiplier)
    const isCorrect = points > 0
    const penalty = !isCorrect && playerAnswer ? (question.penalty ?? 0) : 0

    player.points = Math.max(0, player.points + points - penalty)
    player.streak = isCorrect ? player.streak + 1 : 0

    return {
      ...player,
      lastCorrect: isCorrect,
      lastPoints: isCorrect ? points : -penalty,
    }
  })

  return scored.sort((a, b) => b.points - a.points)
}
