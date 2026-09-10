import AlertDialog from "@razzia/web/components/AlertDialog"
import Loader from "@razzia/web/components/Loader"
import ResultModal from "@razzia/web/features/manager/components/ResultModal"
import {
  deleteResult,
  resultKeys,
  resultQuery,
  resultsListQuery,
} from "@razzia/web/features/manager/queries"
import { ApiError } from "@razzia/web/lib/api"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Trash2 } from "lucide-react"
import { useState } from "react"
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
  const { data, isPending } = useQuery(resultsListQuery())
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const queryClient = useQueryClient()
  const { t } = useTranslation()

  const { data: selectedResult } = useQuery({
    ...resultQuery(selectedId ?? ""),
    enabled: Boolean(selectedId),
  })

  const { mutate: remove } = useMutation({
    mutationFn: deleteResult,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: resultKeys.all })
      toast.success(t("manager:result.deleted"))
    },
    onError: (error) => {
      toast.error(
        t(error instanceof ApiError ? error.key : "errors:result.notFound"),
      )
    },
  })

  if (isPending) {
    return <Loader className="text-primary mx-auto my-8 max-h-16" />
  }

  const results = data?.results ?? []

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 space-y-2 overflow-auto p-0.5">
        {results.map((r) => (
          <div
            key={r.id}
            className="border-accent flex h-14 w-full items-center justify-between rounded-md border-2 p-3"
          >
            <button
              className="min-w-0 flex-1 text-left"
              onClick={() => setSelectedId(r.id)}
            >
              <p className="text-foreground truncate font-medium">
                {r.subject}
              </p>
              <p className="text-muted-foreground text-xs">
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
              onConfirm={() => remove(r.id)}
            />
          </div>
        ))}

        {results.length === 0 && (
          <p className="text-muted-foreground my-8 text-center">
            {t("manager:result.none")}
          </p>
        )}
      </div>

      {selectedId && selectedResult && (
        <ResultModal
          result={selectedResult}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  )
}

export default ConfigResults
