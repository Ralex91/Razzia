import type { QuizzValidated } from "@razzia/common/validators/quizz"
import AlertDialog from "@razzia/web/components/AlertDialog"
import Button from "@razzia/web/components/Button"
import Loader from "@razzia/web/components/Loader"
import {
  createQuizz,
  deleteQuizz,
  quizzKeys,
  quizzListQuery,
} from "@razzia/web/features/manager/queries"
import { api, ApiError, unwrap } from "@razzia/web/lib/api"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { Download, SquarePen, Trash2, Upload } from "lucide-react"
import { type ChangeEvent, useRef } from "react"
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
  const { data, isPending } = useQuery(quizzListQuery())
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { t } = useTranslation()

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: quizzKeys.all })

  const onError = (error: Error, fallback: string) => {
    toast.error(t(error instanceof ApiError ? error.key : fallback))
  }

  const { mutate: remove } = useMutation({
    mutationFn: deleteQuizz,
    onSuccess: () => {
      invalidate()
      toast.success(t("manager:quizz.deleted"))
    },
    onError: (error) => onError(error, "errors:quizz.failedToDelete"),
  })

  const { mutate: importQuizz } = useMutation({
    mutationFn: createQuizz,
    onSuccess: () => {
      invalidate()
      toast.success(t("quizz:quizzSaved"))
    },
    onError: (error) => onError(error, "errors:quizz.failedToSave"),
  })

  const handleExport = (id: string) => async () => {
    try {
      const { id: _id, ...quizz } = await unwrap(
        api.quizz[":id"].$get({ param: { id } }),
      )

      downloadJson(quizz, `${quizz.subject}.json`)
    } catch (error) {
      onError(error as Error, "errors:quizz.notFound")
    }
  }

  const handleImport = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]

    if (!file) {
      return
    }

    const reader = new FileReader()

    reader.onload = (event) => {
      try {
        importQuizz(
          JSON.parse(event.target?.result as string) as QuizzValidated,
        )
      } catch {
        toast.error("Invalid JSON file")
      }
    }

    reader.readAsText(file)
    e.target.value = ""
  }

  if (isPending) {
    return <Loader className="text-primary mx-auto my-8 max-h-16" />
  }

  const quizz = data?.quizz ?? []

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
          className="bg-accent text-accent-foreground aspect-square px-3"
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
            className="border-accent flex h-12 w-full items-center justify-between rounded-md border-2 p-3 pr-1.5"
          >
            <p className="text-foreground truncate font-medium">{q.subject}</p>
            <div className="flex gap-0.5">
              <button
                className="text-accent-foreground hover:bg-accent-foreground/10 rounded-sm p-2"
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
                className="text-accent-foreground hover:bg-accent-foreground/10 rounded-sm p-2"
                onClick={() => handleExport(q.id)()}
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
                onConfirm={() => remove(q.id)}
              />
            </div>
          </div>
        ))}
        {quizz.length === 0 && (
          <p className="text-muted-foreground my-8 text-center">
            {t("manager:quizz.none")}
          </p>
        )}
      </div>
    </div>
  )
}

export default ConfigManageQuizz
