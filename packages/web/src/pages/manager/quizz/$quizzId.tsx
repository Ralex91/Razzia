import Loader from "@razzia/web/components/Loader"
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
      <div className="bg-muted flex h-svh items-center justify-center">
        <Loader className="text-primary max-h-23" />
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
