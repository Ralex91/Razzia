import { zodResolver } from "@hookform/resolvers/zod"
import { QUESTION_TYPES } from "@razzia/common/constants"
import type { Question, QuizzWithId } from "@razzia/common/types/game"
import {
  quizzValidator,
  type QuizzValidated,
} from "@razzia/common/validators/quizz"
import {
  createContext,
  useContext,
  useState,
  type PropsWithChildren,
} from "react"
import {
  FormProvider,
  useFieldArray,
  useForm,
  useWatch,
  type FieldPath,
} from "react-hook-form"

export interface QuizzFormValues {
  subject: string
  questions: Question[]
}

interface QuizzEditorContextType {
  quizzId: string | null
  questions: Question[]
  questionIds: string[]
  currentIndex: number
  currentQuestion: Question
  currentQuestionId: string
  setCurrentIndex: (_index: number) => void
  addQuestion: () => void
  removeQuestion: (_index: number) => void
  reorderQuestions: (_from: number, _to: number) => void
  updateQuestion: (_index: number, _updates: Partial<Question>) => void
  questionPath: <K extends FieldPath<Question>>(
    _field: K,
  ) => `questions.${number}.${K}`
}

const QuizzEditorContext = createContext<QuizzEditorContextType | null>(null)

const defaultQuestion = (): Question => ({
  type: QUESTION_TYPES.SINGLE,
  question: "",
  answers: ["", ""],
  solutions: [0],
  cooldown: 5,
  time: 20,
})

const clampIndex = (index: number, length: number) =>
  Math.max(0, Math.min(index, length - 1))

type QuizzEditorProviderProps = PropsWithChildren<{
  initialData?: QuizzWithId
}>

export const QuizzEditorProvider = ({
  children,
  initialData,
}: QuizzEditorProviderProps) => {
  const form = useForm<QuizzFormValues, unknown, QuizzValidated>({
    resolver: zodResolver(quizzValidator),
    defaultValues: {
      subject: initialData?.subject ?? "Untitled Quizz",
      questions: initialData ? initialData.questions : [defaultQuestion()],
    },
  })

  const { control, getValues, setValue, formState } = form
  const { fields, append, remove, move } = useFieldArray({
    control,
    name: "questions",
  })
  const [currentIndex, setCurrentIndex] = useState(0)

  const questions = useWatch({ control, name: "questions" })
  const safeIndex = clampIndex(currentIndex, questions.length)
  const currentQuestion = questions[safeIndex]
  const questionIds = fields.map((field) => field.id)

  const addQuestion = () => {
    append(defaultQuestion())
    setCurrentIndex(questions.length)
  }

  const removeQuestion = (index: number) => {
    remove(index)

    setCurrentIndex((current) => {
      if (current < index) {
        return current
      }

      if (current > index) {
        return current - 1
      }

      return clampIndex(current, questions.length - 1)
    })
  }

  const reorderQuestions = (from: number, to: number) => {
    move(from, to)
    setCurrentIndex(to)
  }

  const questionPath = <K extends FieldPath<Question>>(field: K) =>
    `questions.${currentIndex}.${field}` as const

  const updateQuestion = (index: number, updates: Partial<Question>) => {
    setValue(
      `questions.${index}`,
      { ...getValues(`questions.${index}`), ...updates },
      { shouldValidate: formState.isSubmitted, shouldDirty: true },
    )
  }

  return (
    <FormProvider {...form}>
      <QuizzEditorContext.Provider
        value={{
          quizzId: initialData?.id ?? null,
          questions,
          questionIds,
          currentIndex,
          currentQuestion,
          currentQuestionId: questionIds[safeIndex],
          setCurrentIndex,
          addQuestion,
          removeQuestion,
          reorderQuestions,
          updateQuestion,
          questionPath,
        }}
      >
        {children}
      </QuizzEditorContext.Provider>
    </FormProvider>
  )
}

export const useQuizzEditor = () => {
  const ctx = useContext(QuizzEditorContext)

  if (!ctx) {
    throw new Error("useQuizzEditor must be used inside QuizzEditorProvider")
  }

  return ctx
}
