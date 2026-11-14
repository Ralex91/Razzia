import { ChevronLeft, ChevronRight, X } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useResultModal } from "@razzia/web/features/manager/contexts/result-modal-context"

const ResultModalHeader = () => {
  const { result, questionIndex, total, goNext, goPrev, onClose } =
    useResultModal()
  const { t } = useTranslation()

  return (
    <div className="flex shrink-0 items-center gap-3 border-b-2 border-accent px-5 py-3">
      <h2 className="flex-1 truncate text-base font-bold text-foreground">
        {result.subject}
      </h2>
      <div className="flex shrink-0 items-center gap-1">
        <span className="text-sm text-muted-foreground">
          {questionIndex + 1}
          {t("manager:result.paginationOf")}
          {total}
        </span>
        <button
          disabled={questionIndex === 0}
          onClick={goPrev}
          title={t("common:previous")}
          className="rounded p-1 text-muted-foreground hover:bg-muted disabled:opacity-30"
        >
          <ChevronLeft className="size-5" />
        </button>
        <button
          disabled={questionIndex === total - 1}
          onClick={goNext}
          title={t("common:next")}
          className="rounded p-1 text-muted-foreground hover:bg-muted disabled:opacity-30"
        >
          <ChevronRight className="size-5" />
        </button>
        <button
          onClick={onClose}
          title={t("common:close")}
          className="ml-1 rounded p-1 text-muted-foreground hover:bg-muted hover:text-accent-foreground"
        >
          <X className="size-5" />
        </button>
      </div>
    </div>
  )
}

export default ResultModalHeader
