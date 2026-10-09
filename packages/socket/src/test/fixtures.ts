import {
  ESTIMATION_INPUT_MODES,
  QUESTION_TYPES,
  QUIZZ_MODES,
} from "@razzia/common/constants"
import type { Player, Question, Quizz } from "@razzia/common/types/game"

export const createQuestion = (
  overrides: Partial<Question> = {},
): Question => ({
  type: QUESTION_TYPES.SINGLE,
  question: "Question ?",
  answers: ["A", "B", "C", "D"],
  solutions: [0],
  cooldown: 3,
  time: 10,
  ...overrides,
})

export const createEstimationQuestion = (
  overrides: Partial<Question> = {},
): Question =>
  createQuestion({
    type: QUESTION_TYPES.ESTIMATION,
    answers: [],
    solutions: [50],
    options: {
      inputMode: ESTIMATION_INPUT_MODES.SLIDER,
      min: 0,
      max: 100,
      step: 1,
      margin: 10,
    },
    ...overrides,
  })

export const createQuizz = (
  questions: Question[],
  gameMode: Quizz["gameMode"] = QUIZZ_MODES.QUIZ,
): Quizz => ({ gameMode, subject: "Test quizz", questions })

export const createPlayer = (overrides: Partial<Player> = {}): Player => ({
  id: "socket-id",
  clientId: "client-id",
  connected: true,
  username: "Player",
  points: 0,
  streak: 0,
  ...overrides,
})
