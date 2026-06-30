import { QUESTION_TYPES } from "@razzia/common/constants"
import type { Question, QuizzWithId } from "@razzia/common/types/game"
import {
  createContext,
  useContext,
  useState,
  type PropsWithChildren,
} from "react"
import { v7 as uuid } from "uuid"

export type QuestionWithId = Question & {
  id: string
}

interface QuizzEditorContextType {
  quizzId: string | null
  subject: string
  setSubject: (_subject: string) => void
  questions: QuestionWithId[]
  currentIndex: number
  currentQuestion: QuestionWithId
  setCurrentIndex: (_index: number) => void
  addQuestion: () => void
  removeQuestion: (_index: number) => void
  reorderQuestions: (_from: number, _to: number) => void
  updateQuestion: (_index: number, _updates: Partial<QuestionWithId>) => void
}

const QuizzEditorContext = createContext<QuizzEditorContextType | null>(null)

const defaultQuestion = (): QuestionWithId => ({
  id: uuid(),
  type: QUESTION_TYPES.SINGLE,
  question: "",
  answers: ["", ""],
  solutions: [0],
  cooldown: 5,
  time: 20,
})

const toQuestionWithId = (q: Question): QuestionWithId => ({
  ...q,
  id: uuid(),
})

type QuizzEditorProviderProps = PropsWithChildren<{
  initialData?: QuizzWithId
}>

export const QuizzEditorProvider = ({
  children,
  initialData,
}: QuizzEditorProviderProps) => {
  const [subject, setSubject] = useState(
    initialData?.subject ?? "Untitled Quizz",
  )
  const [questions, setQuestions] = useState<QuestionWithId[]>(
    initialData
      ? initialData.questions.map(toQuestionWithId)
      : [defaultQuestion()],
  )
  const [currentIndex, setCurrentIndex] = useState(0)
  const currentQuestion = questions[currentIndex]

  const addQuestion = () => {
    setQuestions((prev) => [...prev, defaultQuestion()])
    setCurrentIndex(questions.length)
  }

  const removeQuestion = (index: number) => {
    const next = questions.filter((_, i) => i !== index)
    setQuestions(next)
    setCurrentIndex((current) =>
      Math.min(
        Math.max(0, current >= index ? current - 1 : current),
        next.length - 1,
      ),
    )
  }

  const reorderQuestions = (from: number, to: number) => {
    setQuestions((prev) => {
      const next = [...prev]
      const [moved] = next.splice(from, 1)
      next.splice(to, 0, moved)

      return next
    })
    setCurrentIndex(to)
  }

  const updateQuestion = (index: number, updates: Partial<QuestionWithId>) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === index ? { ...q, ...updates } : q)),
    )
  }

  return (
    <QuizzEditorContext.Provider
      value={{
        quizzId: initialData?.id ?? null,
        subject,
        setSubject,
        questions,
        currentIndex,
        currentQuestion,
        setCurrentIndex,
        addQuestion,
        removeQuestion,
        reorderQuestions,
        updateQuestion,
      }}
    >
      {children}
    </QuizzEditorContext.Provider>
  )
}

export const useQuizzEditor = () => {
  const ctx = useContext(QuizzEditorContext)

  if (!ctx) {
    throw new Error("useQuizzEditor must be used inside QuizzEditorProvider")
  }

  return ctx
}
