import type { Question, QuizzWithId } from "@razzia/common/types/game"
import crypto from "crypto"

/**
 * Fisher-Yates shuffle returning a permutation of [0, length).
 * `perm[newIndex] = oldIndex`. Uses a CSPRNG for an unbiased shuffle.
 */
const shuffledIndices = (length: number): number[] => {
  const indices = Array.from({ length }, (_, i) => i)

  for (let i = length - 1; i > 0; i -= 1) {
    const j = crypto.randomInt(i + 1)
    ;[indices[i], indices[j]] = [indices[j], indices[i]]
  }

  return indices
}

/**
 * Randomizes the order of a question's answer choices while keeping the
 * question internally consistent: `answers` are reordered and every index in
 * `solutions` is remapped to its new position. Scoring, response aggregation
 * and result history are all index-based, so remapping the solutions together
 * with the answers preserves correctness end-to-end.
 */
const shuffleQuestionAnswers = (question: Question): Question => {
  // Nothing meaningful to shuffle.
  if (question.answers.length < 2) {
    return { ...question }
  }

  const perm = shuffledIndices(question.answers.length)
  const answers = perm.map((oldIndex) => question.answers[oldIndex])

  // Build oldIndex -> newIndex so we can translate solution indices.
  const oldToNew = new Array<number>(perm.length)
  perm.forEach((oldIndex, newIndex) => {
    oldToNew[oldIndex] = newIndex
  })

  const solutions = question.solutions
    .map((oldIndex) => oldToNew[oldIndex])
    .sort((a, b) => a - b)

  return { ...question, answers, solutions }
}

/**
 * Returns a deep-ish copy of the quizz with each question's answer choices
 * shuffled. The original quizz object (shared from the repo/registry) is never
 * mutated, so every game gets a fresh, independent shuffle.
 */
export const shuffleQuizzAnswers = (quizz: QuizzWithId): QuizzWithId => ({
  ...quizz,
  questions: quizz.questions.map(shuffleQuestionAnswers),
})
