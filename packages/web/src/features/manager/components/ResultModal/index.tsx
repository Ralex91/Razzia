import type { GameResult } from "@razzia/common/types/game"
import ResultModalAnswers from "@razzia/web/features/manager/components/ResultModal/ResultModalAnswers"
import ResultModalHeader from "@razzia/web/features/manager/components/ResultModal/ResultModalHeader"
import ResultModalStats from "@razzia/web/features/manager/components/ResultModal/ResultModalStats"
import ResultModalTable from "@razzia/web/features/manager/components/ResultModal/ResultModalTable"
import { ResultModalProvider } from "@razzia/web/features/manager/contexts/result-modal-context"
import { useEffect } from "react"

interface Props {
  result: GameResult
  onClose: () => void
}

const ResultModal = ({ result, onClose }: Props) => {
  useEffect(() => {
    document.body.style.overflow = "hidden"

    return () => {
      document.body.style.overflow = ""
    }
  }, [])

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-background flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl shadow-2xl">
        <ResultModalProvider result={result} onClose={onClose}>
          <ResultModalHeader />
          <ResultModalAnswers />
          <ResultModalStats />
          <div className="min-h-0 flex-1 overflow-y-auto">
            <ResultModalTable />
          </div>
        </ResultModalProvider>
      </div>
    </div>
  )
}

export default ResultModal
