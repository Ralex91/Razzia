import { EVENTS } from "@razzia/common/constants"
import type { GameResult } from "@razzia/common/types/game"
import AlertDialog from "@razzia/web/components/AlertDialog"
import {
  useEvent,
  useSocket,
} from "@razzia/web/features/game/contexts/socket-context"
import ResultModal from "@razzia/web/features/manager/components/ResultModal"
import { useConfig } from "@razzia/web/features/manager/contexts/config-context"
import { Trash2 } from "lucide-react"
import { useCallback, useState } from "react"
import toast from "react-hot-toast"
import { useTranslation } from "react-i18next"

const formatDate = (iso: string) => {
  const d = new Date(iso)

  return `${d.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })} · ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
}

const ConfigResults = () => {
  const { socket } = useSocket()
  const { results } = useConfig()
  const [selectedResult, setSelectedResult] = useState<GameResult | null>(null)
  const { t } = useTranslation()

  useEvent(
    EVENTS.RESULTS.DATA,
    useCallback((data) => setSelectedResult(data), []),
  )

  const handleOpen = (id: string) => () => {
    socket.emit(EVENTS.RESULTS.GET, id)
  }

  const handleDelete = (id: string) => () => {
    socket.emit(EVENTS.RESULTS.DELETE, id)
    toast.success(t("manager:result.deleted"))
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 space-y-2 overflow-auto p-0.5">
        {results.map((r) => (
          <div
            key={r.id}
            className="flex h-14 w-full items-center justify-between rounded-md border-2 border-gray-200 p-3"
          >
            <button
              className="min-w-0 flex-1 text-left"
              onClick={handleOpen(r.id)}
            >
              <p className="truncate font-medium text-gray-700">{r.subject}</p>
              <p className="text-xs text-gray-400">
                {formatDate(r.date)} -{" "}
                {t("manager:result.playerCount", { count: r.playerCount })}
              </p>
            </button>
            <AlertDialog
              trigger={
                <button className="ml-2 shrink-0 rounded-sm p-2 hover:bg-red-600/10">
                  <Trash2 className="size-4 stroke-red-500" />
                </button>
              }
              title={t("manager:result.delete")}
              description={t("manager:result.deleteConfirm", {
                name: r.subject,
              })}
              confirmLabel={t("common:delete")}
              onConfirm={handleDelete(r.id)}
            />
          </div>
        ))}

        {results.length === 0 && (
          <p className="my-8 text-center text-gray-500">
            {t("manager:result.none")}
          </p>
        )}
      </div>

      {selectedResult && (
        <ResultModal
          result={selectedResult}
          onClose={() => setSelectedResult(null)}
        />
      )}
    </div>
  )
}

export default ConfigResults
