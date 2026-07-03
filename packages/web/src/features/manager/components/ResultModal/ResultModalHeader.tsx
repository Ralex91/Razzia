import { useResultModal } from "@razzia/web/features/manager/contexts/result-modal-context"
import { ChevronLeft, ChevronRight, X } from "lucide-react"
import { useTranslation } from "react-i18next"

const ResultModalHeader = () => {
  const { result, questionIndex, total, goNext, goPrev, onClose } =
    useResultModal()
  const { t } = useTranslation()

  return (
    <div className="flex shrink-0 items-center gap-3 border-b-2 border-gray-200 px-5 py-3">
      <h2 className="flex-1 truncate text-base font-bold text-gray-700">
        {result.subject}
      </h2>
      <div className="flex shrink-0 items-center gap-1">
        <span className="text-sm text-gray-400">
          {questionIndex + 1}
          {t("manager:result.paginationOf")}
          {total}
        </span>
        <button
          disabled={questionIndex === 0}
          onClick={goPrev}
          className="rounded p-1 text-gray-500 hover:bg-gray-100 disabled:opacity-30"
        >
          <ChevronLeft className="size-5" />
        </button>
        <button
          disabled={questionIndex === total - 1}
          onClick={goNext}
          className="rounded p-1 text-gray-500 hover:bg-gray-100 disabled:opacity-30"
        >
          <ChevronRight className="size-5" />
        </button>
        <button
          onClick={onClose}
          className="ml-1 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          <X className="size-5" />
        </button>
      </div>
    </div>
  )
}

export default ResultModalHeader
