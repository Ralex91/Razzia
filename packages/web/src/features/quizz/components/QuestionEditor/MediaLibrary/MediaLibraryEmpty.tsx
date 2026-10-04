import { Upload } from "lucide-react"
import { useTranslation } from "react-i18next"

const MediaLibraryEmpty = () => {
  const { t } = useTranslation()

  return (
    <div className="border-accent text-muted-foreground flex h-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-center">
      <Upload className="size-10" />
      <p className="text-foreground font-semibold">
        {t("quizz:media.libraryEmpty")}
      </p>
      <p className="text-sm">{t("quizz:media.dropHint")}</p>
    </div>
  )
}

export default MediaLibraryEmpty
