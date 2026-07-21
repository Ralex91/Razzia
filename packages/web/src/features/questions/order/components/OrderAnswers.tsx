import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  restrictToVerticalAxis,
} from "@dnd-kit/modifiers"
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import Button from "@razzia/web/components/Button"
import {
  ANSWERS_COLORS,
  ANSWERS_LABELS,
} from "@razzia/web/features/game/utils/constants"
import type { AnswerComponentProps } from "@razzia/web/features/questions/types"
import { GripVertical } from "lucide-react"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

interface SortableAnswerProps {
  id: string
  answer: string
  colorIndex: number
  label: string
}

const SortableAnswer = ({ id, answer, colorIndex, label }: SortableAnswerProps) => {
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
      className={`flex items-center gap-3 rounded-2xl px-4 py-5 ${ANSWERS_COLORS[colorIndex]} ${isDragging ? "z-50 shadow-xl" : ""}`}
    >
      <button
        className="flex size-7 shrink-0 cursor-grab touch-none items-center justify-center rounded-md bg-black/20 active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4 text-white" />
      </button>
      <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-black/20 text-sm font-bold text-white">
        {label}
      </span>
      <span className="font-semibold text-white drop-shadow-md">
        {answer}
      </span>
    </div>
  )
}

const shuffle = <T,>(arr: T[]): T[] => {
  const copy = [...arr]

  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }

  return copy
}

const OrderAnswers = ({ answers, onSubmit, readOnly }: AnswerComponentProps) => {
  const [items, setItems] = useState<string[]>(() =>
    readOnly ? answers : shuffle(answers),
  )
  const { t } = useTranslation()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) return

    const oldIndex = items.indexOf(active.id as string)
    const newIndex = items.indexOf(over.id as string)

    setItems((prev) => {
      const next = [...prev]
      const [moved] = next.splice(oldIndex, 1)
      next.splice(newIndex, 0, moved)

      return next
    })
  }

  const handleSubmit = () => {
    const answerKeys = items.map((ans) => answers.indexOf(ans))
    onSubmit(answerKeys)
  }

  return (
    <div className="mx-auto mb-4 flex w-full max-w-2xl flex-col gap-2 px-2">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[restrictToVerticalAxis]}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={items}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex flex-col gap-2">
            {items.map((answer, i) => (
              <SortableAnswer
                key={answer}
                id={answer}
                answer={answer}
                index={i}
                colorIndex={i % 4}
                label={ANSWERS_LABELS[i]}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {!readOnly && (
        <Button onClick={handleSubmit} className="mx-auto mt-4 w-full max-w-xs">
          {t("game:confirm")}
        </Button>
      )}
    </div>
  )
}

export default OrderAnswers
