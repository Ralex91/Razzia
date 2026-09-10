import Skeleton from "@razzia/web/components/Skeleton"
import { quizzQuery } from "@razzia/web/features/manager/queries"
import QuestionEditor from "@razzia/web/features/quizz/components/QuestionEditor"
import QuizzEditorHeader from "@razzia/web/features/quizz/components/QuizzEditorHeader"
import QuizzEditorSidebar from "@razzia/web/features/quizz/components/QuizzEditorSidebar"
import { QuizzEditorProvider } from "@razzia/web/features/quizz/contexts/quizz-editor-context"
import { ApiError } from "@razzia/web/lib/api"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useEffect, useRef } from "react"
import toast from "react-hot-toast"
import { useTranslation } from "react-i18next"

const QuizzEditPage = () => {
  const { quizzId } = Route.useParams()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { data: quizz, isPending, error } = useQuery(quizzQuery(quizzId))

  const hasNotifiedRef = useRef(false)

  useEffect(() => {
    if (!error || hasNotifiedRef.current) {
      return
    }

    hasNotifiedRef.current = true
    toast.error(
      t(error instanceof ApiError ? error.key : "errors:quizz.notFound"),
    )
    navigate({ to: "/manager/config" })
  }, [error, navigate, t])

  if (isPending) {
    return (
      <div className="bg-muted relative flex h-svh flex-col">
        <header className="bg-background z-20 flex h-14 shrink-0 items-center justify-between gap-4 px-4 shadow-sm">
          <Skeleton className="h-9 w-64" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-10 w-20" />
          </div>
        </header>
        <div className="flex flex-1 overflow-hidden">
          <aside className="bg-background z-10 m-3 flex w-72 shrink-0 flex-col gap-2 rounded-xl p-3 shadow-sm">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </aside>
          <main className="mx-auto flex max-w-7xl flex-1 flex-col gap-4 p-6">
            <Skeleton className="h-14" />
            <Skeleton className="h-64" />
            <Skeleton className="flex-1" />
          </main>
        </div>
      </div>
    )
  }

  if (!quizz) {
    return <div className="bg-muted h-svh" />
  }

  return (
    <QuizzEditorProvider initialData={quizz}>
      <div className="bg-muted relative flex h-svh flex-col">
        <QuizzEditorHeader />
        <div className="flex flex-1 overflow-hidden">
          <QuizzEditorSidebar />
          <QuestionEditor />
        </div>
      </div>
    </QuizzEditorProvider>
  )
}

export const Route = createFileRoute("/manager/quizz/$quizzId")({
  component: QuizzEditPage,
})
