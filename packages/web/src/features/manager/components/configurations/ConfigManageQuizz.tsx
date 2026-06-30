import { EVENTS } from "@razzia/common/constants"
import AlertDialog from "@razzia/web/components/AlertDialog"
import Button from "@razzia/web/components/Button"
import {
  useEvent,
  useSocket,
} from "@razzia/web/features/game/contexts/socket-context"
import { useConfig } from "@razzia/web/features/manager/contexts/config-context"
import { useNavigate } from "@tanstack/react-router"
import { Download, SquarePen, Trash2, Upload } from "lucide-react"
import { type ChangeEvent, useCallback, useRef } from "react"
import toast from "react-hot-toast"
import { useTranslation } from "react-i18next"

const downloadJson = (data: unknown, filename: string) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")

  a.href = url
  a.download = filename
  a.click()

  URL.revokeObjectURL(url)
}

const ConfigManageQuizz = () => {
  const { quizz } = useConfig()
  const { socket } = useSocket()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { t } = useTranslation()
  const pendingExportId = useRef<string | null>(null)

  useEvent(EVENTS.QUIZZ.ERROR, (message) => {
    toast.error(t(message))
  })

  useEvent(
    EVENTS.QUIZZ.DATA,
    useCallback((data) => {
      if (data.id !== pendingExportId.current) {
        return
      }

      pendingExportId.current = null

      const { id: _id, ...quizzData } = data
      downloadJson(quizzData, `${data.subject}.json`)
    }, []),
  )

  const handleDelete = (id: string) => () => {
    socket.emit(EVENTS.QUIZZ.DELETE, id)
    toast.success(t("manager:quizz.deleted"))
  }

  const handleExport = (id: string) => () => {
    pendingExportId.current = id
    socket.emit(EVENTS.QUIZZ.GET, id)
  }

  const handleImport = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]

    if (!file) {
      return
    }

    const reader = new FileReader()

    reader.onload = (event) => {
      try {
        const data: unknown = JSON.parse(event.target?.result as string)
        socket.emit(EVENTS.QUIZZ.SAVE, data)
      } catch {
        toast.error("Invalid JSON file")
      }
    }

    reader.readAsText(file)
    e.target.value = ""
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mb-4 flex shrink-0 gap-2">
        <Button
          className="flex-1"
          onClick={() => navigate({ to: "/manager/quizz" })}
        >
          {t("manager:quizz.create")}
        </Button>
        <Button
          className="aspect-square bg-gray-200 px-3 text-gray-600"
          onClick={() => fileInputRef.current?.click()}
          title={t("manager:quizz.import")}
        >
          <Upload className="size-4" />
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={handleImport}
        />
      </div>
      <div className="min-h-0 flex-1 space-y-2 overflow-auto p-0.5">
        {quizz.map((q) => (
          <div
            key={q.id}
            className="flex h-12 w-full items-center justify-between rounded-md pr-1.5 pl-3 outline outline-gray-300"
          >
            <p className="truncate">{q.subject}</p>
            <div className="flex gap-0.5">
              <button
                className="rounded-sm p-2 text-gray-600 hover:bg-gray-600/10"
                onClick={() =>
                  navigate({
                    to: "/manager/quizz/$quizzId",
                    params: { quizzId: q.id },
                  })
                }
              >
                <SquarePen className="size-4" />
              </button>

              <button
                className="rounded-sm p-2 text-gray-600 hover:bg-gray-600/10"
                onClick={handleExport(q.id)}
                title={t("manager:quizz.export")}
              >
                <Download className="size-4" />
              </button>

              <AlertDialog
                trigger={
                  <button className="rounded-sm p-2 hover:bg-red-600/10">
                    <Trash2 className="size-4 stroke-red-500" />
                  </button>
                }
                title={t("manager:quizz.delete")}
                description={t("manager:quizz.deleteConfirm", {
                  name: q.subject,
                })}
                confirmLabel={t("common:delete")}
                onConfirm={handleDelete(q.id)}
              />
            </div>
          </div>
        ))}
        {quizz.length === 0 && (
          <p className="my-8 text-center text-gray-500">
            {t("manager:quizz.none")}
          </p>
        )}
      </div>
    </div>
  )
}

export default ConfigManageQuizz
