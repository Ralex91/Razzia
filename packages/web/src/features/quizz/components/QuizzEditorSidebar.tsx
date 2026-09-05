import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  restrictToFirstScrollableAncestor,
  restrictToVerticalAxis,
} from "@dnd-kit/modifiers"
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import Button from "@razzia/web/components/Button"
import QuizzEditorCard from "@razzia/web/features/quizz/components/QuizzEditorCard"
import type { Question } from "@razzia/common/types/game"
import {
  useQuizzEditor,
  type QuizzFormValues,
} from "@razzia/web/features/quizz/contexts/quizz-editor-context"
import clsx from "clsx"
import { Plus } from "lucide-react"
import { useRef } from "react"
import { useFormContext } from "react-hook-form"
import { useTranslation } from "react-i18next"

interface SortableItemProps {
  id: string
  question: Question
  index: number
  isActive: boolean
  isInvalid: boolean
  canDelete: boolean
  onClick: () => void
  onDelete: () => void
}

const SortableItem = ({
  id,
  question,
  index,
  isActive,
  isInvalid,
  canDelete,
  onClick,
  onDelete,
}: SortableItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      className={clsx(isDragging && "shadow-lg")}
    >
      <QuizzEditorCard
        question={question}
        index={index}
        isActive={isActive}
        isInvalid={isInvalid}
        canDelete={canDelete}
        onClick={onClick}
        onDelete={onDelete}
      />
    </div>
  )
}

const QuizzEditorSidebar = () => {
  const {
    questions,
    questionIds,
    currentIndex,
    setCurrentIndex,
    addQuestion,
    removeQuestion,
    reorderQuestions,
  } = useQuizzEditor()
  const {
    formState: { errors },
  } = useFormContext<QuizzFormValues>()
  const { t } = useTranslation()

  const isDragging = useRef(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  )

  const handleSlideClick = (index: number) => () => {
    if (!isDragging.current) {
      setCurrentIndex(index)
    }
  }

  const handleDelete = (index: number) => () => {
    removeQuestion(index)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    isDragging.current = false
    const { active, over } = event

    if (!over || active.id === over.id) {
      return
    }

    const from = questionIds.findIndex((id) => id === active.id)
    const to = questionIds.findIndex((id) => id === over.id)
    reorderQuestions(from, to)
  }

  return (
    <aside className="bg-background z-10 m-3 flex w-72 shrink-0 flex-col gap-2 overflow-auto rounded-xl p-3 shadow-sm">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[restrictToVerticalAxis, restrictToFirstScrollableAncestor]}
        onDragStart={() => {
          isDragging.current = true
        }}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={questionIds}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex flex-col gap-2">
            {questions.map((question, index) => (
              <SortableItem
                key={questionIds[index]}
                id={questionIds[index]}
                question={question}
                index={index}
                isActive={currentIndex === index}
                isInvalid={Boolean(errors.questions?.[index])}
                canDelete={questions.length > 1}
                onClick={handleSlideClick(index)}
                onDelete={handleDelete(index)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <Button
        onClick={addQuestion}
        className="bg text-md bg-accent text-accent-foreground mt-1 mb-8 flex items-center justify-center gap-1"
      >
        <Plus className="size-6" />
        {t("quizz:addQuestion")}
      </Button>
    </aside>
  )
}

export default QuizzEditorSidebar
