import Background from "@razzia/web/components/Background"
import Button from "@razzia/web/components/Button"
import Card from "@razzia/web/components/Card"
import { useRouter } from "@tanstack/react-router"
import { CircleX } from "lucide-react"
import { useTranslation } from "react-i18next"

const ErrorPage = ({ error }: { error: unknown }) => {
  const { t } = useTranslation()
  const router = useRouter()
  const message = error instanceof Error ? error.message : null

  return (
    <Background>
      <Card className="max-w-md gap-4 text-center">
        <CircleX className="mx-auto size-12 text-red-500" />
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-bold text-gray-800">
            {t("errors:route.title")}
          </h1>
          <p className="text-muted-foreground text-sm">
            {t("errors:route.description")}
          </p>
        </div>
        {message && (
          <pre className="bg-accent max-h-60 overflow-auto rounded-md px-3 py-2 text-left font-mono text-sm wrap-break-word">
            {message}
          </pre>
        )}
        <Button onClick={() => router.navigate({ to: "/" })}>
          {t("errors:route.back")}
        </Button>
      </Card>
    </Background>
  )
}

export default ErrorPage
