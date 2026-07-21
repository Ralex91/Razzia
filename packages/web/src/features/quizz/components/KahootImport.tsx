import { EVENTS } from "@razzia/common/constants"
import Button from "@razzia/web/components/Button"
import {
  useEvent,
  useSocket,
} from "@razzia/web/features/game/contexts/socket-context"
import {
  useQuizzEditor,
  type QuestionWithId,
} from "@razzia/web/features/quizz/contexts/quizz-editor-context"
import { Import, Loader2, X } from "lucide-react"
import { useCallback, useRef, useState } from "react"
import toast from "react-hot-toast"
import { useTranslation } from "react-i18next"
import { v7 as uuid } from "uuid"

// The server already converts Kahoot questions to the app format;
// we just need to add a unique id to each.
const toQuestionWithId = (q: Record<string, unknown>): QuestionWithId => ({
  ...(q as unknown as QuestionWithId),
  id: uuid(),
})

const KahootImport = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [url, setUrl] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { addQuestions } = useQuizzEditor()
  const { socket } = useSocket()
  const { t } = useTranslation()
  const pendingImport = useRef(false)

  useEvent(
    EVENTS.QUIZZ.IMPORT_FROM_KAHOOT_RESULT,
    useCallback(
      (data: { title?: string; questions: unknown[]; skippedCount?: number }) => {
        if (!pendingImport.current) return

        pendingImport.current = false
        setIsLoading(false)

        const questions = data.questions.map(toQuestionWithId)

        addQuestions(questions)

        toast.success(
          t("quizz:kahootImport.success", { count: questions.length }),
        )

        if (data.skippedCount && data.skippedCount > 0) {
          toast(
            t("quizz:kahootImport.skipped", { count: data.skippedCount }),
            { icon: "⚠️" },
          )
        }

        setUrl("")
        setIsOpen(false)
      },
      [addQuestions, t],
    ),
  )

  useEvent(
    EVENTS.QUIZZ.ERROR,
    useCallback(
      (message: string) => {
        if (!pendingImport.current) return

        pendingImport.current = false
        setIsLoading(false)
        toast.error(t(message))
      },
      [t],
    ),
  )

  const handleImport = () => {
    if (!url.trim()) return

    pendingImport.current = true
    setIsLoading(true)
    socket.emit(EVENTS.QUIZZ.IMPORT_FROM_KAHOOT, url.trim())
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="text-accent-foreground hover:bg-accent-foreground/10 mb-2 flex w-full items-center justify-center gap-2 rounded-lg p-2 text-sm font-medium transition-colors"
      >
        <Import className="size-4" />
        {t("quizz:kahootImport.button")}
      </button>
    )
  }

  return (
    <div className="bg-accent/30 mb-2 rounded-lg border p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold">
          {t("quizz:kahootImport.title")}
        </span>
        <button
          onClick={() => {
            setIsOpen(false)
            setUrl("")
          }}
          className="text-muted-foreground hover:text-foreground rounded p-0.5"
        >
          <X className="size-3.5" />
        </button>
      </div>
      <input
        type="text"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder={t("quizz:kahootImport.placeholder")}
        className="bg-background mb-2 w-full rounded-md px-3 py-2 text-sm outline-none ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-blue-500"
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            handleImport()
          }
        }}
      />
      <Button
        size="sm"
        className="w-full"
        onClick={handleImport}
        disabled={isLoading || !url.trim()}
      >
        {isLoading ? (
          <>
            <Loader2 className="size-3.5 animate-spin" />
            {t("quizz:kahootImport.importing")}
          </>
        ) : (
          <>{t("quizz:kahootImport.import")}</>
        )}
      </Button>
    </div>
  )
}

export default KahootImport
