import { useNavigate } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"
import Background from "@razzia/web/components/Background"
import Button from "@razzia/web/components/Button"

const NotFound = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const handleBack = () => navigate({ to: "/" })

  return (
    <Background>
      <div className="z-10 flex flex-col items-center gap-4 text-center">
        <p className="text-8xl font-bold text-white">404</p>
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-bold text-white">
            {t("errors:notFound.title")}
          </h1>
          <p className="text-sm text-gray-100">
            {t("errors:notFound.description")}
          </p>
        </div>
        <Button onClick={handleBack}>{t("errors:notFound.back")}</Button>
      </div>
    </Background>
  )
}

export default NotFound
