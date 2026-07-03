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
import {
  useQuizzEditor,
  type QuestionWithId,
} from "@razzia/web/features/quizz/contexts/quizz-editor-context"
import clsx from "clsx"
import { Plus } from "lucide-react"
import { useRef } from "react"
import { useTranslation } from "react-i18next"

interface SortableItemProps {
  q: QuestionWithId
  index: number
  isActive: boolean
  canDelete: boolean
  onClick: () => void
  onDelete: () => void
}

const SortableItem = ({
  q,
  index,
  isActive,
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
  } = useSortable({ id: q.id })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      className={clsx(isDragging && "shadow-lg")}
    >
      <QuizzEditorCard
        question={q}
        index={index}
        isActive={isActive}
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
    currentIndex,
    setCurrentIndex,
    addQuestion,
    removeQuestion,
    reorderQuestions,
  } = useQuizzEditor()
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

    const from = questions.findIndex((q) => q.id === active.id)
    const to = questions.findIndex((q) => q.id === over.id)
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
          items={questions.map((q) => q.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex flex-col gap-2">
            {questions.map((q, index) => (
              <SortableItem
                key={q.id}
                q={q}
                index={index}
                isActive={currentIndex === index}
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
