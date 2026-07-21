import { EVENTS, QUESTION_TYPES } from "@razzia/common/constants"
import type { SocketContext } from "@razzia/socket/handlers/types"
import {
  deleteQuizz,
  getQuizzById,
  saveQuizz,
  updateQuizz,
} from "@razzia/socket/services/config"
import manager, { emitConfig } from "@razzia/socket/services/manager"

export const quizzSocketHandlers = ({ socket }: SocketContext) => {
  socket.on(
    EVENTS.QUIZZ.GET,
    manager.withAuth(socket, (id) => {
      try {
        const quizz = getQuizzById(id)

        socket.emit(EVENTS.QUIZZ.DATA, quizz)
      } catch (error) {
        console.error("Failed to get quizz:", error)
        socket.emit(EVENTS.QUIZZ.ERROR, "errors:quizz.notFound")
      }
    }),
  )

  socket.on(
    EVENTS.QUIZZ.SAVE,
    manager.withAuth(socket, (data) => {
      try {
        const { id } = saveQuizz(data)

        socket.emit(EVENTS.QUIZZ.SAVE_SUCCESS, { id })
        emitConfig(socket)
      } catch (error) {
        console.error("Failed to save quizz:", error)
        const message =
          error instanceof Error ? error.message : "errors:quizz.failedToSave"
        socket.emit(EVENTS.QUIZZ.ERROR, message)
      }
    }),
  )

  socket.on(
    EVENTS.QUIZZ.DELETE,
    manager.withAuth(socket, (id) => {
      try {
        deleteQuizz(id)

        emitConfig(socket)
      } catch (error) {
        console.error("Failed to delete quizz:", error)
        socket.emit(EVENTS.QUIZZ.ERROR, "errors:quizz.failedToDelete")
      }
    }),
  )

  socket.on(
    EVENTS.QUIZZ.UPDATE,
    manager.withAuth(socket, ({ id, ...data }) => {
      try {
        const { id: newId } = updateQuizz(id, data)

        socket.emit(EVENTS.QUIZZ.UPDATE_SUCCESS, { id: newId })
        emitConfig(socket)
      } catch (error) {
        console.error("Failed to update quizz:", error)
        const message =
          error instanceof Error ? error.message : "errors:quizz.failedToUpdate"
        socket.emit(EVENTS.QUIZZ.ERROR, message)
      }
    }),
  )

  socket.on(
    EVENTS.QUIZZ.IMPORT_FROM_KAHOOT,
    manager.withAuth(socket, async (url) => {
      try {
        const uuidMatch = url.match(
          /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i,
        )

        if (!uuidMatch) {
          socket.emit(EVENTS.QUIZZ.ERROR, "errors:quizz.invalidKahootUrl")

          return
        }

        const response = await fetch(
          `https://create.kahoot.it/rest/kahoots/${uuidMatch[0].toLowerCase()}`,
        )

        if (!response.ok) {
          throw new Error(`Kahoot API returned ${response.status}`)
        }

        const data: { title?: string; questions?: unknown[] } =
          await response.json()

        if (!data.questions || data.questions.length === 0) {
          socket.emit(EVENTS.QUIZZ.ERROR, "errors:quizz.noKahootQuestions")

          return
        }

        let skippedCount = 0

        const convertQuestion = (kq: Record<string, unknown>) => {
          const choices = (kq.choices as Array<Record<string, unknown>>) ?? []
          const kahootType = String(kq.type ?? "").trim()
          const questionText = String(kq.question ?? "")
            .replace(/<[^>]*>/g, "")
            .trim()
          const hasImage = kq.image && typeof kq.image === "string"
          const mediaObj = hasImage
            ? ({ media: { type: "image", url: kq.image as string } } as Record<
                string,
                unknown
              >)
            : ({} as Record<string, unknown>)

          // Content slides (informational) — no points, tap-to-continue
          if (kahootType === "content") {
            const title = String(kq.title ?? "").trim()
            const rawDesc = String(kq.description ?? "").trim()
            const desc = rawDesc.replace(/<[^>]*>/g, "").trim()
            const slideText = [title, desc].filter(Boolean).join("\n\n")

            return {
              type: QUESTION_TYPES.MULTI,
              question: slideText || "(slide informativa)",
              answers: ["Continua", "Continua"],
              solutions: [0],
              cooldown: 3,
              time: 5,
              maxPoints: 0,
              penalty: 0,
              ...mediaObj,
            }
          }

          // Video questions — skip (YouTube etc.)
          const video = kq.video as Record<string, unknown> | undefined

          if (video?.fullUrl && String(video.fullUrl).trim()) {
            skippedCount++

            return null
          }

          // Extract answer text and optional image per choice
          const answers: string[] = []
          const answerImages: string[] = []
          const labels = ["A", "B", "C", "D"]

          for (let ci = 0; ci < choices.length; ci++) {
            const c = choices[ci] as Record<string, unknown>
            const text = String(c.answer ?? "").trim()
            const img = c.image as Record<string, unknown> | undefined
            const imgId = String(img?.id ?? "").trim()

            // Always check for choice image
            if (imgId) {
              answerImages.push(`https://media.kahoot.it/${imgId}`)
            }

            if (text) {
              answers.push(text)
            } else if (imgId) {
              // Image-only choice: use short label as text
              answers.push(labels[ci] || "")
            } else {
              answers.push("")
            }
          }
          const answerImagesEntries =
            answerImages.length > 0 ? { answerImages } : ({} as Record<string, unknown>)
          const solutions = choices
            .map((c: Record<string, unknown>, i: number) =>
              c.correct ? i : -1,
            )
            .filter((i: number) => i !== -1)

          const time = Math.max(5, Math.round(Number(kq.time ?? 10000) / 1000))
          const kahootMultiplier = Number(kq.pointsMultiplier ?? 1)
          const maxPoints =
            kahootMultiplier > 1 ? kahootMultiplier * 1000 : undefined
          const maxPointsEntries =
            maxPoints !== undefined
              ? ({ maxPoints } as Record<string, unknown>)
              : ({} as Record<string, unknown>)
          let question = questionText

          // Survey/poll: all answers are valid, import as multi
          if (kahootType === "survey") {
            return {
              type: QUESTION_TYPES.MULTI,
              question,
              answers,
              solutions: answers.map((_: string, i: number) => i),
              cooldown: 5,
              time,
              ...answerImagesEntries,
              ...maxPointsEntries,
              ...mediaObj,
            }
          }

          // Jumble/order: player must arrange items in correct sequence
          if (kahootType === "jumble") {
            return {
              type: QUESTION_TYPES.ORDER,
              question,
              answers,
              solutions: answers.map((_: string, i: number) => i),
              cooldown: 5,
              time,
              ...answerImagesEntries,
              ...maxPointsEntries,
              ...mediaObj,
            }
          }

          // Open-ended: import as text input type
          if (kahootType === "open_ended" || answers.length <= 1) {
            const correctAnswer = answers[0] || ""

            if (!correctAnswer) {
              skippedCount++

              return null
            }

            return {
              type: QUESTION_TYPES.TEXT,
              question,
              answers: [correctAnswer, correctAnswer],
              solutions: [0],
              cooldown: 5,
              time: Math.min(time, 60),
              ...maxPointsEntries,
              ...mediaObj,
            }
          }

          const type =
            solutions.length > 1
              ? QUESTION_TYPES.MULTI
              : QUESTION_TYPES.SINGLE

          return {
            type,
            question,
            answers,
            solutions,
            cooldown: 5,
            time,
            ...answerImagesEntries,
            ...maxPointsEntries,
            ...mediaObj,
          }
        }

        const questions = data.questions
          .map((q: unknown) => convertQuestion(q as Record<string, unknown>))
          .filter(Boolean)

        if (questions.length === 0) {
          socket.emit(EVENTS.QUIZZ.ERROR, "errors:quizz.noKahootQuestions")

          return
        }

        socket.emit(EVENTS.QUIZZ.IMPORT_FROM_KAHOOT_RESULT, {
          title: data.title ?? "Imported Quizz",
          questions,
          skippedCount,
        })
      } catch (error) {
        console.error("Kahoot import failed:", error)
        socket.emit(EVENTS.QUIZZ.ERROR, "errors:quizz.kahootImportFailed")
      }
    }),
  )
}
