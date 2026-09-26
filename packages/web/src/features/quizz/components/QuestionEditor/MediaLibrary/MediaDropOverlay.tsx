import { Upload } from "lucide-react"
import { useTranslation } from "react-i18next"

const MediaDropOverlay = () => {
  const { t } = useTranslation()

  return (
    <div className="border-primary bg-primary/10 text-primary pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed backdrop-blur-sm">
      <Upload className="size-10" />
      <p className="font-semibold">{t("quizz:media.dropHere")}</p>
    </div>
  )
}

export default MediaDropOverlay
