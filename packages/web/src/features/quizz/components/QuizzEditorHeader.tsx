import { EVENTS } from "@razzia/common/constants"
import AlertDialog from "@razzia/web/components/AlertDialog"
import Button from "@razzia/web/components/Button"
import Input from "@razzia/web/components/Input"
import { useAuthStore } from "@razzia/web/features/auth/store"
import {
  useEvent,
  useSocket,
} from "@razzia/web/features/game/contexts/socket-context"
import { useQuizzEditor } from "@razzia/web/features/quizz/contexts/quizz-editor-context"
import { useNavigate } from "@tanstack/react-router"
import { Trash2 } from "lucide-react"
import type { ChangeEvent } from "react"
import toast from "react-hot-toast"
import { useTranslation } from "react-i18next"

const QuizzEditorHeader = () => {
  const { quizzId, ownerId, subject, setSubject, questions } = useQuizzEditor()
  const { isAdmin, user } = useAuthStore()
  const { socket } = useSocket()
  const navigate = useNavigate()
  const { t } = useTranslation()

  // Delete is only meaningful for a persisted quiz, and only owners/admins may
  // do it (the server enforces the same rule via assertIsOwnerOrAdmin).
  const canDelete = Boolean(quizzId) && (isAdmin() || ownerId === user?.id)

  const handleChangeSubject = (e: ChangeEvent<HTMLInputElement>) => {
    setSubject(e.target.value)
  }

  const handleSave = () => {
    if (quizzId) {
      socket.emit(EVENTS.QUIZZ.UPDATE, { id: quizzId, subject, questions })
    } else {
      socket.emit(EVENTS.QUIZZ.SAVE, { subject, questions })
    }
  }

  const handleDelete = () => {
    if (quizzId) {
      socket.emit(EVENTS.QUIZZ.DELETE, quizzId)
    }
  }

  useEvent(EVENTS.QUIZZ.SAVE_SUCCESS, () => {
    toast.success(t("quizz:quizzSaved"))
    navigate({ to: "/manager/config" })
  })

  useEvent(EVENTS.QUIZZ.UPDATE_SUCCESS, (_data) => {
    toast.success(t("quizz:quizzUpdated"))
    navigate({ to: "/manager/config" })
  })

  useEvent(EVENTS.QUIZZ.DELETE_SUCCESS, () => {
    toast.success(t("manager:quizz.deleted"))
    navigate({ to: "/manager/config" })
  })

  useEvent(EVENTS.QUIZZ.ERROR, (message) => {
    toast.error(t(message))
  })

  return (
    <header className="bg-background z-20 flex h-14 items-center justify-between gap-4 px-4 shadow-sm">
      <div className="flex items-center gap-6">
        <Input
          variant="sm"
          className="w-64"
          value={subject}
          onChange={handleChangeSubject}
          placeholder={t("quizz:titleQuizzPlaceholder")}
        />
      </div>

      <div className="flex gap-2">
        {canDelete && (
          <AlertDialog
            trigger={
              <Button className="text-md flex items-center gap-2 bg-red-500 px-4 py-2 font-semibold text-white hover:brightness-95 active:brightness-90">
                <Trash2 className="size-4" />
                {t("manager:quizz.delete")}
              </Button>
            }
            title={t("manager:quizz.delete")}
            description={t("manager:quizz.deleteConfirm", { name: subject })}
            confirmLabel={t("common:delete")}
            onConfirm={handleDelete}
          />
        )}
        <Button
          className="text-md bg-accent text-accent-foreground px-4 py-2 font-semibold"
          onClick={() => navigate({ to: "/manager" })}
        >
          {t("common:exit")}
        </Button>
        <Button className="bg-primary text-md px-4 py-2" onClick={handleSave}>
          {t("common:save")}
        </Button>
      </div>
    </header>
  )
}

export default QuizzEditorHeader
